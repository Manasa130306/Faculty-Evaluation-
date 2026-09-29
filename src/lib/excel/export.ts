import ExcelJS from 'exceljs';
import { FacultySummaryRow, MonthlyEvaluation, Profile, FacultyRecord } from '../types';
import { APPRAISAL_FRAMEWORK, CALENDAR_MONTHS } from '../constants/framework';

/**
 * Robust cross-browser Excel (.xlsx) file download helper using ExcelJS.
 */
export async function downloadExcelJSWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window !== 'undefined') {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    }, 1000);
  }
}

export async function generateMonthlyWorkbook(
  allFaculty: { faculty_id: string; name: string; department: string }[],
  year: number,
  monthName: string,
  evaluations: Record<string, MonthlyEvaluation>
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();
  addMonthlySheet(workbook, allFaculty, year, monthName, evaluations);
  return workbook;
}

// Styling Constants matching SAR Tracker Screenshots
const COLOR_TITLE_BG = 'FF1F3864'; // Dark Navy Blue
const COLOR_HEADER_BG = 'FF203764'; // Deep Blue
const COLOR_HIGHLIGHT_TOTAL_BG = 'FFD9E1F2'; // Light Blue Column Highlight
const COLOR_BORDER_GRAY = 'FFD9D9D9'; // Cell grid border
const COLOR_HEADER_BORDER = 'FF8EA9DB'; // Header cell border

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLOR_BORDER_GRAY } },
  left: { style: 'thin', color: { argb: COLOR_BORDER_GRAY } },
  bottom: { style: 'thin', color: { argb: COLOR_BORDER_GRAY } },
  right: { style: 'thin', color: { argb: COLOR_BORDER_GRAY } },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLOR_HEADER_BORDER } },
  left: { style: 'thin', color: { argb: COLOR_HEADER_BORDER } },
  bottom: { style: 'thin', color: { argb: COLOR_HEADER_BORDER } },
  right: { style: 'thin', color: { argb: COLOR_HEADER_BORDER } },
};

/**
 * Populate a single Monthly Worksheet with exact SAR Tracker styling
 */
function addMonthlySheet(
  workbook: ExcelJS.Workbook,
  allFaculty: { faculty_id: string; name: string; department: string }[],
  year: number,
  monthName: string,
  evaluations: Record<string, MonthlyEvaluation>
): ExcelJS.Worksheet {
  const framework = APPRAISAL_FRAMEWORK[monthName];
  const heads = framework?.heads || {};
  const monthMax = framework?.totalMarks ?? 0;

  const h1Max = heads[1]?.maxMarks ?? 0;
  const h2Max = heads[2]?.maxMarks ?? 0;
  const h3Max = heads[3]?.maxMarks ?? 0;
  const h4Max = heads[4]?.maxMarks ?? 0;
  const h5Max = heads[5]?.maxMarks ?? 0;
  const h6Max = heads[6]?.maxMarks ?? 0;
  const h7Max = heads[7]?.maxMarks ?? 0;
  const h8Max = heads[8]?.maxMarks ?? 0;

  const worksheet = workbook.addWorksheet(monthName, {
    views: [{ showGridLines: true }],
  });

  // Column definitions: A to M (13 columns)
  worksheet.columns = [
    { key: 'faculty_id', width: 16 },
    { key: 'name', width: 26 },
    { key: 'dept', width: 14 },
    { key: 'h1', width: 16 },
    { key: 'h2', width: 16 },
    { key: 'h3', width: 16 },
    { key: 'h4', width: 16 },
    { key: 'h5', width: 16 },
    { key: 'h6', width: 16 },
    { key: 'h7', width: 16 },
    { key: 'h8', width: 16 },
    { key: 'total', width: 18 },
    { key: 'status', width: 16 },
  ];

  // Row 1: Merged Title Row
  const titleText = `FACULTY EVALUATION TRACKER - ${monthName.toUpperCase()} (MAX MARKS: ${monthMax})`;
  worksheet.mergeCells('A1:M1');
  const titleRow = worksheet.getRow(1);
  titleRow.height = 28;
  const titleCell = worksheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: Headers
  const headerValues = [
    'Faculty ID',
    'Faculty Name',
    'Department',
    `Head 1: ${heads[1]?.name || 'Pass % & IQAC Visit'} (${h1Max})`,
    `Head 2: ${heads[2]?.name || 'Mentoring & Backlogs'} (${h2Max})`,
    `Head 3: ${heads[3]?.name || 'Project Expo & Events'} (${h3Max})`,
    `Head 4: ${heads[4]?.name || 'Scopus/WoS Journals'} (${h4Max})`,
    `Head 5: ${heads[5]?.name || 'Patents & Chapters'} (${h5Max})`,
    `Head 6: ${heads[6]?.name || 'Ph.D. Status & Progress'} (${h6Max})`,
    `Head 7: ${heads[7]?.name || 'Organizing FDPs'} (${h7Max})`,
    `Head 8: ${heads[8]?.name || 'Attending FDPs/NPTEL'} (${h8Max})`,
    `Total Monthly Score (${monthMax})`,
    'Status',
  ];

  const headerRow = worksheet.getRow(2);
  headerRow.height = 36;
  headerRow.values = headerValues;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = HEADER_BORDER;
  });

  // Data rows
  allFaculty.forEach((faculty, idx) => {
    const rowNum = idx + 3;
    const cleanId = faculty.faculty_id.trim().toUpperCase();
    const evalKey = `${cleanId}_${year}_${monthName.toLowerCase()}`;
    const evalKeyAlt = `${cleanId}_${year}_${monthName}`;
    const evalData = evaluations[evalKey] || evaluations[evalKeyAlt];

    const h1 = evalData?.head_marks?.[1]?.marks;
    const h2 = evalData?.head_marks?.[2]?.marks;
    const h3 = evalData?.head_marks?.[3]?.marks;
    const h4 = evalData?.head_marks?.[4]?.marks;
    const h5 = evalData?.head_marks?.[5]?.marks;
    const h6 = evalData?.head_marks?.[6]?.marks;
    const h7 = evalData?.head_marks?.[7]?.marks;
    const h8 = evalData?.head_marks?.[8]?.marks;

    let rowTotal = 0;
    let hasAnyMark = false;

    if (evalData?.head_marks && Object.keys(evalData.head_marks).length > 0) {
      for (let h = 1; h <= 8; h++) {
        const val = evalData.head_marks[h]?.marks;
        if (val !== null && val !== undefined) {
          rowTotal += Number(val) || 0;
          hasAnyMark = true;
        }
      }
    } else if (evalData?.total_marks !== null && evalData?.total_marks !== undefined) {
      rowTotal = Number(evalData.total_marks) || 0;
      hasAnyMark = true;
    }

    const evalStatus = evalData?.status?.toLowerCase() === 'complete' ? 'Complete' : evalData?.status?.toLowerCase() === 'pending' || evalData?.status?.toLowerCase() === 'submitted' ? 'Pending' : evalData ? 'Draft' : 'Not Started';

    const row = worksheet.getRow(rowNum);
    row.height = 20;

    row.values = [
      faculty.faculty_id,
      faculty.name,
      faculty.department,
      h1 !== null && h1 !== undefined ? Number(h1) : (h1Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h2 !== null && h2 !== undefined ? Number(h2) : (h2Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h3 !== null && h3 !== undefined ? Number(h3) : (h3Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h4 !== null && h4 !== undefined ? Number(h4) : (h4Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h5 !== null && h5 !== undefined ? Number(h5) : (h5Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h6 !== null && h6 !== undefined ? Number(h6) : (h6Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h7 !== null && h7 !== undefined ? Number(h7) : (h7Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      h8 !== null && h8 !== undefined ? Number(h8) : (h8Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
      hasAnyMark ? rowTotal : 0,
      evalStatus,
    ];

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 12) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 13) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  return worksheet;
}

/**
 * Append or Update a single Faculty row in an existing workbook
 */
export async function updateMonthlyWorkbook(
  existingBuffer: any,
  faculty: { faculty_id: string; name: string; department: string },
  year: number,
  monthName: string,
  evalData: any
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(existingBuffer);

  const sheetName = `${monthName} ${year}`;
  let worksheet = workbook.getWorksheet(sheetName);

  if (!worksheet) {
    // Fallback if worksheet doesn't exist for some reason, we shouldn't reach here normally
    worksheet = workbook.addWorksheet(sheetName);
  }

  const mKey = monthName.toUpperCase();
  const monthFramework = APPRAISAL_FRAMEWORK[mKey] || APPRAISAL_FRAMEWORK['SEPTEMBER'];
  
  const h1Max = monthFramework.heads[1]?.maxMarks || 0;
  const h2Max = monthFramework.heads[2]?.maxMarks || 0;
  const h3Max = monthFramework.heads[3]?.maxMarks || 0;
  const h4Max = monthFramework.heads[4]?.maxMarks || 0;
  const h5Max = monthFramework.heads[5]?.maxMarks || 0;
  const h6Max = monthFramework.heads[6]?.maxMarks || 0;
  const h7Max = monthFramework.heads[7]?.maxMarks || 0;
  const h8Max = monthFramework.heads[8]?.maxMarks || 0;

  const h1 = evalData?.head_marks?.[1]?.marks;
  const h2 = evalData?.head_marks?.[2]?.marks;
  const h3 = evalData?.head_marks?.[3]?.marks;
  const h4 = evalData?.head_marks?.[4]?.marks;
  const h5 = evalData?.head_marks?.[5]?.marks;
  const h6 = evalData?.head_marks?.[6]?.marks;
  const h7 = evalData?.head_marks?.[7]?.marks;
  const h8 = evalData?.head_marks?.[8]?.marks;

  let rowTotal = 0;
  let hasAnyMark = false;

  if (evalData?.head_marks && Object.keys(evalData.head_marks).length > 0) {
    for (let h = 1; h <= 8; h++) {
      const val = evalData.head_marks[h]?.marks;
      if (val !== null && val !== undefined) {
        rowTotal += Number(val) || 0;
        hasAnyMark = true;
      }
    }
  } else if (evalData?.total_marks !== null && evalData?.total_marks !== undefined) {
    rowTotal = Number(evalData.total_marks) || 0;
    hasAnyMark = true;
  }

  // The admin sets it to 'Complete' or 'Finalized' depending on logic.
  // The user says "Complete" in the example output: 26TS040079 | ... | Complete
  const evalStatus = 'Complete'; 

  // Search for existing row
  let targetRowNum = -1;
  const rowCount = worksheet.rowCount;
  
  for (let r = 3; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    if (row.getCell(1).value?.toString().trim().toUpperCase() === faculty.faculty_id.trim().toUpperCase()) {
      targetRowNum = r;
      break;
    }
  }

  if (targetRowNum === -1) {
    targetRowNum = Math.max(3, rowCount + 1);
  }

  const row = worksheet.getRow(targetRowNum);
  row.height = 20;

  row.values = [
    faculty.faculty_id,
    faculty.name,
    faculty.department,
    h1 !== null && h1 !== undefined ? Number(h1) : (h1Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h2 !== null && h2 !== undefined ? Number(h2) : (h2Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h3 !== null && h3 !== undefined ? Number(h3) : (h3Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h4 !== null && h4 !== undefined ? Number(h4) : (h4Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h5 !== null && h5 !== undefined ? Number(h5) : (h5Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h6 !== null && h6 !== undefined ? Number(h6) : (h6Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h7 !== null && h7 !== undefined ? Number(h7) : (h7Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    h8 !== null && h8 !== undefined ? Number(h8) : (h8Max === 0 ? 0 : (hasAnyMark ? 0 : '')),
    hasAnyMark ? rowTotal : 0,
    evalStatus,
  ];

  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
    cell.border = THIN_BORDER;

    if (colNumber === 1) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber === 2) {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    } else if (colNumber === 3) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber === 12) {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber === 13) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });
  
  row.commit();

  return workbook;
}

/**
 * Populate Annual Consolidation Master Worksheet with exact SAR Tracker styling
 */
function addAnnualConsolidationSheet(
  workbook: ExcelJS.Workbook,
  allFaculty: { faculty_id: string; name: string; department: string }[],
  year: number,
  evaluations: Record<string, MonthlyEvaluation>
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet('Annual Consolidation', {
    views: [{ showGridLines: true }],
  });

  // Columns definition: A to P (16 columns)
  worksheet.columns = [
    { key: 'name', width: 26 },
    { key: 'dept', width: 14 },
    { key: 'jan', width: 13 },
    { key: 'feb', width: 13 },
    { key: 'mar', width: 13 },
    { key: 'apr', width: 13 },
    { key: 'may', width: 13 },
    { key: 'jun', width: 13 },
    { key: 'jul', width: 13 },
    { key: 'aug', width: 13 },
    { key: 'sep', width: 13 },
    { key: 'oct', width: 13 },
    { key: 'nov', width: 13 },
    { key: 'dec', width: 13 },
    { key: 'annual_total', width: 20 },
    { key: 'status', width: 25 },
  ];

  // Row 1: Merged Title Row
  worksheet.mergeCells('A1:P1');
  const titleRow = worksheet.getRow(1);
  titleRow.height = 28;
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'IQAC ANNUAL CUMULATIVE SCORE SUMMARY (1000 MARKS MASTER SHEET)';
  titleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: Headers with Month Max Marks
  const headerValues = [
    'Faculty Name',
    'Department',
    'January (70)',
    'February (80)',
    'March (90)',
    'April (110)',
    'May (60)',
    'June (70)',
    'July (70)',
    'August (80)',
    'September (90)',
    'October (90)',
    'November (100)',
    'December (90)',
    'Total Cumulative Score (1000)',
    'Performance Status',
  ];

  const headerRow = worksheet.getRow(2);
  headerRow.height = 36;
  headerRow.values = headerValues;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = HEADER_BORDER;
  });

  const months12 = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Data rows
  allFaculty.forEach((faculty, idx) => {
    const rowNum = idx + 3;
    const cleanId = faculty.faculty_id.trim().toUpperCase();

    let annualTotal = 0;
    const monthlyValues: number[] = [];

    months12.forEach((m) => {
      const evalKey = `${cleanId}_${year}_${m.toLowerCase()}`;
      const evalKeyAlt = `${cleanId}_${year}_${m}`;
      const evalData = evaluations[evalKey] || evaluations[evalKeyAlt];

      let monthScore = 0;
      if (evalData?.head_marks && Object.keys(evalData.head_marks).length > 0) {
        for (let h = 1; h <= 8; h++) {
          const val = evalData.head_marks[h]?.marks;
          if (val !== null && val !== undefined) {
            monthScore += Number(val) || 0;
          }
        }
      } else if (evalData?.total_marks !== null && evalData?.total_marks !== undefined) {
        monthScore = Number(evalData.total_marks) || 0;
      }

      monthlyValues.push(monthScore);
      annualTotal += monthScore;
    });

    const performanceStatus =
      annualTotal >= 750
        ? 'Outstanding'
        : annualTotal >= 500
        ? 'Commendable'
        : 'Deficient / Review Needed';

    const row = worksheet.getRow(rowNum);
    row.height = 20;

    row.values = [
      faculty.name,
      faculty.department,
      ...monthlyValues,
      annualTotal,
      performanceStatus,
    ];

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 15) {
        // Total Cumulative Score highlighted in light blue
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_HIGHLIGHT_TOTAL_BG },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 16) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  return worksheet;
}

// ==========================================
// PUBLIC EXPORT API
// ==========================================

/**
 * Option 1: Export Annual Consolidation Only (1 Sheet)
 */
export async function exportAnnualConsolidationOnlyToExcel(
  allFaculty: (FacultyRecord | Profile)[],
  year: number,
  evaluations: Record<string, MonthlyEvaluation> = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();

  addAnnualConsolidationSheet(workbook, allFaculty, year, evaluations);

  const filename = `Faculty_Annual_Consolidation_${year}-${year + 1}.xlsx`;
  await downloadExcelJSWorkbook(workbook, filename);
}

/**
 * Option 2: Export Selected Month (1 Sheet)
 */
export async function exportSelectedMonthToExcel(
  allFaculty: (FacultyRecord | Profile)[],
  year: number,
  monthName: string,
  evaluations: Record<string, MonthlyEvaluation> = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();

  addMonthlySheet(workbook, allFaculty, year, monthName, evaluations);

  const filename = `Faculty_SAR_Tracker_${monthName}_${year}-${year + 1}.xlsx`;
  await downloadExcelJSWorkbook(workbook, filename);
}

/**
 * Option 3: Export Complete Report (13 Sheets: July to June + Annual Consolidation)
 */
export async function exportCompleteReportToExcel(
  allFaculty: (FacultyRecord | Profile)[],
  year: number,
  evaluations: Record<string, MonthlyEvaluation> = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();

  const academicMonths = [
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
  ];

  // 1. Add all 12 monthly sheets
  academicMonths.forEach((m) => {
    addMonthlySheet(workbook, allFaculty, year, m, evaluations);
  });

  // 2. Add 13th Annual Consolidation sheet
  addAnnualConsolidationSheet(workbook, allFaculty, year, evaluations);

  const filename = `Faculty_SAR_Tracker_${year}-${year + 1}.xlsx`;
  await downloadExcelJSWorkbook(workbook, filename);
}

/**
 * Backward compatibility helper for Monthly Records page
 */
export async function exportFacultyEvaluationsToExcel(
  facultyRows: FacultySummaryRow[],
  year: number,
  month: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();

  const mockEvaluations: Record<string, MonthlyEvaluation> = {};

  facultyRows.forEach((r) => {
    const key = `${r.faculty_id.toUpperCase()}_${year}_${month.toLowerCase()}`;
    mockEvaluations[key] = {
      id: `eval_${r.faculty_id}_${year}_${month}`,
      faculty_id: r.faculty_id,
      year,
      month,
      status: r.status?.toLowerCase() === 'complete' ? 'complete' : r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
      submitted_at: r.submitted_at,
      total_marks: r.total_marks,
      head_marks: {
        1: { head_number: 1, marks: r.head_1 },
        2: { head_number: 2, marks: r.head_2 },
        3: { head_number: 3, marks: r.head_3 },
        4: { head_number: 4, marks: r.head_4 },
        5: { head_number: 5, marks: r.head_5 },
        6: { head_number: 6, marks: r.head_6 },
        7: { head_number: 7, marks: r.head_7 },
        8: { head_number: 8, marks: r.head_8 },
      },
    };
  });

  addMonthlySheet(workbook, facultyRows, year, month, mockEvaluations);

  const filename = `Faculty_SAR_Tracker_${month}_${year}-${year + 1}.xlsx`;
  await downloadExcelJSWorkbook(workbook, filename);
}

/**
 * Export Single Faculty Final Report (13 Sheets)
 */
export async function exportFacultyFinalReportToExcel(
  faculty: Profile | FacultyRecord,
  year: number,
  evaluations: Record<string, MonthlyEvaluation>
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSRIET IQAC System';
  workbook.created = new Date();

  const academicMonths = [
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
  ];

  academicMonths.forEach((m) => {
    addMonthlySheet(workbook, [faculty], year, m, evaluations);
  });

  addAnnualConsolidationSheet(workbook, [faculty], year, evaluations);

  const filename = `Faculty_Final_Report_${faculty.faculty_id}_${year}-${year + 1}.xlsx`;
  await downloadExcelJSWorkbook(workbook, filename);
}
