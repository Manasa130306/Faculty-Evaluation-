'use server';

import {
  getMonthFolder,
  getFacultyHeadFolder,
  uploadFileToDrive,
  deleteFileFromDrive,
  updateExcelReportInDrive,
  isDriveConfigured,
} from '@/lib/google/drive';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

export async function uploadReferenceFileAction(
  formData: FormData,
  facultyId: string,
  year: number,
  month: string,
  headNumber: number
) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // 1MB Check
    if (file.size > 1 * 1024 * 1024) {
      throw new Error('File size must be 1 MB or less.');
    }

    // Extension Check
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error('Allowed file formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG.');
    }

    if (!isDriveConfigured()) {
      return {
        success: false,
        error: 'Google Drive integration is not configured. Please contact the administrator.',
      };
    }

    const headFolderId = await getFacultyHeadFolder(year, month, facultyId, headNumber);

    // Safe filename e.g. 25TS040053_H2_certificate.pdf
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeName = `${facultyId.toUpperCase()}_H${headNumber}_${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToDrive(
      buffer,
      safeName,
      file.type || 'application/octet-stream',
      headFolderId
    );

    return {
      success: true,
      fileId: result.fileId,
      fileUrl: `/api/drive/file/${result.fileId}`,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      fileName: file.name,
    };
  } catch (err: any) {
    console.error('Drive upload error:', err);
    return { success: false, error: err.message || 'Drive API error' };
  }
}

export async function cleanupReferenceFilesAction(
  facultyId: string,
  year: number,
  month: string,
  fileIds: string[]
) {
  try {
    if (!isDriveConfigured()) {
      return { success: true }; // Skip gracefully if not configured
    }

    for (const id of fileIds) {
      if (id) {
        await deleteFileFromDrive(id);
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error('Drive cleanup error:', err);
    return { success: false, error: err.message || 'Drive API error' };
  }
}

export async function updateMonthlyExcelAction(
  allFaculty: { faculty_id: string; name: string; department: string }[],
  year: number,
  monthName: string,
  evaluations: any
) {
  try {
    if (!isDriveConfigured()) {
      return { success: false, error: 'Google Drive credentials not configured.' };
    }

    const { generateMonthlyWorkbook } = await import('@/lib/excel/export');
    const workbook = await generateMonthlyWorkbook(allFaculty, year, monthName, evaluations);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { monthFolderId } = await getMonthFolder(year, monthName);
    const fileName = `${monthName}_Faculty_Evaluation.xlsx`;

    await updateExcelReportInDrive(buffer, fileName, monthFolderId);
    return { success: true };
  } catch (err: any) {
    console.error('Drive excel update error:', err);
    return { success: false, error: err.message || 'Drive API error' };
  }
}
