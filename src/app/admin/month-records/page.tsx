'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import { exportFacultyEvaluationsToExcel } from '@/lib/excel/export';
import { DocumentViewerModal } from '@/components/shared/document-viewer-modal';
import {
  CURRENT_DEFAULT_YEAR,
  CURRENT_DEFAULT_MONTH,
  MONTHS,
  DEPARTMENTS,
  getMonthFramework,
} from '@/lib/constants/heads';
import { MonthlyEvaluation, FacultySummaryRow } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { SuccessModal } from '@/components/ui/success-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Download,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default function MonthRecordsPage() {
  const { user } = useAuth();
  // Slicers / Filters
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_DEFAULT_MONTH);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data states
  const [facultyRows, setFacultyRows] = useState<FacultySummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Single Faculty Complete Evaluation View
  const [viewingFaculty, setViewingFaculty] = useState<FacultySummaryRow | null>(null);
  const [viewingEval, setViewingEval] = useState<MonthlyEvaluation | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState<boolean>(false);

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<{
    url: string;
    name: string;
    type?: string;
    size?: number;
    title?: string;
  } | null>(null);

  // Admin Head 1 Marks Input
  const [adminHead1Marks, setAdminHead1Marks] = useState<string>('');
  const [isSavingHead1, setIsSavingHead1] = useState<boolean>(false);
  const [head1SuccessMsg, setHead1SuccessMsg] = useState<string | null>(null);
  const [head1ErrorMsg, setHead1ErrorMsg] = useState<string | null>(null);
  const [isHead1SuccessModalOpen, setIsHead1SuccessModalOpen] = useState<boolean>(false);

  // Month lock status for the viewed month
  const [isMonthLocked, setIsMonthLocked] = useState<boolean>(false);

  // Load Summaries
  const loadSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaries, locked] = await Promise.all([
        DataService.getFacultyEvaluationSummaries(
          selectedYear,
          selectedMonth,
          selectedDept,
          searchTerm
        ),
        DataService.isMonthLocked(selectedYear, selectedMonth),
      ]);
      setFacultyRows(summaries);
      setIsMonthLocked(locked);
    } catch (err) {
      console.error('Failed to load month records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedDept, searchTerm]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  // Export to Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportFacultyEvaluationsToExcel(facultyRows, selectedYear, selectedMonth);
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Open single faculty evaluation modal
  const handleOpenFacultyEvaluation = async (faculty: FacultySummaryRow) => {
    setViewingFaculty(faculty);
    setIsLoadingEval(true);
    setHead1SuccessMsg(null);
    setHead1ErrorMsg(null);
    try {
      const evalData = await DataService.getEvaluation(
        faculty.faculty_id,
        selectedYear,
        selectedMonth
      );
      setViewingEval(evalData);
      const h1Val = evalData?.head_marks?.[1]?.marks;
      setAdminHead1Marks(h1Val !== null && h1Val !== undefined ? String(h1Val) : '');
    } catch (err) {
      console.error('Failed to load faculty evaluation:', err);
    } finally {
      setIsLoadingEval(false);
    }
  };

  // Save Head 1 Marks by Admin
  const handleSaveHead1 = async () => {
    if (!viewingFaculty) return;
    const fw = getMonthFramework(selectedMonth);
    const h1Metric = fw.heads[1];
    const maxMarks = h1Metric?.maxMarks ?? 0;

    const numVal = parseFloat(adminHead1Marks);
    if (isNaN(numVal) || numVal < 0 || numVal > maxMarks) {
      setHead1ErrorMsg(`Please enter a valid mark between 0 and ${maxMarks} for ${selectedMonth}.`);
      return;
    }

    setIsSavingHead1(true);
    setHead1ErrorMsg(null);
    setHead1SuccessMsg(null);
    try {
      const updatedEval = await DataService.saveHeadMark(
        viewingFaculty.faculty_id,
        selectedYear,
        selectedMonth,
        1,
        numVal,
        undefined,
        `Admin evaluation updated on ${new Date().toLocaleDateString()}`,
        true
      );
      setViewingEval(updatedEval);
      setHead1SuccessMsg(`Head 1 score (${numVal}/${maxMarks}) saved successfully.`);
      setIsHead1SuccessModalOpen(true);
      await loadSummaries();
    } catch (err: any) {
      setHead1ErrorMsg(err.message || 'Failed to save Head 1 marks.');
    } finally {
      setIsSavingHead1(false);
    }
  };

  const monthFramework = getMonthFramework(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Top Header & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Month Records & Head 1 Entry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review monthly faculty self-appraisals, assign Head 1 IQAC marks, and export official reports
          </p>
        </div>

        <Button
          onClick={handleExportExcel}
          disabled={isExporting || facultyRows.length === 0}
          variant="success"
          className="font-bold shadow-sm cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Generating...' : `Export Excel (${selectedMonth} ${selectedYear})`}
        </Button>
      </div>

      {/* Filter Slicers */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search Name or Faculty ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Department Filter */}
            <div className="sm:col-span-1">
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 text-xs"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            {/* Year Slicer */}
            <div className="sm:col-span-1">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 text-xs"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Year: {y}
                  </option>
                ))}
              </Select>
            </div>

            {/* Month Slicer */}
            <div className="sm:col-span-1">
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 text-xs"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    Month: {m} ({getMonthFramework(m).totalMarks} Marks)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Overview Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Evaluation Period
          </span>
          <h2 className="text-lg font-bold">
            {selectedMonth} {selectedYear} &bull; Monthly Target: {monthFramework.totalMarks} Marks
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isMonthLocked ? (
            <Badge variant="danger" className="text-xs px-3 py-1 font-bold">
              Month Locked (Submissions Closed)
            </Badge>
          ) : (
            <Badge variant="success" className="text-xs px-3 py-1 font-bold">
              Month Active (Submissions Open)
            </Badge>
          )}
        </div>
      </div>

      {/* Records Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading evaluation records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 text-slate-800">
                  <TableHead className="w-28 font-bold">Faculty ID</TableHead>
                  <TableHead className="min-w-[160px] font-bold">Faculty Name</TableHead>
                  <TableHead className="w-24 font-bold">Dept</TableHead>
                  <TableHead className="text-center w-16 bg-blue-50/80 text-blue-950 font-bold border-l border-r border-blue-200">
                    H1 ({monthFramework.heads[1]?.maxMarks ?? 0})
                  </TableHead>
                  <TableHead className="text-center w-14">H2 ({monthFramework.heads[2]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H3 ({monthFramework.heads[3]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H4 ({monthFramework.heads[4]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H5 ({monthFramework.heads[5]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H6 ({monthFramework.heads[6]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H7 ({monthFramework.heads[7]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-14">H8 ({monthFramework.heads[8]?.maxMarks ?? 0})</TableHead>
                  <TableHead className="text-center w-20 bg-slate-200 font-black text-slate-900">
                    Total
                  </TableHead>
                  <TableHead className="text-center w-24">Status</TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-10 text-slate-500">
                      No faculty records match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  facultyRows.map((row) => (
                    <TableRow key={row.faculty_id} className="hover:bg-blue-50/30">
                      <TableCell className="font-mono font-bold text-blue-700 text-xs">
                        {row.faculty_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{row.name}</div>
                        <div className="text-[11px] text-slate-400">{row.designation}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {row.department}
                        </Badge>
                      </TableCell>

                      {/* Head 1 */}
                      <TableCell className="text-center font-bold font-mono bg-blue-50/40 text-blue-900 border-l border-r border-blue-200 text-xs">
                        {row.head_1 !== null ? Number(row.head_1).toFixed(1) : (
                          <span className="text-amber-600 text-[11px] font-sans">Pending</span>
                        )}
                      </TableCell>

                      {/* Heads 2-8 */}
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[2]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_2 !== null ? Number(row.head_2).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[3]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_3 !== null ? Number(row.head_3).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[4]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_4 !== null ? Number(row.head_4).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[5]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_5 !== null ? Number(row.head_5).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[6]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_6 !== null ? Number(row.head_6).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[7]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_7 !== null ? Number(row.head_7).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {monthFramework.heads[8]?.maxMarks === 0 ? <span className="text-slate-300">0</span> : row.head_8 !== null ? Number(row.head_8).toFixed(1) : '—'}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-center font-black font-mono text-xs bg-slate-100 text-slate-900">
                        {Number(row.total_marks).toFixed(1)} / {monthFramework.totalMarks}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            row.status === 'submitted'
                              ? 'success'
                              : row.status === 'draft'
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {row.status === 'submitted'
                            ? 'Submitted'
                            : row.status === 'draft'
                            ? 'Draft'
                            : 'Not Started'}
                        </Badge>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenFacultyEvaluation(row)}
                          className="text-xs h-7 px-2 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* COMPLETE MONTHLY EVALUATION MODAL (HEADS 1 TO 8) */}
      <Dialog
        isOpen={Boolean(viewingFaculty)}
        onClose={() => setViewingFaculty(null)}
        title={viewingFaculty ? `${viewingFaculty.name} (${viewingFaculty.faculty_id})` : 'Evaluation'}
        description={`Complete Performance Appraisal & Evidence for ${selectedMonth} ${selectedYear}`}
      >
        {isLoadingEval || !viewingEval || !viewingFaculty ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading full monthly evaluation...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Faculty Meta Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Department:</span>
                <strong className="text-slate-800">{viewingFaculty.department}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Designation:</span>
                <strong className="text-slate-800">{viewingFaculty.designation}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <Badge variant={viewingEval.status === 'submitted' ? 'success' : 'warning'} className="text-[10px]">
                  {viewingEval.status === 'submitted' ? 'Submitted' : 'Draft'}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Total Score:</span>
                <strong className="text-blue-700 text-sm font-mono font-black">
                  {Number(viewingEval.total_marks).toFixed(1)} / {monthFramework.totalMarks}
                </strong>
              </div>
            </div>

            {/* HEAD 1: ADMIN ENTRY SECTION */}
            <Card className="border-blue-300 bg-blue-50/20 shadow-xs">
              <CardHeader className="py-3 px-4 bg-blue-50/70 border-b border-blue-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <span>Head 1: Pass % & IQAC Visit</span>
                    <Badge variant="default" className="text-[10px]">IQAC Admin Evaluation</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-900/80 mt-0.5">
                    {monthFramework.heads[1]?.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-900">
                    Max Marks: {monthFramework.heads[1]?.maxMarks ?? 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Enter IQAC Score (0 to {monthFramework.heads[1]?.maxMarks ?? 0}):
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max={monthFramework.heads[1]?.maxMarks ?? 0}
                      value={adminHead1Marks}
                      onChange={(e) => setAdminHead1Marks(e.target.value)}
                      placeholder={`Max ${monthFramework.heads[1]?.maxMarks ?? 0}`}
                      className="h-10 text-sm font-mono font-bold w-full sm:w-48"
                    />
                  </div>

                  <Button
                    onClick={handleSaveHead1}
                    disabled={isSavingHead1 || monthFramework.heads[1]?.maxMarks === 0}
                    variant="primary"
                    className="h-10 font-bold shrink-0 self-end cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingHead1 ? 'Saving...' : 'Update Head 1 Marks'}
                  </Button>
                </div>

                {head1SuccessMsg && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {head1SuccessMsg}
                  </p>
                )}
                {head1ErrorMsg && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {head1ErrorMsg}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* HEADS 2 TO 8: FACULTY SUBMISSION DETAILS & EVIDENCE */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Heads 2 to 8 Self-Appraisals & Reference Documents
              </h3>

              {[2, 3, 4, 5, 6, 7, 8].map((headNo) => {
                const metric = monthFramework.heads[headNo];
                const headData = viewingEval?.head_marks?.[headNo];
                const hasWeightage = (metric?.maxMarks ?? 0) > 0;

                return (
                  <div
                    key={headNo}
                    className={`p-3.5 rounded-xl border transition-all ${
                      !hasWeightage
                        ? 'bg-slate-50/50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-400">
                            #{headNo}
                          </span>
                          <strong className="text-xs text-slate-900">{metric?.name}</strong>
                          {!hasWeightage && (
                            <Badge variant="secondary" className="text-[10px]">
                              Not Applicable this Month (0 Marks)
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{metric?.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {hasWeightage ? (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Assigned Score</span>
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {headData?.marks !== null && headData?.marks !== undefined
                                ? Number(headData.marks).toFixed(1)
                                : '0'}{' '}
                              / {metric.maxMarks}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-400">0 / 0</span>
                        )}
                      </div>
                    </div>

                    {/* Reference Document Preview */}
                    {hasWeightage && (headData?.file_name || headData?.file_path) && (() => {
                      const resolvedUrl = headData?.file_url || (headData?.file_path ? (headData.file_path.startsWith('http') || headData.file_path.startsWith('data:') ? headData.file_path : `/api/drive/file/${headData.file_path}`) : '');
                      const docName = headData?.file_name || 'Evidence Document';
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between bg-blue-50/40 p-2 rounded-lg text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (resolvedUrl) {
                                  setViewerDoc({
                                    url: resolvedUrl,
                                    name: docName,
                                    type: headData?.file_type || undefined,
                                    size: headData?.file_size || undefined,
                                    title: `Head ${headNo}: ${metric?.name}`,
                                  });
                                }
                              }}
                              className="flex items-center gap-2 min-w-0 text-left hover:underline cursor-pointer group"
                            >
                              <FileText className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold text-slate-800 truncate max-w-xs group-hover:text-blue-700">
                                {docName}
                              </span>
                            </button>
                            {resolvedUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewerDoc({
                                    url: resolvedUrl,
                                    name: docName,
                                    type: headData?.file_type || undefined,
                                    size: headData?.file_size || undefined,
                                    title: `Head ${headNo}: ${metric?.name}`,
                                  })
                                }
                                className="text-blue-700 hover:text-blue-900 bg-blue-100/60 hover:bg-blue-100 px-2 py-1 rounded font-bold flex items-center gap-1 text-[11px] shrink-0 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Attached</span>
                            )}
                          </div>

                          {/* Aspect-Ratio Preserved Image Display */}
                          {resolvedUrl &&
                            (headData?.file_type?.startsWith('image/') ||
                              /\.(jpg|jpeg|png|webp|gif)$/i.test(docName)) && (
                            <div
                              onClick={() =>
                                setViewerDoc({
                                  url: resolvedUrl,
                                  name: docName,
                                  type: headData?.file_type || undefined,
                                  size: headData?.file_size || undefined,
                                  title: `Head ${headNo}: ${metric?.name}`,
                                })
                              }
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center max-h-56 overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                              title="Click to view full preview"
                            >
                              <img
                                src={resolvedUrl}
                                alt={docName}
                                className="max-h-52 max-w-full object-contain rounded"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Dialog>

      {/* Reference Document Full Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        fileUrl={viewerDoc?.url}
        fileName={viewerDoc?.name}
        fileType={viewerDoc?.type}
        fileSize={viewerDoc?.size}
        title={viewerDoc?.title}
      />

      {/* Head 1 Assignment Success Modal */}
      <SuccessModal
        isOpen={isHead1SuccessModalOpen}
        onClose={() => setIsHead1SuccessModalOpen(false)}
        title="Marks Assigned Successfully"
        message="Head 1 marks have been assigned successfully."
        buttonText="Continue"
      />
    </div>
  );
}
