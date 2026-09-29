import { google } from 'googleapis';
import { Readable } from 'stream';
import { createAdminClient } from '@/lib/supabase/admin';

const ROOT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1VIriUG5nqV4CTKmwUZCZR4xQWCGpbcc1';

export function isDriveConfigured(): boolean {
  const hasOAuthEnv = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );

  return hasOAuthEnv;
}

/**
 * Retrieve the OAuth 2.0 refresh token from environment variables or Supabase system_settings.
 */
async function getStoredRefreshToken(): Promise<string | null> {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return process.env.GOOGLE_REFRESH_TOKEN;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_drive_refresh_token')
      .maybeSingle();

    if (!error && data?.value) {
      return data.value;
    }
  } catch (err) {
    console.warn('[Google Drive] Failed to retrieve stored refresh token:', err);
  }

  return null;
}

/**
 * Instantiate Google Drive client using OAuth 2.0 user authorization (Admin Personal Account).
 */
export async function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'https://nsriet.vercel.app/api/auth/google/callback';

  const refreshToken = await getStoredRefreshToken();

  // Primary: OAuth 2.0 User Authorization (Admin Personal Google Account: dhhsantosh@gmail.com)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  throw new Error(
    'Google Drive is not authenticated. Please connect Google Drive via the Admin Dashboard or set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.'
  );
}

export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = await getDriveClient();

  // Look for existing non-trashed folder
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Create folder if not found
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id!;
}

/**
 * Get or create the standard hierarchy:
 * NSRIET Faculty Evaluation -> [Year] -> [Month]
 */
export async function getMonthFolder(
  year: number,
  month: string
): Promise<{
  appraisalFolderId: string;
  yearFolderId: string;
  monthFolderId: string;
}> {
  const drive = await getDriveClient();
  const rootId = ROOT_FOLDER_ID;

  let appraisalFolderId = rootId;

  try {
    const rootMeta = await drive.files.get({
      fileId: rootId,
      fields: 'id, name',
      supportsAllDrives: true,
    });

    if (rootMeta.data.name !== 'NSRIET Faculty Evaluation' && rootMeta.data.name !== 'Faculty Monthly Appraisal') {
      appraisalFolderId = await findOrCreateFolder('NSRIET Faculty Evaluation', rootId);
    }
  } catch {
    appraisalFolderId = await findOrCreateFolder('NSRIET Faculty Evaluation', rootId);
  }

  // 1. Academic Year folder (e.g. 2026-27 or 2026)
  const academicYearName = `${year}-${(year + 1).toString().slice(-2)}`;
  const yearFolderId = await findOrCreateFolder(academicYearName, appraisalFolderId);

  // 2. Month folder (e.g. September)
  const monthFolderId = await findOrCreateFolder(month, yearFolderId);

  return { appraisalFolderId, yearFolderId, monthFolderId };
}

/**
 * Ensure academic month folder exists
 */
export async function ensureAcademicMonthFolder(
  year: number,
  month: string
): Promise<{ monthFolderId: string }> {
  const { monthFolderId } = await getMonthFolder(year, month);
  return { monthFolderId };
}

/**
 * Get or create head-specific evidence folder:
 * [Month] -> [FACULTY_ID - FACULTY_NAME] -> [H1...H8]
 */
export async function getFacultyHeadFolder(
  year: number,
  month: string,
  facultyId: string,
  headNumber: number,
  facultyName?: string
): Promise<string> {
  const { monthFolderId } = await getMonthFolder(year, month);
  const cleanId = facultyId.trim().toUpperCase();
  const cleanName = facultyName ? facultyName.trim().toUpperCase() : cleanId;
  const folderName = facultyName ? `${cleanId} - ${cleanName}` : cleanId;

  const facultyFolderId = await findOrCreateFolder(
    folderName,
    monthFolderId
  );
  const headFolderId = await findOrCreateFolder(`H${headNumber}`, facultyFolderId);
  return headFolderId;
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentId: string
): Promise<{ fileId: string; fileUrl: string }> {
  const drive = await getDriveClient();

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [parentId],
  };

  const media = {
    mimeType,
    body: stream,
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  return {
    fileId: file.data.id!,
    fileUrl: file.data.webViewLink || file.data.webContentLink || '',
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (!fileId) return;
  const drive = await getDriveClient();
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (err: any) {
    if (err?.code !== 404 && err?.status !== 404) {
      throw err;
    }
  }
}

export async function updateExcelReportInDrive(
  buffer: Buffer,
  fileName: string,
  parentId: string
): Promise<{ fileId: string }> {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `name='${fileName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: stream,
  };

  if (res.data.files && res.data.files.length > 0) {
    const fileId = res.data.files[0].id!;
    await drive.files.update({
      fileId,
      media: media,
      supportsAllDrives: true,
    });
    return { fileId };
  } else {
    const fileMetadata = {
      name: fileName,
      parents: [parentId],
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
    });
    return { fileId: file.data.id! };
  }
}

export async function getExcelReportFromDrive(
  fileName: string,
  parentId: string
): Promise<Buffer | null> {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `name='${fileName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    const fileId = res.data.files[0].id!;
    const fileRes = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(fileRes.data as ArrayBuffer);
  }

  return null;
}

export async function getDriveFileMetadataAndStream(fileId: string) {
  const drive = await getDriveClient();

  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );

  return {
    meta: meta.data,
    stream: res.data,
  };
}

/**
 * Long-term Google Drive Archive Preservation:
 * Ensures files remain permanently in Google Drive while website access is managed separately.
 * NOTE: Google Drive archives are NEVER deleted when 2-month website access expires.
 */
export async function archiveReferenceInDrive(fileId: string): Promise<boolean> {
  // Verifies that the file exists and is preserved in Google Drive
  try {
    const drive = await getDriveClient();
    const meta = await drive.files.get({
      fileId,
      fields: 'id, name, trashed',
      supportsAllDrives: true,
    });
    return !meta.data.trashed;
  } catch (err) {
    console.warn(`[Google Drive Archive] Could not verify archive for file ${fileId}:`, err);
    return false;
  }
}

/**
 * Remove website access for expired references while preserving Drive archives.
 */
export async function removeWebsiteReferenceAccess(headMarkId?: string): Promise<{ success: boolean }> {
  // Website metadata access removal is handled safely on the application/database layer.
  // Google Drive files remain permanently intact.
  return { success: true };
}

