'use server';

import {
  getMonthFolder,
  getFacultyHeadFolder,
  uploadFileToDrive,
  deleteFileFromDrive,
  updateExcelReportInDrive,
  isDriveConfigured,
  archiveReferenceInDrive,
  removeWebsiteReferenceAccess,
} from '@/lib/google/drive';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

export async function uploadReferenceFileAction(
  formData: FormData,
  facultyId: string,
  facultyName: string,
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

    const headFolderId = await getFacultyHeadFolder(year, month, facultyId, headNumber, facultyName);

    const sanitizedName = facultyName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const safeName = `${facultyId.toUpperCase()}_${sanitizedName}_H${headNumber}_${month}${ext}`;

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
      fileName: safeName,
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

export async function cleanupExpiredDocumentsAction(retentionDays: number = 60) {
  try {
    const result = await removeWebsiteReferenceAccess();
    return { success: true, deletedCount: 0 };
  } catch (err: any) {
    console.error('Drive retention cleanup action error:', err);
    return { success: false, error: err.message || 'Retention cleanup error' };
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

    const { monthFolderId } = await getMonthFolder(year, monthName);
    const fileName = `${monthName}_Final_Report.xlsx`;

    const { getExcelReportFromDrive, updateExcelReportInDrive } = await import('@/lib/google/drive');
    const existingBuffer = await getExcelReportFromDrive(fileName, monthFolderId);

    let workbook;
    if (existingBuffer) {
      const { updateMonthlyWorkbook } = await import('@/lib/excel/export');
      const faculty = allFaculty[0];
      const evalKey = `${faculty.faculty_id.toUpperCase()}_${year}_${monthName.toLowerCase()}`;
      const evalData = evaluations[evalKey];
      workbook = await updateMonthlyWorkbook(existingBuffer, faculty, year, monthName, evalData);
    } else {
      const { generateMonthlyWorkbook } = await import('@/lib/excel/export');
      workbook = await generateMonthlyWorkbook(allFaculty, year, monthName, evaluations);
    }

    const newBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await updateExcelReportInDrive(newBuffer, fileName, monthFolderId);
    
    return { success: true };
  } catch (err: any) {
    console.error('Drive excel update error:', err);
    return { success: false, error: err.message || 'Drive API error' };
  }
}


