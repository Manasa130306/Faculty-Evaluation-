'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import { MonthlyEvaluation, EvaluationHeadMark } from '@/lib/types';
import {
  MONTHS,
  CURRENT_DEFAULT_YEAR,
  CURRENT_DEFAULT_MONTH,
  getMonthFramework,
  PERFORMANCE_HEADS,
  CALENDAR_MONTHS,
  APPRAISAL_FRAMEWORK,
} from '@/lib/constants/heads';
import { exportFacultyFinalReportToExcel } from '@/lib/excel/export';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SuccessModal } from '@/components/ui/success-modal';
import { DocumentViewerModal } from '@/components/shared/document-viewer-modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Send,
  Calendar,
  AlertTriangle,
  Info,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Award,
  LayoutDashboard,
  FileCheck,
  FileSpreadsheet,
  Download,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react';

type FacultyView = 'dashboard' | 'evaluation' | 'final_report';

export default function FacultyEvaluationPortal() {
  const { user } = useAuth();

  // Active Main Navigation View
  const [activeView, setActiveView] = useState<FacultyView>('dashboard');

  // Evaluation Period Selection
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_DEFAULT_MONTH);
  const [isMonthLocked, setIsMonthLocked] = useState<boolean>(false);

  // Steps: 1 to 8 (Heads 1..8), 9 = Preview & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [evaluation, setEvaluation] = useState<MonthlyEvaluation | null>(null);
  const [annualEvaluations, setAnnualEvaluations] = useState<Record<string, MonthlyEvaluation>>({});

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileErrorMsg, setFileErrorMsg] = useState<string | null>(null);

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isExportingReport, setIsExportingReport] = useState<boolean>(false);

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<{
    isOpen: boolean;
    fileName: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
    title?: string;
  }>({
    isOpen: false,
    fileName: '',
  });

  // Local Form State for Heads 1 to 8
  const [headFormState, setHeadFormState] = useState<
    Record<
      number,
      {
        marks: string;
        file_name: string;
        file_path: string;
        file_size: number;
        file_type: string;
        file_url: string;
        reference_info: string;
        pendingFile?: File | null;
      }
    >
  >({
    1: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    2: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    3: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    4: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    5: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    6: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    7: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
    8: { marks: '', file_name: '', file_path: '', file_size: 0, file_type: '', file_url: '', reference_info: '' },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const monthFramework = getMonthFramework(selectedMonth);

  // Load Active Evaluation and Annual History
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const [locked, evalData, allAnnual] = await Promise.all([
          DataService.isMonthLocked(selectedYear, selectedMonth),
          DataService.getEvaluation(user.faculty_id, selectedYear, selectedMonth),
          DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear),
        ]);

        if (!isMounted) return;

        setIsMonthLocked(locked);
        setEvaluation(evalData);
        setAnnualEvaluations(allAnnual);

        // Populate local state
        const newFormState: any = {};
        for (let i = 1; i <= 8; i++) {
          const hm = evalData.head_marks?.[i];
          newFormState[i] = {
            marks: hm && hm.marks !== null && hm.marks !== undefined ? String(hm.marks) : '',
            file_name: hm?.file_name || '',
            file_path: hm?.file_path || '',
            file_size: hm?.file_size || 0,
            file_type: hm?.file_type || '',
            file_url: hm?.file_url || (hm?.file_path ? (hm.file_path.startsWith('http') || hm.file_path.startsWith('data:') ? hm.file_path : (hm.file_path.startsWith('pending/') ? `/api/storage/${hm.file_path}` : `/api/drive/file/${hm.file_path}`)) : ''),
            reference_info: hm?.reference_info || '',
          };
        }
        setHeadFormState(newFormState);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load evaluation data.';
        setErrorMsg(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, selectedYear, selectedMonth]);

  // Handle Score / Input Change
  const handleMarksChange = (headNum: number, value: string) => {
    const metric = monthFramework.heads[headNum];
    const max = metric?.maxMarks ?? 0;

    if (value === '') {
      setHeadFormState((prev) => ({
        ...prev,
        [headNum]: { ...prev[headNum], marks: '' },
      }));
      return;
    }

    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num < 0) return;
      if (num > max) {
        setErrorMsg(`Maximum allowed score for ${metric?.name} in ${selectedMonth} is ${max} marks.`);
        return;
      }
    }

    setErrorMsg(null);
    setHeadFormState((prev) => ({
      ...prev,
      [headNum]: { ...prev[headNum], marks: value },
    }));
  };

  // Handle Document Upload (Defer to Final Submit)
  const handleFileUpload = (headNum: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setFileErrorMsg(null);
    try {
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be 1 MB or less.');
      }
      const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        throw new Error('Allowed file formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG.');
      }

      setHeadFormState((prev) => ({
        ...prev,
        [headNum]: {
          ...prev[headNum],
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          file_url: URL.createObjectURL(file), // Generate preview URL immediately
          pendingFile: file,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid file.';
      setFileErrorMsg(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (headNum: number) => {
    setHeadFormState((prev) => ({
      ...prev,
      [headNum]: {
        ...prev[headNum],
        file_name: '',
        file_path: '',
        file_size: 0,
        file_type: '',
        file_url: '',
        pendingFile: null,
      },
    }));
  };

  // Save current active head marks into draft state
  const saveCurrentHead = async (headNum: number): Promise<boolean> => {
    if (!user) return false;
    const metric = monthFramework.heads[headNum];
    const isWeightageZero = (metric?.maxMarks ?? 0) === 0;

    // Head 1 is admin-only, cannot be modified by faculty
    if (headNum === 1) return true;

    // Zero-weightage heads do not require validation
    if (isWeightageZero) {
      return true;
    }

    // If head was modified by admin, do not allow faculty edit
    if (evaluation?.head_marks?.[headNum]?.is_admin_modified) {
      return true;
    }

    const state = headFormState[headNum];
    const marksVal = state?.marks ? parseFloat(state.marks) : null;

    if (marksVal !== null && (isNaN(marksVal) || marksVal < 0 || marksVal > metric.maxMarks)) {
      setErrorMsg(`Marks for ${metric.name} must be between 0 and ${metric.maxMarks}.`);
      return false;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      let finalDocInfo = state?.file_name
        ? {
            file_name: state.file_name,
            file_path: state.file_path,
            file_size: state.file_size,
            file_type: state.file_type,
            file_url: state.file_url,
          }
        : undefined;

      if (state?.pendingFile) {
        const uploadedDoc = await DataService.uploadReferenceDocument(
          user.faculty_id,
          selectedYear,
          selectedMonth,
          headNum,
          state.pendingFile
        );
        finalDocInfo = {
          file_name: uploadedDoc.file_name,
          file_path: uploadedDoc.file_path,
          file_size: uploadedDoc.file_size,
          file_type: uploadedDoc.file_type,
          file_url: uploadedDoc.file_url,
        };
        // Clear pending file
        setHeadFormState((prev) => ({
          ...prev,
          [headNum]: {
            ...prev[headNum],
            ...finalDocInfo,
            pendingFile: null,
          }
        }));
      }

      const updated = await DataService.saveHeadMark(
        user.faculty_id,
        selectedYear,
        selectedMonth,
        headNum,
        marksVal,
        finalDocInfo,
        state?.reference_info,
        false,
        true // skipExcelUpdate
      );
      setEvaluation(updated);

      // Refresh annual cache
      const allAnnual = await DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear);
      setAnnualEvaluations(allAnnual);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save evaluation.';
      setErrorMsg(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation between Heads
  const handleNextStep = async () => {
    const success = await saveCurrentHead(currentStep);
    if (success) {
      setCurrentStep((prev) => Math.min(prev + 1, 9));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Calculate live total marks for the active month
  const calculateLiveTotal = (): number => {
    let sum = 0;
    for (let i = 1; i <= 8; i++) {
      const m = monthFramework.heads[i];
      if (m && m.maxMarks > 0) {
        const val = parseFloat(headFormState[i]?.marks || '0');
        if (!isNaN(val)) sum += val;
      }
    }
    return Math.round(sum * 100) / 100;
  };

  // Calculate annual summary
  const calculateAnnualSummary = () => {
    let totalEarned = 0;
    let completedMonthsCount = 0;

    CALENDAR_MONTHS.forEach((m) => {
      const fid = user?.faculty_id?.toUpperCase() || '';
      const evalItem =
        annualEvaluations[DataService.getEvaluationKey(fid, selectedYear, m)] ||
        annualEvaluations[`${fid}_${selectedYear}_${m}`] ||
        annualEvaluations[`${fid}_${selectedYear}_${m.toLowerCase()}`];
      if (evalItem && evalItem.total_marks) {
        totalEarned += evalItem.total_marks;
        if (evalItem.status === 'pending') {
          completedMonthsCount++;
        }
      }
    });

    const performanceStatus =
      totalEarned >= 750
        ? 'Outstanding'
        : totalEarned >= 500
        ? 'Commendable'
        : totalEarned > 0
        ? 'In Progress'
        : 'Pending';

    return {
      totalEarned: Math.round(totalEarned * 10) / 10,
      totalAvailable: 1000,
      completedMonthsCount,
      performanceStatus,
    };
  };

  const annualSummary = calculateAnnualSummary();

  // Final Submit Action
  const handleFinalSubmit = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      // 0. Validate marks and required references
      for (let headNum = 2; headNum <= 8; headNum++) {
        const metric = monthFramework.heads[headNum];
        if (!metric || metric.maxMarks === 0) continue;
        const state = headFormState[headNum];
        
        const marksVal = state?.marks ? parseFloat(state.marks) : null;
        if (marksVal !== null && (isNaN(marksVal) || marksVal < 0 || marksVal > metric.maxMarks)) {
          throw new Error(`Invalid marks for Head ${headNum}. Must be between 0 and ${metric.maxMarks}.`);
        }

        if (marksVal !== null && marksVal > 0 && metric.requiresDocument) {
          if (!state.file_name && !state.pendingFile) {
            throw new Error(`Reference document is required for Head ${headNum} because marks are claimed.`);
          }
        }
      }

      // 1. Upload pending reference documents in parallel to optimize speed
      const uploadPromises = [];
      for (let headNum = 2; headNum <= 8; headNum++) {
        const state = headFormState[headNum];
        if (state?.pendingFile) {
          uploadPromises.push(
            (async () => {
              const uploadedDoc = await DataService.uploadReferenceDocument(
                user.faculty_id,
                selectedYear,
                selectedMonth,
                headNum,
                state.pendingFile!
              );
              
              await DataService.saveHeadMark(
                user.faculty_id,
                selectedYear,
                selectedMonth,
                headNum,
                state.marks ? parseFloat(state.marks) : null,
                {
                  file_name: uploadedDoc.file_name,
                  file_path: uploadedDoc.file_path,
                  file_size: uploadedDoc.file_size,
                  file_type: uploadedDoc.file_type,
                  file_url: uploadedDoc.file_url,
                },
                state.reference_info,
                false,
                true // skipExcelUpdate
              );
              
              setHeadFormState((prev) => ({
                ...prev,
                [headNum]: {
                  ...prev[headNum],
                  file_name: uploadedDoc.file_name,
                  file_path: uploadedDoc.file_path,
                  file_size: uploadedDoc.file_size,
                  file_type: uploadedDoc.file_type,
                  file_url: uploadedDoc.file_url,
                  pendingFile: null,
                }
              }));
            })()
          );
        }
      }
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // 2. Submit evaluation (which generates Excel)
      const submitted = await DataService.submitEvaluation(user.faculty_id, selectedYear, selectedMonth);
      setEvaluation(submitted);

      const allAnnual = await DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear);
      setAnnualEvaluations(allAnnual);

      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed.';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Download 13-Sheet Final Report
  const handleDownloadFinalReport = async () => {
    if (!user) return;
    setIsExportingReport(true);
    try {
      await exportFacultyFinalReportToExcel(user, selectedYear, annualEvaluations);
    } catch (err) {
      console.error('Final Report download failed:', err);
    } finally {
      setIsExportingReport(false);
    }
  };

  const isSubmitted = evaluation?.status === 'pending';
  const isReadOnly = isMonthLocked || isSubmitted;
  const activeMetric = monthFramework.heads[currentStep];
  const isCurrentHeadAdminModified = evaluation?.head_marks?.[currentStep]?.is_admin_modified;

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 pb-8 sm:pb-12 items-start">
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-64 shrink-0 space-y-3 sm:space-y-4">
        {/* Faculty Profile Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 truncate">{user?.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold border border-blue-100">
                  {user?.faculty_id}
                </span>
                <span className="text-[10px] text-slate-500 truncate">{user?.department}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <nav className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => {
              setActiveView('evaluation');
              setCurrentStep(1);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'evaluation'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>Current Evaluation</span>
            </div>
            {isSubmitted && (
              <Badge variant="success" className="text-[9px] py-0 px-1">
                Submitted
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveView('final_report')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'final_report'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Final Report (.xlsx)</span>
          </button>
        </nav>

        {/* Period Slicer Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" /> Evaluation Period
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                Academic Year
              </label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-8 text-xs font-medium"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Year: {y}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                Appraisal Month
              </label>
              <Select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentStep(1);
                }}
                className="h-8 text-xs font-medium"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} ({getMonthFramework(m).totalMarks} Marks)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Month Status indicator */}
          <div className="pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Month Status:</span>
            {isMonthLocked ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : isSubmitted ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Open (Draft)
              </span>
            )}
          </div>
        </div>

        {/* Quick Score Snapshot */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-4 rounded-xl shadow-xs space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Annual Score Earned</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono">{annualSummary.totalEarned}</span>
            <span className="text-xs text-blue-200">/ 1000 M</span>
          </div>
          <p className="text-[10px] text-blue-200">
            {annualSummary.completedMonthsCount} of 12 Months Finalized
          </p>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4 px-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
            <span>Synchronizing evaluation records...</span>
          </div>
        )}

        {/* General Error Message */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Animated 1 MB File Upload Error Toast / Banner */}
        {fileErrorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs font-bold flex items-center justify-between shadow-md animate-bounce">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-200 rounded-lg text-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-rose-900">{fileErrorMsg}</p>
                <p className="text-[11px] font-normal text-rose-700">
                  Please select a reference document or image of 1 MB (1,048,576 bytes) or smaller.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFileErrorMsg(null)}
              className="p-1 rounded-md text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEW 1: FACULTY DASHBOARD                                               */}
        {/* ======================================================================= */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Welcome Header */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Faculty Dashboard</h1>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  Welcome, {user?.name}. Manage your monthly self-appraisals and track your annual SAR performance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveView('evaluation');
                    setCurrentStep(1);
                  }}
                  className="font-bold cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  {isSubmitted ? 'View Evaluation' : 'Open Appraisal'}
                </Button>
              </div>
            </div>

            {/* Quick Access Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Card 1: Current Evaluation */}
              <Card className="border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Current Evaluation Period
                    </span>
                    {isSubmitted ? (
                      <Badge variant="success" className="text-[10px] py-0.5 px-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0.5 px-2">
                        <Edit3 className="w-3 h-3 mr-1" /> Draft in Progress
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg text-slate-900 mt-1">
                    {selectedMonth} {selectedYear}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Framework Target: {monthFramework.totalMarks} Marks (8 Performance Heads)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                    <span className="text-xs text-slate-500 block">Recorded Score:</span>
                    <span className="text-xl font-mono font-black text-blue-700">
                      {calculateLiveTotal().toFixed(1)} / {monthFramework.totalMarks}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-bold justify-center cursor-pointer"
                    onClick={() => {
                      setActiveView('evaluation');
                      setCurrentStep(1);
                    }}
                  >
                    <FileCheck className="w-4 h-4 mr-1.5" />
                    {isSubmitted ? 'Review Evaluation' : 'Continue Appraisal'}
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2: Final Report Summary */}
              <Card className="border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Annual SAR Summary
                    </span>
                    <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                      1000 Max Target
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-900 mt-1">
                    Final Report ({selectedYear} &ndash; {selectedYear + 1})
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {annualSummary.completedMonthsCount} of 12 Months Evaluated
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                    <span className="text-xs text-slate-500 block">Annual Cumulative Earned:</span>
                    <span className="text-xl font-mono font-black text-emerald-700">
                      {annualSummary.totalEarned.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {annualSummary.totalAvailable} M Available
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-bold justify-center cursor-pointer text-slate-700 hover:text-blue-700"
                    onClick={() => setActiveView('final_report')}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Open Full Final Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Performance Heads Breakdown for Current Month */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Performance Heads for {selectedMonth} {selectedYear}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Click any metric to edit scores and attach supporting evidence (Max 1 MB)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-blue-700 bg-blue-50">
                    Max: {monthFramework.totalMarks} Marks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <div className="divide-y divide-slate-100">
                  {PERFORMANCE_HEADS.map((head) => {
                    const metric = monthFramework.heads[head.number];
                    const isZeroWeight = (metric?.maxMarks ?? 0) === 0;
                    const val = headFormState[head.number]?.marks;
                    const hasFile = !!headFormState[head.number]?.file_name;
                    const isHeadAdminModified = evaluation?.head_marks?.[head.number]?.is_admin_modified;

                    return (
                      <div
                        key={head.number}
                        onClick={() => {
                          setActiveView('evaluation');
                          setCurrentStep(head.number);
                        }}
                        className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isHeadAdminModified ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isZeroWeight
                                ? 'bg-slate-100 text-slate-400'
                                : isHeadAdminModified
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : val
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            H{head.number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">Head {head.number}: {head.name}</p>
                              {isHeadAdminModified && (
                                <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                                  Modified by Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{metric?.description || head.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end sm:justify-start">
                          {hasFile && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Proof Attached
                            </Badge>
                          )}
                          <div className="text-right">
                            {isZeroWeight ? (
                              <span className="text-xs font-semibold text-slate-400">0 Marks (N/A)</span>
                            ) : (
                              <span className="text-xs font-mono font-bold text-slate-800">
                                {val !== '' && val !== undefined ? val : '0'} / {metric?.maxMarks ?? 0} M
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEW 2: CURRENT EVALUATION (HEADS 1..8 + PREVIEW & SUBMIT)               */}
        {/* ======================================================================= */}
        {activeView === 'evaluation' && (
          <div className="space-y-6">
            {/* Step Navigation Pills */}
            <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-1 sm:gap-1.5 overflow-x-auto -mx-1 sm:mx-0 scrollbar-thin">
              {PERFORMANCE_HEADS.map((head) => {
                const isCurrent = currentStep === head.number;
                const metric = monthFramework.heads[head.number];
                const isZero = (metric?.maxMarks ?? 0) === 0;
                const hasValue = headFormState[head.number]?.marks !== '';
                const isMod = evaluation?.head_marks?.[head.number]?.is_admin_modified;

                return (
                  <button
                    key={head.number}
                    onClick={async () => {
                      await saveCurrentHead(currentStep);
                      setCurrentStep(head.number);
                    }}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                      isCurrent
                        ? 'bg-blue-700 text-white shadow-xs'
                        : isMod
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : hasValue && !isZero
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isZero
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>H{head.number}</span>
                    {isMod && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                    {hasValue && !isZero && !isMod && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </button>
                );
              })}

              <button
                onClick={async () => {
                  await saveCurrentHead(currentStep);
                  setCurrentStep(9);
                }}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                  currentStep === 9
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview &amp; Submit</span>
              </button>
            </div>

            {/* STEP 1..8: HEAD FORM */}
            {currentStep >= 1 && currentStep <= 8 && activeMetric && (
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                          Head {currentStep} of 8 &bull; {selectedMonth} {selectedYear}
                        </span>
                        {isCurrentHeadAdminModified && (
                          <Badge variant="warning" className="text-[10px]">
                            Modified by Admin
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-slate-900 mt-1">
                        {activeMetric.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {activeMetric.description}
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Weightage</span>
                      <Badge variant="outline" className="text-sm font-mono font-bold text-blue-800 bg-blue-50 border-blue-200">
                        {activeMetric.maxMarks} Marks Max
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* ADMIN MODIFICATION NOTIFICATION BANNER (Part 6) */}
                  {isCurrentHeadAdminModified && evaluation?.head_marks?.[currentStep] && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Head {currentStep} marks were modified by Admin after review.</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200 text-[11px]">
                        <div>
                          <span className="text-slate-600 block">Original Marks:</span>
                          <strong className="font-mono text-slate-900">
                            {evaluation.head_marks[currentStep].original_faculty_marks ?? 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block">Final Marks:</span>
                          <strong className="font-mono text-amber-900 font-bold">
                            {evaluation.head_marks[currentStep].marks}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block">Status:</span>
                          <strong className="text-amber-800">Modified by Admin</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 block">Reviewed on:</span>
                          <strong className="text-slate-700">
                            {evaluation.head_marks[currentStep].admin_modified_at
                              ? new Date(evaluation.head_marks[currentStep].admin_modified_at!).toLocaleDateString()
                              : 'Approved'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zero weightage note */}
                  {activeMetric.maxMarks === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      <Info className="w-4 h-4 text-slate-400 inline mr-1.5" />
                      This metric carries <strong>0 Marks</strong> weightage in {selectedMonth}. You can proceed to the next step.
                    </div>
                  ) : currentStep === 1 ? (
                    /* Head 1 Admin Note */
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Head 1 marks are verified and assigned directly by Admin / IQAC</span>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Current Recorded Head 1 Score:{' '}
                        <strong>{headFormState[1]?.marks || '0'} / {activeMetric.maxMarks} Marks</strong>.
                      </p>
                    </div>
                  ) : (
                    /* Head 2..8 Form */
                    <div className="space-y-6">
                      {/* Metric Guidance */}
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-blue-900 block">Performance Evaluation Rule:</span>
                        <p className="text-slate-600">{activeMetric.description}</p>
                      </div>

                      {/* Marks Input */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Self-Appraisal Score ({selectedMonth}):
                        </label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max={activeMetric.maxMarks}
                            disabled={isReadOnly || isCurrentHeadAdminModified}
                            value={headFormState[currentStep]?.marks || ''}
                            onChange={(e) => handleMarksChange(currentStep, e.target.value)}
                            placeholder={`Enter score out of ${activeMetric.maxMarks}`}
                            className="h-10 sm:h-11 text-sm sm:text-base font-mono font-bold w-full sm:w-56"
                          />
                          <span className="text-xs text-slate-400 font-semibold">
                            / {activeMetric.maxMarks} Marks Max
                          </span>
                        </div>
                        {isCurrentHeadAdminModified && (
                          <p className="text-[11px] text-amber-800 mt-1 font-medium">
                            This score was reviewed and approved by Admin and is locked from further faculty edits.
                          </p>
                        )}
                      </div>

                      {/* Reference Document Upload Section with 1 MB Limit */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                          <label className="text-xs font-bold text-slate-800">
                            Supporting Reference Document (Evidence):
                          </label>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Maximum file size: 1 MB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Upload official proof corresponding to this month&apos;s metric. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG.
                        </p>

                        {headFormState[currentStep]?.file_name ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-5 h-5 text-blue-700 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {headFormState[currentStep].file_name}
                                  </span>
                                  {headFormState[currentStep].file_size ? (
                                    <span className="text-[10px] text-slate-500">
                                      {(headFormState[currentStep].file_size / 1024).toFixed(1)} KB
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewerDoc({
                                      isOpen: true,
                                      fileName: headFormState[currentStep].file_name || 'Evidence Document',
                                      fileUrl: headFormState[currentStep].file_url,
                                      fileType: headFormState[currentStep].file_type,
                                      fileSize: headFormState[currentStep].file_size,
                                      title: `Head ${currentStep}: ${monthFramework.heads[currentStep]?.name || 'Evidence Document'}`,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                  title="View Reference File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>

                                {!isReadOnly && !isCurrentHeadAdminModified && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(currentStep)}
                                    className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                                    title="Remove Document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Aspect-Ratio Preserving Image Preview */}
                            {headFormState[currentStep]?.file_url &&
                              (headFormState[currentStep]?.file_type?.startsWith('image/') ||
                                /\.(jpg|jpeg|png|webp|gif)$/i.test(headFormState[currentStep]?.file_name || '')) && (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Original Evidence Document / Image Preview:</span>
                                </p>
                                <div className="w-full flex items-center justify-center max-h-72 overflow-hidden bg-white p-2 rounded-lg border border-slate-200">
                                  <img
                                    src={headFormState[currentStep].file_url}
                                    alt={headFormState[currentStep].file_name || 'Evidence Preview'}
                                    className="max-h-64 max-w-full object-contain rounded"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : !isReadOnly && !isCurrentHeadAdminModified ? (
                          <div className="mt-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(currentStep, e)}
                              className="hidden"
                              id={`file-upload-input-${currentStep}`}
                            />
                            <label
                              htmlFor={`file-upload-input-${currentStep}`}
                              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 p-6 rounded-xl cursor-pointer transition-colors text-center"
                            >
                              <Upload className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-blue-700">
                                {isUploadingFile ? 'Uploading document...' : 'Click to Browse & Upload Evidence File'}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG &bull; Maximum file size: 1 MB
                              </span>
                            </label>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No document attached.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-slate-50/70 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentStep === 1}
                    onClick={handlePrevStep}
                    className="cursor-pointer font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNextStep}
                      disabled={isSaving}
                      className="cursor-pointer font-bold"
                    >
                      {currentStep === 8 ? 'Proceed to Preview' : 'Save & Next'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* STEP 9: PREVIEW & FINAL SUBMIT TABLE */}
            {currentStep === 9 && (
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <CardTitle className="text-xl text-slate-900">
                        Self-Appraisal Summary Preview ({selectedMonth} {selectedYear})
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Review all 8 performance appraisal heads and attached evidence before final submission
                      </CardDescription>
                    </div>

                    <Badge variant="outline" className="text-sm font-mono font-bold text-blue-900 bg-blue-50 border-blue-200">
                      Total: {calculateLiveTotal()} / {monthFramework.totalMarks} M
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <Table className="w-full text-xs min-w-[640px]">
                    <TableHeader>
                      <TableRow className="bg-slate-100/70">
                        <TableHead className="w-16 font-bold text-slate-700">Head</TableHead>
                        <TableHead className="font-bold text-slate-700">Performance Metric</TableHead>
                        <TableHead className="w-28 font-bold text-slate-700 text-center">Max Marks</TableHead>
                        <TableHead className="w-28 font-bold text-slate-700 text-center">Your Score</TableHead>
                        <TableHead className="w-40 font-bold text-slate-700">Attached Evidence</TableHead>
                        <TableHead className="w-16 font-bold text-slate-700 text-center">Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PERFORMANCE_HEADS.map((h) => {
                        const m = monthFramework.heads[h.number];
                        const val = headFormState[h.number]?.marks;
                        const doc = headFormState[h.number];
                        const isMod = evaluation?.head_marks?.[h.number]?.is_admin_modified;

                        return (
                          <TableRow key={h.number} className="hover:bg-slate-50/50">
                            <TableCell className="font-mono font-bold text-slate-600">H{h.number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{m?.name || h.name}</span>
                                {isMod && (
                                  <Badge variant="warning" className="text-[9px] px-1 py-0">
                                    Modified by Admin
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">{m?.description || ''}</span>
                            </TableCell>
                            <TableCell className="text-center font-mono font-semibold text-slate-500">
                              {m?.maxMarks ?? 0}
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold text-blue-700">
                              {val !== '' && val !== undefined ? val : '0'}
                            </TableCell>
                            <TableCell>
                              {doc?.file_name ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewerDoc({
                                      isOpen: true,
                                      fileName: doc.file_name || 'Evidence Document',
                                      fileUrl: doc.file_url,
                                      fileType: doc.file_type,
                                      fileSize: doc.file_size,
                                      title: `Head ${h.number}: ${m?.name || h.name}`,
                                    })
                                  }
                                  className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold text-xs cursor-pointer text-left group"
                                  title="Click to View Document"
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                  <span className="truncate max-w-[130px] underline group-hover:text-blue-950">
                                    {doc.file_name}
                                  </span>
                                  <Eye className="w-3 h-3 text-slate-400 shrink-0" />
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-xs">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => setCurrentStep(h.number)}
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Edit Head"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>

                <CardFooter className="bg-slate-50/70 border-t border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(8)}
                    className="cursor-pointer font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Head 8
                  </Button>

                  {!isReadOnly && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleFinalSubmit}
                      disabled={isSaving}
                      className="cursor-pointer font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      {isSaving ? 'Submitting...' : `Final Submit (${selectedMonth} ${selectedYear})`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEW 3: FINAL REPORT (ANNUAL SAR SUMMARY)                                */}
        {/* ======================================================================= */}
        {activeView === 'final_report' && (
          <div className="space-y-6">
            {/* Top Header */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Faculty Final Report</h1>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  12-Month Self-Appraisal &amp; SAR Consolidated Summary (Academic Year {selectedYear} &ndash; {selectedYear + 1})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleDownloadFinalReport}
                  disabled={isExportingReport || isLoading}
                  className="font-bold flex items-center gap-2 shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isExportingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating 13-Sheet Excel...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Final Report (.xlsx)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Annual Score</p>
                    <h3 className="text-2xl font-black text-slate-900 font-mono">
                      {annualSummary.totalEarned} <span className="text-xs font-normal text-slate-400">/ 1000 M</span>
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Months</p>
                    <h3 className="text-2xl font-black text-slate-900 font-mono">
                      {annualSummary.completedMonthsCount} <span className="text-xs font-normal text-slate-400">/ 12</span>
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Performance Rating</p>
                    <h3 className="text-lg font-bold text-slate-900">{annualSummary.performanceStatus}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 12 Months Breakdown Cards */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Monthly Performance Summary
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Breakdown across all 12 academic months (July to June)
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {CALENDAR_MONTHS.map((m) => {
                    const fid = user?.faculty_id?.toUpperCase() || '';
                    const evalItem =
                      annualEvaluations[DataService.getEvaluationKey(fid, selectedYear, m)] ||
                      annualEvaluations[`${fid}_${selectedYear}_${m}`] ||
                      annualEvaluations[`${fid}_${selectedYear}_${m.toLowerCase()}`];
                    const score = evalItem?.total_marks ?? 0;
                    const status: string = evalItem?.status || 'not_started';
                    const fw = APPRAISAL_FRAMEWORK[m];

                    return (
                      <div
                        key={m}
                        className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{m}</span>
                          <Badge
                            variant={status === 'pending' ? 'success' : status === 'draft' ? 'warning' : 'outline'}
                            className="text-[10px] py-0 px-1.5 capitalize"
                          >
                            {status === 'not_started' ? 'Pending' : status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Score:</span>
                          <span className="font-mono font-bold text-sm text-blue-900">
                            {score} / {fw?.totalMarks ?? 0} M
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Submission Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Evaluation Submitted Successfully!"
        message={`Your self-appraisal for ${selectedMonth} ${selectedYear} has been recorded and submitted to Admin / IQAC.`}
      />

      {/* Reference / Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc((prev) => ({ ...prev, isOpen: false }))}
        fileName={viewerDoc.fileName}
        fileUrl={viewerDoc.fileUrl}
        fileType={viewerDoc.fileType}
        fileSize={viewerDoc.fileSize}
        title={viewerDoc.title}
      />
    </div>
  );
}
