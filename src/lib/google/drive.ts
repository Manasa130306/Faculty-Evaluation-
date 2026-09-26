import { google } from 'googleapis';
import { Readable } from 'stream';
import { createClient } from '@/lib/supabase/server';

const ROOT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1Zwrtf8NLZ0kL_kvPhIfKHuT5mJGLx4fG';

export function isDriveConfigured(): boolean {
  const hasOAuthEnv = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    (process.env.GOOGLE_REFRESH_TOKEN || true) // True if OAuth configured (token can also come from DB)
  );

  const hasServiceAccount = !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  );

  return hasOAuthEnv || hasServiceAccount;
}

/**
 * Retrieve the OAuth 2.0 refresh token from environment variables or Supabase system_settings.
 */
async function getStoredRefreshToken(): Promise<string | null> {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return process.env.GOOGLE_REFRESH_TOKEN;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_drive_refresh_token')
      .single();

    if (data?.value) {
      return data.value;
    }
  } catch {
    // If table doesn't exist yet or query fails, return null
  }

  return null;
}

/**
 * Instantiate Google Drive client using OAuth 2.0 user authorization with Service Account fallback.
 */
export async function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'https://facultymarks.vercel.app/api/auth/google/callback';

  const refreshToken = await getStoredRefreshToken();

  // 1. Primary: OAuth 2.0 User Authorization (iqacoffice@nsriet.edu.in)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // 2. Secondary Fallback: Service Account
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
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
 * Root -> Faculty Monthly Appraisal -> [Year] -> [Month] -> References
 */
export async function getMonthFolder(
  year: number,
  month: string
): Promise<{
  appraisalFolderId: string;
  yearFolderId: string;
  monthFolderId: string;
  referencesFolderId: string;
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

    if (rootMeta.data.name !== 'Faculty Monthly Appraisal') {
      appraisalFolderId = await findOrCreateFolder('Faculty Monthly Appraisal', rootId);
    }
  } catch {
    appraisalFolderId = await findOrCreateFolder('Faculty Monthly Appraisal', rootId);
  }

  // 1. Year folder (e.g. 2026)
  const yearFolderId = await findOrCreateFolder(year.toString(), appraisalFolderId);

  // 2. Month folder (e.g. September)
  const monthFolderId = await findOrCreateFolder(month, yearFolderId);

  // 3. References folder inside Month
  const referencesFolderId = await findOrCreateFolder('References', monthFolderId);

  return { appraisalFolderId, yearFolderId, monthFolderId, referencesFolderId };
}

/**
 * Get or create head-specific evidence folder:
 * References -> [FACULTY_ID] -> [H2...H8]
 */
export async function getFacultyHeadFolder(
  year: number,
  month: string,
  facultyId: string,
  headNumber: number
): Promise<string> {
  const { referencesFolderId } = await getMonthFolder(year, month);
  const facultyFolderId = await findOrCreateFolder(
    facultyId.trim().toUpperCase(),
    referencesFolderId
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
