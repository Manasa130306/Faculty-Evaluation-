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
import { MonthlyEvaluation, FacultySummaryRow, EvaluationMarkChange } from '@/lib/types';
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
  Edit3,
  AlertTriangle,
  History,
  X,
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

  // Admin H2-H8 Modification Modal State
  const [editHeadModal, setEditHeadModal] = useState<{
    isOpen: boolean;
    headNumber: number;
    headName: string;
    maxMarks: number;
    originalMarks: number | null;
    currentMarks: number | null;
    docName: string;
    docUrl: string;
    docType?: string;
    docSize?: number;
    revisedMarks: string;
    error: string | null;
    isSaving: boolean;
  }>({
    isOpen: false,
    headNumber: 2,
    headName: '',
    maxMarks: 10,
    originalMarks: null,
    currentMarks: null,
    docName: '',
    docUrl: '',
    revisedMarks: '',
    error: null,
    isSaving: false,
  });

  // Audit History Modal State
  const [auditModal, setAuditModal] = useState<{
    isOpen: boolean;
    records: EvaluationMarkChange[];
    isLoading: boolean;
  }>({
    isOpen: false,
    records: [],
    isLoading: false,
  });

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

  // Open H2-H8 Modification Modal
  const handleOpenEditHead = (headNo: number) => {
    if (!viewingFaculty || !viewingEval) return;
    const fw = getMonthFramework(selectedMonth);
    const metric = fw.heads[headNo];
    const headData = viewingEval.head_marks?.[headNo];
    const maxMarks = metric?.maxMarks ?? 0;

    const originalMarks =
      headData?.original_faculty_marks !== null && headData?.original_faculty_marks !== undefined
        ? headData.original_faculty_marks
        : headData?.marks ?? null;

    const currentMarks = headData?.marks ?? null;

    const resolvedUrl = headData?.file_url || (headData?.file_path ? (headData.file_path.startsWith('http') || headData.file_path.startsWith('data:') ? headData.file_path : `/api/drive/file/${headData.file_path}`) : '');

    setEditHeadModal({
      isOpen: true,
      headNumber: headNo,
      headName: metric?.name || `Head ${headNo}`,
      maxMarks,
      originalMarks,
      currentMarks,
      docName: headData?.file_name || '',
      docUrl: resolvedUrl,
      docType: headData?.file_type,
      docSize: headData?.file_size,
      revisedMarks: currentMarks !== null ? String(currentMarks) : '',
      error: null,
      isSaving: false,
    });
  };

  // Save H2-H8 Modification by Admin
  const handleSaveHeadModification = async () => {
    if (!viewingFaculty) return;
    const numVal = parseFloat(editHeadModal.revisedMarks);
    if (isNaN(numVal) || numVal < 0 || numVal > editHeadModal.maxMarks) {
      setEditHeadModal((prev) => ({
        ...prev,
        error: `Revised marks must be between 0 and ${editHeadModal.maxMarks}.`,
      }));
      return;
    }

    setEditHeadModal((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const updatedEval = await DataService.adminModifyHeadMark({
        facultyId: viewingFaculty.faculty_id,
        facultyName: viewingFaculty.name,
        year: selectedYear,
        month: selectedMonth,
        headNumber: editHeadModal.headNumber,
        revisedMarks: numVal,
        adminId: user?.faculty_id || 'ADMIN01',
        adminName: user?.name || 'Administrator (IQAC)',
      });

      setViewingEval(updatedEval);
      setEditHeadModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      await loadSummaries();
    } catch (err: any) {
      setEditHeadModal((prev) => ({
        ...prev,
        isSaving: false,
        error: err.message || 'Failed to save modification.',
      }));
    }
  };

  // Open Audit History Modal
  const handleOpenAuditHistory = async () => {
    if (!viewingFaculty) return;
    setAuditModal({ isOpen: true, records: [], isLoading: true });
    try {
      const logs = await DataService.getEvaluationMarkChanges(
        viewingFaculty.faculty_id,
        selectedYear,
        selectedMonth
      );
      setAuditModal({ isOpen: true, records: logs, isLoading: false });
    } catch (err) {
      console.error('Failed to load audit history:', err);
      setAuditModal({ isOpen: true, records: [], isLoading: false });
    }
  };

  const monthFramework = getMonthFramework(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Top Header & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Month Records & Evaluation Review</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review monthly faculty self-appraisals, assign Head 1 marks, review & modify H2–H8 evidence with audit history
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading evaluation records...</p>
            </div>
          ) : (
            <Table className="min-w-[900px]">
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
                  <TableHead className="text-center w-20 font-bold">Total</TableHead>
                  <TableHead className="text-center w-28 font-bold">Status</TableHead>
                  <TableHead className="text-center w-20 font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12 text-slate-400 text-xs">
                      No faculty records found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  facultyRows.map((row) => {
                    const isSubmitted = row.status === 'submitted';
                    return (
                      <TableRow key={row.faculty_id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-slate-700">
                          {row.faculty_id}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {row.has_admin_modifications && (
                              <Badge variant="warning" className="text-[9px] px-1 py-0">Admin Mod</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <Badge variant="outline" className="text-[10px] font-semibold">{row.department}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold bg-blue-50/40 text-blue-900 border-l border-r border-blue-100">
                          {row.head_1 !== null ? row.head_1 : '-'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_2 !== null ? row.head_2 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_3 !== null ? row.head_3 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_4 !== null ? row.head_4 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_5 !== null ? row.head_5 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_6 !== null ? row.head_6 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_7 !== null ? row.head_7 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">{row.head_8 !== null ? row.head_8 : '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-slate-900">
                          {row.total_marks.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isSubmitted ? (
                            <Badge variant="success" className="text-[10px]">Submitted</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenFacultyEvaluation(row)}
                            className="h-7 text-xs font-bold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* FACULTY COMPLETE EVALUATION & ADMIN REVIEW MODAL */}
      <Dialog
        isOpen={!!viewingFaculty}
        onClose={() => setViewingFaculty(null)}
        title={
          viewingFaculty
            ? `${viewingFaculty.name} (${viewingFaculty.faculty_id}) — ${selectedMonth} ${selectedYear}`
            : 'Faculty Evaluation'
        }
        className="max-w-4xl"
      >
        {isLoadingEval ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading appraisal details...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Header info strip */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Department & Designation:</span>
                <strong className="text-slate-900">{viewingFaculty?.department} &bull; {viewingFaculty?.designation}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {viewingEval?.status === 'submitted' ? (
                    <span className="text-emerald-700">Submitted ({viewingEval.submitted_at ? new Date(viewingEval.submitted_at).toLocaleDateString() : 'Yes'})</span>
                  ) : (
                    <span className="text-amber-700">Draft / Pending</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Monthly Total Score:</span>
                <strong className="text-blue-900 font-mono text-sm">{viewingEval?.total_marks.toFixed(1) || '0.0'} / {monthFramework.totalMarks}</strong>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAuditHistory}
                className="text-xs font-bold gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                Audit History
              </Button>
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

            {/* HEADS 2 TO 8: FACULTY SUBMISSION DETAILS & ADMIN EDIT */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Heads 2 to 8 Self-Appraisals, Reference Documents & Admin Review
              </h3>

              {[2, 3, 4, 5, 6, 7, 8].map((headNo) => {
                const metric = monthFramework.heads[headNo];
                const headData = viewingEval?.head_marks?.[headNo];
                const hasWeightage = (metric?.maxMarks ?? 0) > 0;
                const isAdminModified = headData?.is_admin_modified;

                return (
                  <div
                    key={headNo}
                    className={`p-3.5 rounded-xl border transition-all ${
                      !hasWeightage
                        ? 'bg-slate-50/50 border-slate-200 opacity-60'
                        : isAdminModified
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-400">
                            #{headNo}
                          </span>
                          <strong className="text-xs text-slate-900">{metric?.name}</strong>
                          {!hasWeightage && (
                            <Badge variant="secondary" className="text-[10px]">
                              Not Applicable this Month (0 Marks)
                            </Badge>
                          )}
                          {isAdminModified && (
                            <Badge variant="warning" className="text-[10px]">
                              Modified by Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{metric?.description}</p>
                        {isAdminModified && (
                          <p className="text-[10px] text-amber-800 font-semibold mt-1">
                            Original Faculty Submission: {headData.original_faculty_marks ?? '0'} marks
                            {headData.admin_modified_at && ` • Modified on ${new Date(headData.admin_modified_at).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {hasWeightage ? (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Final Score</span>
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

                        {hasWeightage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditHead(headNo)}
                            className="h-8 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Marks
                          </Button>
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

      {/* ADMIN H2-H8 EDIT MARKS MODAL */}
      <Dialog
        isOpen={editHeadModal.isOpen}
        onClose={() => setEditHeadModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Edit Marks: Head ${editHeadModal.headNumber} — ${editHeadModal.headName}`}
        className="max-w-lg"
      >
        <div className="space-y-4 pt-2">
          {/* Faculty & Month Details */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Faculty Name:</span>
              <strong className="text-slate-900">{viewingFaculty?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Faculty ID:</span>
              <strong className="font-mono text-slate-900">{viewingFaculty?.faculty_id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{viewingFaculty?.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Period:</span>
              <span className="font-semibold text-slate-800">{selectedMonth} {selectedYear}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Faculty-Submitted Marks:</span>
              <strong className="font-mono text-slate-900">{editHeadModal.originalMarks !== null ? editHeadModal.originalMarks : 'N/A'} / {editHeadModal.maxMarks}</strong>
            </div>
            {editHeadModal.docName && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Reference Document:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (editHeadModal.docUrl) {
                      setViewerDoc({
                        url: editHeadModal.docUrl,
                        name: editHeadModal.docName,
                        type: editHeadModal.docType,
                        size: editHeadModal.docSize,
                        title: `Head ${editHeadModal.headNumber} Evidence`,
                      });
                    }
                  }}
                  className="text-blue-700 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Eye className="w-3 h-3" /> {editHeadModal.docName}
                </button>
              </div>
            )}
          </div>

          {/* Revised Marks Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Revised Marks (0 to {editHeadModal.maxMarks}):
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max={editHeadModal.maxMarks}
              value={editHeadModal.revisedMarks}
              onChange={(e) =>
                setEditHeadModal((prev) => ({ ...prev, revisedMarks: e.target.value, error: null }))
              }
              placeholder={`Enter marks (max ${editHeadModal.maxMarks})`}
              className="h-10 text-sm font-mono font-bold"
              autoFocus
            />
          </div>

          {/* Clear Admin Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-950">Administrative Modification Notice:</strong>
              This will modify the faculty-submitted marks and will be recorded in the review history.
            </div>
          </div>

          {editHeadModal.error && (
            <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {editHeadModal.error}
            </p>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setEditHeadModal((prev) => ({ ...prev, isOpen: false }))}
              disabled={editHeadModal.isSaving}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveHeadModification}
              disabled={editHeadModal.isSaving}
              className="cursor-pointer font-bold text-xs"
            >
              {editHeadModal.isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* AUDIT HISTORY MODAL */}
      <Dialog
        isOpen={auditModal.isOpen}
        onClose={() => setAuditModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Review & Modification History — ${viewingFaculty?.name}`}
        className="max-w-2xl"
      >
        <div className="space-y-3 pt-2">
          {auditModal.isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading audit trail...</div>
          ) : auditModal.records.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No administrative mark modifications recorded for this period.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {auditModal.records.map((rec, i) => (
                <div key={rec.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-blue-900 font-bold">Head #{rec.head_number} Modified</strong>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {rec.changed_at ? new Date(rec.changed_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Original Marks:</span>{' '}
                      <strong className="font-mono">{rec.original_marks ?? 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Revised Marks:</span>{' '}
                      <strong className="font-mono text-amber-700">{rec.revised_marks}</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-150">
                    Modified by: <strong>{rec.changed_by_admin_name || rec.changed_by_admin_id}</strong>
                    {rec.reference_document_name && ` • Evidence: ${rec.reference_document_name}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
