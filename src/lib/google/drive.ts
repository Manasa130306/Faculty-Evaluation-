import { google } from 'googleapis';
import { Readable } from 'stream';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "1Zwrtf8NLZ0kL_kvPhIfKHuT5mJGLx4fG";

export function isDriveConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.');
  }

  // Handle escaped newlines in env variables
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

export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient();
  
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
export async function getMonthFolder(year: number, month: string): Promise<{
  appraisalFolderId: string;
  yearFolderId: string;
  monthFolderId: string;
  referencesFolderId: string;
}> {
  const drive = getDriveClient();
  const rootId = ROOT_FOLDER_ID;

  let appraisalFolderId = rootId;

  try {
    // Check if root folder itself is named "Faculty Monthly Appraisal"
    const rootMeta = await drive.files.get({
      fileId: rootId,
      fields: 'id, name',
      supportsAllDrives: true,
    });

    if (rootMeta.data.name !== 'Faculty Monthly Appraisal') {
      appraisalFolderId = await findOrCreateFolder('Faculty Monthly Appraisal', rootId);
    }
  } catch {
    // If fetching root metadata fails, attempt to create/find under rootId directly
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
  const facultyFolderId = await findOrCreateFolder(facultyId.trim().toUpperCase(), referencesFolderId);
  const headFolderId = await findOrCreateFolder(`H${headNumber}`, facultyFolderId);
  return headFolderId;
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentId: string
): Promise<{ fileId: string; fileUrl: string }> {
  const drive = getDriveClient();

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
  const drive = getDriveClient();
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (err: any) {
    // If file already deleted or not found (404), do not crash
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
  const drive = getDriveClient();

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
  const drive = getDriveClient();
  
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
