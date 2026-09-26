const fs = require('fs');

const code = `'use client';

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
  DEPARTMENTS,
  DESIGNATIONS,
  APPRAISAL_FRAMEWORK,
} from '@/lib/constants/heads';
import { exportFacultyFinalReportToExcel } from '@/lib/excel/export';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SuccessModal } from '@/components/ui/success-modal';
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
  Paperclip,
  Trash2,
  ExternalLink,
  Award,
  User,
  LayoutDashboard,
  FileCheck,
  FileSpreadsheet,
  Download,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type FacultyView = 'dashboard' | 'evaluation' | 'final_report' | 'profile';

export default function FacultyEvaluationPortal() {
  const { user, updateCurrentUserProfile } = useAuth();

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

  // Success Modals
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isProfileSuccessModalOpen, setIsProfileSuccessModalOpen] = useState<boolean>(false);

  // Profile Management Form State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    designation: user?.designation || '',
    department: user?.department || '',
  });

  // Final Report Expanded Months Accordion State
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    July: true,
    August: true,
    September: true,
  });
  const [reportMonthFilter, setReportMonthFilter] = useState<string>('all');

  // Local form state for Head 1-8 marks and uploaded files
  const [headFormState, setHeadFormState] = useState<
    Record<
      number,
      {
        marks: string;
        file_name?: string;
        file_path?: string;
        file_size?: number;
        file_type?: string;
        file_url?: string;
      }
    >
  >({
    1: { marks: '' },
    2: { marks: '' },
    3: { marks: '' },
    4: { marks: '' },
    5: { marks: '' },
    6: { marks: '' },
    7: { marks: '' },
    8: { marks: '' },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Month Framework Rules
  const monthFramework = getMonthFramework(selectedMonth);

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        designation: user.designation,
        department: user.department,
      });
    }
  }, [user]);

  // Load evaluation record & annual evaluation data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const locked = await DataService.isMonthLocked(selectedYear, selectedMonth);
        setIsMonthLocked(locked);

        const evalData = await DataService.getEvaluation(user.faculty_id, selectedYear, selectedMonth);
        setEvaluation(evalData);

        const allAnnual = await DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear);
        setAnnualEvaluations(allAnnual);

        const initialFormState: Record<
          number,
          {
            marks: string;
            file_name?: string;
            file_path?: string;
            file_size?: number;
            file_type?: string;
            file_url?: string;
          }
        > = {
          1: { marks: '' },
          2: { marks: '' },
          3: { marks: '' },
          4: { marks: '' },
          5: { marks: '' },
          6: { marks: '' },
          7: { marks: '' },
          8: { marks: '' },
        };

        if (evalData.head_marks) {
          Object.values(evalData.head_marks).forEach((hm: EvaluationHeadMark) => {
            initialFormState[hm.head_number] = {
              marks: hm.marks !== null && hm.marks !== undefined ? String(hm.marks) : '',
              file_name: hm.file_name || '',
              file_path: hm.file_path || '',
              file_size: hm.file_size || 0,
              file_type: hm.file_type || '',
              file_url: hm.file_url || '',
            };
          });
        }

        setHeadFormState(initialFormState);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error loading evaluation record.';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, selectedYear, selectedMonth]);

  const handleMarksChange = (headNum: number, value: string) => {
    setHeadFormState((prev) => ({
      ...prev,
      [headNum]: {
        ...prev[headNum],
        marks: value,
      },
    }));
  };

  // Upload Document Reference
  const handleFileUpload = async (headNum: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingFile(true);
    setErrorMsg(null);

    try {
      const uploadRes = await DataService.uploadReferenceDocument(
        user.faculty_id,
        selectedYear,
        selectedMonth,
        headNum,
        file
      );

      setHeadFormState((prev) => ({
        ...prev,
        [headNum]: {
          ...prev[headNum],
          file_name: uploadRes.file_name,
          file_path: uploadRes.file_path,
          file_size: uploadRes.file_size,
          file_type: uploadRes.file_type,
          file_url: uploadRes.file_url,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'File upload failed.';
      setErrorMsg(message);
    } finally {
      setIsUploadingFile(false);
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
      },
    }));
  };

  // Save current active head marks into draft state (silently, without popups)
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

    const state = headFormState[headNum];
    const marksVal = state?.marks ? parseFloat(state.marks) : null;

    if (marksVal !== null && (isNaN(marksVal) || marksVal < 0 || marksVal > metric.maxMarks)) {
      setErrorMsg(\`Marks for \${metric.name} must be between 0 and \${metric.maxMarks}.\`);
      return false;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updated = await DataService.saveHeadMark(
        user.faculty_id,
        selectedYear,
        selectedMonth,
        headNum,
        marksVal,
        {
          file_name: state?.file_name,
          file_path: state?.file_path,
          file_size: state?.file_size,
          file_type: state?.file_type,
          file_url: state?.file_url,
        },
        '',
        false
      );
      setEvaluation(updated);

      // Refresh annual data map
      const allAnnual = await DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear);
      setAnnualEvaluations(allAnnual);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save marks.';
      setErrorMsg(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    setErrorMsg(null);
    if (currentStep <= 8) {
      const saved = await saveCurrentHead(currentStep);
      if (saved) {
        setCurrentStep((prev) => Math.min(prev + 1, 9));
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 9));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final submit handler (shows single final modal)
  const handleSubmitFinalEvaluation = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      // Save all active heads 2 to 8
      for (let h = 2; h <= 8; h++) {
        const metric = monthFramework.heads[h];
        if (metric && metric.maxMarks > 0) {
          const state = headFormState[h];
          const marksVal = state?.marks ? parseFloat(state.marks) : null;
          await DataService.saveHeadMark(
            user.faculty_id,
            selectedYear,
            selectedMonth,
            h,
            marksVal,
            {
              file_name: state?.file_name,
              file_path: state?.file_path,
              file_size: state?.file_size,
              file_type: state?.file_type,
              file_url: state?.file_url,
            },
            '',
            false
          );
        }
      }

      const submitted = await DataService.submitEvaluation(user.faculty_id, selectedYear, selectedMonth);
      setEvaluation(submitted);

      // Refresh annual data map
      const allAnnual = await DataService.getFacultyAnnualEvaluations(user.faculty_id, selectedYear);
      setAnnualEvaluations(allAnnual);

      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit evaluation.';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profileForm.name.trim()) {
      setErrorMsg('Faculty Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updatedProfile = await DataService.updateFacultyProfile(user.faculty_id, {
        name: profileForm.name,
        designation: profileForm.designation,
        department: profileForm.department,
      });

      // Update user in context / local session cleanly
      updateCurrentUserProfile(updatedProfile);

      setIsEditingProfile(false);
      setIsProfileSuccessModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live preview total marks
  const calculateLiveTotal = () => {
    let total = 0;
    // Head 1 (from evaluation / admin)
    const h1 = evaluation?.head_marks?.[1]?.marks;
    if (h1 !== null && h1 !== undefined) total += Number(h1);

    // Heads 2 to 8 (from form state)
    for (let h = 2; h <= 8; h++) {
      const max = monthFramework.heads[h]?.maxMarks ?? 0;
      if (max > 0) {
        const val = parseFloat(headFormState[h]?.marks || '0');
        if (!isNaN(val)) total += val;
      }
    }
    return total;
  };

  // Annual cumulative calculations
  const calculateAnnualSummary = () => {
    let totalEarned = 0;
    let totalAvailable = 0;
    let completedMonthsCount = 0;
    const headTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    const availableHeadTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

    CALENDAR_MONTHS.forEach((m) => {
      const framework = APPRAISAL_FRAMEWORK[m];
      const key = \`\${user?.faculty_id.toUpperCase()}_\${selectedYear}_\${m}\`;
      const evalItem = annualEvaluations[key];

      if (evalItem) {
        completedMonthsCount += 1;
        totalEarned += Number(evalItem.total_marks) || 0;
        totalAvailable += framework.totalMarks;

        for (let h = 1; h <= 8; h++) {
          const mark = evalItem.head_marks?.[h]?.marks;
          if (mark !== null && mark !== undefined) {
            headTotals[h] += Number(mark);
          }
          availableHeadTotals[h] += framework.heads[h]?.maxMarks || 0;
        }
      }
    });

    const progressPercentage = totalAvailable > 0 ? (totalEarned / totalAvailable) * 100 : 0;

    return {
      totalEarned,
      totalAvailable,
      completedMonthsCount,
      headTotals,
      availableHeadTotals,
      progressPercentage,
    };
  };

  const annualSummary = calculateAnnualSummary();

  // Excel download handler
  const handleDownloadExcel = () => {
    if (!user) return;
    exportFacultyFinalReportToExcel(user, selectedYear, annualEvaluations);
  };

  const toggleMonthAccordion = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const isSubmitted = evaluation?.status === 'submitted';
  const isReadOnly = isSubmitted || isMonthLocked;

  // Active Head info for step 1 to 8
  const activeMetric = currentStep <= 8 ? monthFramework.heads[currentStep] : null;
  const isCurrentHeadAdminOnly = currentStep === 1;
  const isCurrentHeadZeroWeight = activeMetric ? activeMetric.maxMarks === 0 : false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Profile Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Self-Appraisal Portal</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                NSRIET Annual Performance Appraisal & IQAC Management System
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg text-slate-800 font-bold">
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>{user?.name}</span>
            </div>
            <div className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-mono font-bold">
              ID: {user?.faculty_id}
            </div>
            <div className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
              Dept: <strong className="text-slate-900">{user?.department}</strong>
            </div>
            <div className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
              Desig: <strong className="text-slate-900">{user?.designation}</strong>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col sm:flex-row items-end md:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-700" /> Academic Year:
          </span>
          <Select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setCurrentStep(1);
            }}
            className="h-8 text-xs font-bold py-0 px-2.5 w-28 bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y} - {y + 1}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Faculty Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 rounded-xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveView('dashboard')}
          className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer \${
            activeView === 'dashboard'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }\`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button
          onClick={() => {
            setActiveView('evaluation');
            setCurrentStep(1);
          }}
          className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer \${
            activeView === 'evaluation'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }\`}
        >
          <FileCheck className="w-4 h-4" />
          Current Evaluation ({selectedMonth})
        </button>

        <button
          onClick={() => setActiveView('final_report')}
          className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer \${
            activeView === 'final_report'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }\`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Final Report ({selectedYear})
        </button>

        <button
          onClick={() => setActiveView('profile')}
          className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer \${
            activeView === 'profile'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }\`}
        >
          <User className="w-4 h-4" />
          Profile Management
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: FACULTY DASHBOARD                                                 */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Access Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Current Evaluation */}
            <Card className="border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Current Period
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
                  Target: {monthFramework.totalMarks} Marks (8 Performance Heads)
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
                    Annual Summary
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                    1000 Max Target
                  </Badge>
                </div>
                <CardTitle className="text-lg text-slate-900 mt-1">
                  Final Report ({selectedYear})
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

            {/* Card 3: Profile Management */}
            <Card className="border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    Profile Data
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 font-mono">
                    {user?.faculty_id}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-slate-900 mt-1 truncate">
                  {user?.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 truncate">
                  {user?.designation} &bull; {user?.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Faculty ID:</span>{' '}
                    <strong className="text-slate-800 font-mono">{user?.faculty_id}</strong> (Read-only)
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>{' '}
                    <strong className="text-slate-800 capitalize">{user?.role}</strong>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-bold justify-center cursor-pointer text-slate-700 hover:text-purple-700"
                  onClick={() => setActiveView('profile')}
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Manage Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Monthly Progress Timeline */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-900">
                    Academic Year {selectedYear} Evaluation Timeline
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Click any month to load and evaluate self-appraisal marks
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Excel (.xlsx)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MONTHS.map((m) => {
                  const key = \`\${user?.faculty_id.toUpperCase()}_\${selectedYear}_\${m}\`;
                  const evalItem = annualEvaluations[key];
                  const mFramework = getMonthFramework(m);
                  const isSelected = selectedMonth === m;

                  return (
                    <div
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        setActiveView('evaluation');
                        setCurrentStep(1);
                      }}
                      className={\`p-3 rounded-xl border transition-all cursor-pointer text-center \${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200 shadow-xs'
                          : evalItem?.status === 'submitted'
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                          : evalItem
                          ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }\`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{m}</span>
                      <span className="text-[10px] text-slate-400 block mb-1.5">
                        Target: {mFramework.totalMarks}M
                      </span>

                      {evalItem ? (
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs text-blue-700">
                          {Number(evalItem.total_marks).toFixed(1)}M
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Not evaluated</span>
                      )}

                      <div className="mt-2">
                        {evalItem?.status === 'submitted' ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                            Submitted
                          </span>
                        ) : evalItem ? (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                            Draft
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CURRENT MONTH EVALUATION WORKFLOW                                 */}
      {/* ========================================================================= */}
      {activeView === 'evaluation' && (
        <div className="space-y-6">
          {/* Month Status & Target Score Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentStep(1);
                }}
                className="h-9 text-xs font-bold py-0 px-2.5 bg-slate-800 text-white border-slate-700 w-36"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m} ({getMonthFramework(m).totalMarks}M)
                  </option>
                ))}
              </Select>

              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Evaluation Month & Target
                </span>
                <span className="text-sm font-bold text-amber-400">
                  {selectedMonth} {selectedYear} &bull; Maximum Target: {monthFramework.totalMarks} Marks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMonthLocked && (
                <Badge variant="danger" className="text-xs px-2.5 py-1 gap-1">
                  <Lock className="w-3 h-3" /> Month Locked by Admin
                </Badge>
              )}

              {isSubmitted ? (
                <Badge variant="success" className="text-xs px-2.5 py-1 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Submitted
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs px-2.5 py-1 gap-1">
                  <Edit3 className="w-3 h-3" /> Draft in Progress
                </Badge>
              )}

              <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                Score: {calculateLiveTotal().toFixed(1)} / {monthFramework.totalMarks}
              </div>
            </div>
          </div>

          {/* Stepper Navigation (1..8 + Preview) */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((headNo) => {
                const metric = monthFramework.heads[headNo];
                const isZero = (metric?.maxMarks ?? 0) === 0;
                const isCurrent = currentStep === headNo;
                const isPast = currentStep > headNo;
                const hasScore =
                  headNo === 1
                    ? evaluation?.head_marks?.[1]?.marks !== null && evaluation?.head_marks?.[1]?.marks !== undefined
                    : headFormState[headNo]?.marks !== '';

                return (
                  <button
                    key={headNo}
                    onClick={() => setCurrentStep(headNo)}
                    className={\`flex flex-col items-center gap-1 group cursor-pointer transition-all \${
                      isCurrent ? 'scale-105 font-bold' : 'opacity-80 hover:opacity-100'
                    }\`}
                  >
                    <div
                      className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors \${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : isPast || hasScore
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isZero
                          ? 'bg-slate-100 text-slate-400 border border-slate-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }\`}
                    >
                      {headNo === 1 ? 'H1' : \`H\${headNo}\`}
                    </div>
                    <span className="text-[10px] text-slate-600 max-w-[64px] text-center truncate">
                      {metric ? \`\${metric.maxMarks}M\` : '0M'}
                    </span>
                  </button>
                );
              })}

              {/* Step 9: Preview & Submit */}
              <button
                onClick={() => setCurrentStep(9)}
                className={\`flex flex-col items-center gap-1 group cursor-pointer transition-all \${
                  currentStep === 9 ? 'scale-105 font-bold' : 'opacity-80 hover:opacity-100'
                }\`}
              >
                <div
                  className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors \${
                    currentStep === 9
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                      : isSubmitted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }\`}
                >
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">Preview</span>
              </button>
            </div>
          </div>

          {/* STEP CONTENT: STEPS 1 TO 8 */}
          {currentStep <= 8 && activeMetric && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
                      Performance Head {activeMetric.headNumber} of 8
                    </span>
                    <CardTitle className="text-xl text-slate-900 mt-0.5">
                      {activeMetric.name}
                    </CardTitle>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={isCurrentHeadZeroWeight ? 'secondary' : 'primary'}
                      className="text-xs px-2.5 py-1 font-bold"
                    >
                      Monthly Maximum: {activeMetric.maxMarks} Marks
                    </Badge>
                  </div>
                </div>

                <CardDescription className="text-xs text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 block mb-0.5">Official Metric Guideline:</strong>
                  {activeMetric.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* HEAD 1: READ-ONLY ADMIN HEAD */}
                {isCurrentHeadAdminOnly ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-blue-900 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Info className="w-4 h-4 text-blue-700" />
                        <span>IQAC Administrator Assessed Head</span>
                      </div>
                      <p className="text-slate-700">
                        Head 1 (Pass % & IQAC Visit) marks are directly evaluated and entered by the College Administration / IQAC. Faculty cannot enter or modify marks for this section, and no reference document upload is required.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm">
                      <span className="text-xs text-slate-500 block">Assigned Head 1 Marks:</span>
                      <div className="text-2xl font-mono font-black text-blue-700 mt-1">
                        {evaluation?.head_marks?.[1]?.marks !== null && evaluation?.head_marks?.[1]?.marks !== undefined
                          ? \`\${Number(evaluation.head_marks[1].marks).toFixed(1)} / \${activeMetric.maxMarks}\`
                          : \`Pending Evaluation (Max: \${activeMetric.maxMarks})\`}
                      </div>
                    </div>
                  </div>
                ) : isCurrentHeadZeroWeight ? (
                  /* ZERO-WEIGHTAGE HEAD */
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-2">
                    <Info className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="font-bold text-sm text-slate-700">Not Applicable this Month</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      According to the NSRIET Faculty Performance Appraisal Manual, no weightage is allocated for{' '}
                      <strong>{activeMetric.name}</strong> during the month of <strong>{selectedMonth}</strong> (0 Marks).
                      No marks or document uploads are required for this head.
                    </p>
                  </div>
                ) : (
                  /* HEADS 2 TO 8 WITH WEIGHTAGE */
                  <div className="space-y-6">
                    {/* Marks Entry Field */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Self-Appraisal Marks (0 to {activeMetric.maxMarks}):
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max={activeMetric.maxMarks}
                          disabled={isReadOnly}
                          value={headFormState[currentStep]?.marks || ''}
                          onChange={(e) => handleMarksChange(currentStep, e.target.value)}
                          placeholder={\`Enter score out of \${activeMetric.maxMarks}\`}
                          className="h-11 text-base font-mono font-bold w-full sm:w-56"
                        />
                        <span className="text-xs text-slate-400 font-semibold">
                          / {activeMetric.maxMarks} Marks Max
                        </span>
                      </div>
                    </div>

                    {/* Reference Document Upload Section */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block">
                        Supporting Reference Document (Evidence):
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Upload official proof corresponding to this month&apos;s metric. Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG (Max 15MB).
                      </p>

                      {headFormState[currentStep]?.file_name ? (
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
                            {headFormState[currentStep].file_url && (
                              <a
                                href={headFormState[currentStep].file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="View Document"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {!isReadOnly && (
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
                      ) : !isReadOnly ? (
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(currentStep, e)}
                            className="hidden"
                            id={\`file-upload-input-\${currentStep}\`}
                          />
                          <label
                            htmlFor={\`file-upload-input-\${currentStep}\`}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 p-6 rounded-xl cursor-pointer transition-colors text-center"
                          >
                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-blue-700">
                              {isUploadingFile ? 'Uploading document...' : 'Click to Browse & Upload Evidence File'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 15MB)
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

              <CardFooter className="bg-slate-50/70 border-t border-slate-200 p-4 flex items-center justify-between">
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
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Self-Appraisal Summary Preview ({selectedMonth} {selectedYear})
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Review all 8 performance appraisal heads and attached evidence before final submission
                    </CardDescription>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Monthly Score</span>
                    <span className="text-2xl font-mono font-black text-blue-700">
                      {calculateLiveTotal().toFixed(1)} / {monthFramework.totalMarks}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 text-slate-800">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-64 font-bold">Performance Head</TableHead>
                      <TableHead className="min-w-[200px]">Metric Description</TableHead>
                      <TableHead className="w-24 text-center font-bold">Max</TableHead>
                      <TableHead className="w-24 text-center font-bold">Assigned</TableHead>
                      <TableHead className="w-40">Attached Evidence</TableHead>
                      <TableHead className="w-20 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((headNo) => {
                      const metric = monthFramework.heads[headNo];
                      const hasWeight = (metric?.maxMarks ?? 0) > 0;
                      const isH1 = headNo === 1;
                      const marksVal =
                        isH1
                          ? evaluation?.head_marks?.[1]?.marks
                          : headFormState[headNo]?.marks !== ''
                          ? headFormState[headNo]?.marks
                          : null;
                      const file = headFormState[headNo];

                      return (
                        <TableRow key={headNo} className={!hasWeight ? 'bg-slate-50/40 opacity-60' : 'hover:bg-blue-50/30'}>
                          <TableCell className="font-mono text-xs font-bold text-slate-400">
                            {headNo}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 text-xs">
                            {metric?.name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {metric?.description}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold text-slate-500">
                            {metric?.maxMarks ?? 0}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">
                            {!hasWeight ? (
                              <span className="text-slate-300">0</span>
                            ) : marksVal !== null && marksVal !== undefined ? (
                              <span className="text-blue-700">{Number(marksVal).toFixed(1)}</span>
                            ) : isH1 ? (
                              <span className="text-amber-600 text-[10px]">Admin Pending</span>
                            ) : (
                              <span className="text-slate-400">0.0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {file?.file_name ? (
                              <div className="flex items-center gap-1.5 text-blue-700 font-semibold truncate max-w-[150px]">
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{file.file_name}</span>
                              </div>
                            ) : hasWeight && !isH1 ? (
                              <span className="text-[10px] text-slate-400">No file</span>
                            ) : (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isReadOnly && !isH1 && hasWeight && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCurrentStep(headNo)}
                                className="h-7 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>

              <CardFooter className="bg-slate-50/70 border-t border-slate-200 p-4 flex items-center justify-between">
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
                    variant="success"
                    onClick={handleSubmitFinalEvaluation}
                    disabled={isSaving}
                    className="font-bold cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSaving ? 'Submitting Evaluation...' : \`Submit Final Evaluation (\${selectedMonth} \${selectedYear})\`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: FINAL REPORT                                                      */}
      {/* ========================================================================= */}
      {activeView === 'final_report' && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Annual Performance Appraisal Report &bull; {selectedYear} - {selectedYear + 1}
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative evaluation history for Faculty ID: <strong className="text-slate-800 font-mono">{user?.faculty_id}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter Month:</span>
                <Select
                  value={reportMonthFilter}
                  onChange={(e) => setReportMonthFilter(e.target.value)}
                  className="h-8 text-xs font-semibold py-0 px-2 w-36"
                >
                  <option value="all">All Available Months</option>
                  {CALENDAR_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadExcel}
                className="font-bold cursor-pointer bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export Excel (.xlsx)
              </Button>
            </div>
          </div>

          {/* Annual Summary Card (1000-Mark Model) */}
          <Card className="border-slate-200 shadow-xs bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
            <CardHeader className="border-b border-slate-700/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                    IQAC Performance Appraisal Framework
                  </span>
                  <CardTitle className="text-xl text-white mt-0.5">
                    Annual Consolidation Summary ({selectedYear})
                  </CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Annual Target Benchmark</span>
                  <span className="text-2xl font-mono font-black text-amber-400">1000.0 Marks</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Progress Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <span className="text-xs text-blue-200 block">Total Marks Earned</span>
                  <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
                    {annualSummary.totalEarned.toFixed(1)}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    from {annualSummary.completedMonthsCount} recorded months
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <span className="text-xs text-blue-200 block">Total Marks Evaluated</span>
                  <div className="text-3xl font-mono font-black text-white mt-1">
                    {annualSummary.totalAvailable}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    out of 1000 annual max marks
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <span className="text-xs text-blue-200 block">Evaluation Performance</span>
                  <div className="text-3xl font-mono font-black text-amber-400 mt-1">
                    {annualSummary.totalAvailable > 0
                      ? \`\${annualSummary.progressPercentage.toFixed(1)}%\`
                      : 'N/A'}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Earned vs Evaluated Score
                  </span>
                </div>
              </div>

              {/* Head-wise Cumulative Summary */}
              <div>
                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-3">
                  Head-Wise Cumulative Marks (Annual Breakdown)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PERFORMANCE_HEADS.map((head) => {
                    const earned = annualSummary.headTotals[head.number] || 0;
                    return (
                      <div
                        key={head.number}
                        className="bg-black/20 p-3 rounded-lg border border-white/10 text-xs"
                      >
                        <span className="text-slate-400 text-[11px] block truncate">
                          H{head.number}: {head.name}
                        </span>
                        <div className="text-base font-mono font-bold text-white mt-1">
                          {earned.toFixed(1)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            / {head.annualMax}M
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Detailed Records */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Monthly Evaluation Breakdown</h3>

            {CALENDAR_MONTHS.filter(
              (m) => reportMonthFilter === 'all' || reportMonthFilter.toLowerCase() === m.toLowerCase()
            ).map((monthName) => {
              const framework = APPRAISAL_FRAMEWORK[monthName];
              const key = \`\${user?.faculty_id.toUpperCase()}_\${selectedYear}_\${monthName}\`;
              const evalItem = annualEvaluations[key];
              const isExpanded = expandedMonths[monthName] ?? false;

              return (
                <Card key={monthName} className="border-slate-200 shadow-xs overflow-hidden">
                  <div
                    onClick={() => toggleMonthAccordion(monthName)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <button className="p-1 rounded-md text-slate-500 hover:text-slate-800">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {monthName} {selectedYear}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Monthly Target: {framework.totalMarks} Marks
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {evalItem ? (
                        <>
                          {evalItem.status === 'submitted' ? (
                            <Badge variant="success" className="text-xs">
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">
                              Draft
                            </Badge>
                          )}
                          <div className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                            {Number(evalItem.total_marks).toFixed(1)} / {framework.totalMarks} M
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic bg-slate-100 px-3 py-1 rounded-lg">
                          Not Available / Not Yet Evaluated
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-0">
                      {evalItem ? (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-100 text-slate-800">
                              <TableHead className="w-12">#</TableHead>
                              <TableHead className="w-64 font-bold">Performance Head</TableHead>
                              <TableHead className="min-w-[200px]">Metric Description</TableHead>
                              <TableHead className="w-24 text-center font-bold">Max Target</TableHead>
                              <TableHead className="w-24 text-center font-bold">Earned Score</TableHead>
                              <TableHead className="w-40">Attached Reference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((headNo) => {
                              const metric = framework.heads[headNo];
                              const maxM = metric?.maxMarks ?? 0;
                              const headMark = evalItem.head_marks?.[headNo];
                              const markVal = headMark?.marks;

                              return (
                                <TableRow key={headNo} className={maxM === 0 ? 'bg-slate-50/40 opacity-60' : ''}>
                                  <TableCell className="font-mono text-xs font-bold text-slate-400">
                                    {headNo}
                                  </TableCell>
                                  <TableCell className="font-bold text-slate-900 text-xs">
                                    {metric?.name}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    {metric?.description}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-xs font-bold text-slate-500">
                                    {maxM}
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-xs">
                                    {maxM === 0 ? (
                                      <span className="text-slate-300">0</span>
                                    ) : markVal !== null && markVal !== undefined ? (
                                      <span className="text-blue-700">{Number(markVal).toFixed(1)}</span>
                                    ) : headNo === 1 ? (
                                      <span className="text-amber-600 text-[10px]">Admin Pending</span>
                                    ) : (
                                      <span className="text-slate-400">0.0</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {headMark?.file_name ? (
                                      <div className="flex items-center gap-1.5 text-blue-700 font-semibold truncate max-w-[150px]">
                                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{headMark.file_name}</span>
                                      </div>
                                    ) : maxM > 0 && headNo !== 1 ? (
                                      <span className="text-[10px] text-slate-400">No document</span>
                                    ) : (
                                      <span className="text-[10px] text-slate-300">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-xs italic">
                          No self-appraisal or IQAC evaluation submitted for {monthName} {selectedYear} yet.
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: PROFILE MANAGEMENT                                                */}
      {/* ========================================================================= */}
      {activeView === 'profile' && (
        <Card className="border-slate-200 shadow-xs max-w-2xl mx-auto">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">Faculty Profile Management</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Update your display name, designation, and department. Permanent Faculty ID is immutable.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 text-slate-700">
                {user?.faculty_id}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Field 1: Faculty ID (READ ONLY) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Permanent Faculty ID (EMP. ID):
                </label>
                <Input
                  type="text"
                  value={user?.faculty_id || ''}
                  disabled
                  className="bg-slate-100 text-slate-600 font-mono font-bold cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">
                  Faculty ID is the permanent identity key mapped to your official service records and historical evaluations. It cannot be altered.
                </p>
              </div>

              {/* Field 2: Faculty Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Full Name:
                </label>
                <Input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                  className={!isEditingProfile ? 'bg-slate-50 text-slate-800' : 'bg-white font-semibold'}
                />
              </div>

              {/* Field 3: Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Designation:
                </label>
                {isEditingProfile ? (
                  <Select
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, designation: e.target.value }))}
                    className="bg-white font-semibold text-xs"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type="text"
                    disabled
                    value={profileForm.designation}
                    className="bg-slate-50 text-slate-800"
                  />
                )}
              </div>

              {/* Field 4: Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Department:
                </label>
                {isEditingProfile ? (
                  <Select
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="bg-white font-semibold text-xs"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type="text"
                    disabled
                    value={profileForm.department}
                    className="bg-slate-50 text-slate-800"
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                {!isEditingProfile ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setIsEditingProfile(true)}
                    className="font-bold cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        if (user) {
                          setProfileForm({
                            name: user.name,
                            designation: user.designation,
                            department: user.department,
                          });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="success"
                      disabled={isSaving}
                      className="font-bold cursor-pointer shadow-sm"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      {isSaving ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FINAL SUBMISSION SUCCESS MODAL */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Appraisal Submitted Successfully!"
        message={\`Your monthly self-appraisal for \${selectedMonth} \${selectedYear} has been recorded with a total score of \${calculateLiveTotal().toFixed(1)} / \${monthFramework.totalMarks}. IQAC Administration can now review your submitted evidence.\`}
      />

      {/* PROFILE UPDATED SUCCESS MODAL */}
      <SuccessModal
        isOpen={isProfileSuccessModalOpen}
        onClose={() => setIsProfileSuccessModalOpen(false)}
        title="Profile Updated Successfully!"
        message={\`Your faculty profile information has been saved. Your permanent Faculty ID (\${user?.faculty_id}) remains unchanged, and all historical evaluation records are fully preserved.\`}
      />
    </div>
  );
}
`;

fs.writeFileSync('src/app/faculty/page.tsx', code);
console.log('Clean write of src/app/faculty/page.tsx complete.');
