'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import {
  exportAnnualConsolidationOnlyToExcel,
  exportSelectedMonthToExcel,
  exportCompleteReportToExcel,
} from '@/lib/excel/export';
import { CURRENT_DEFAULT_YEAR, CURRENT_DEFAULT_MONTH, DEPARTMENTS, CALENDAR_MONTHS } from '@/lib/constants/heads';
import { updateMonthlyExcelAction } from '@/app/actions/drive';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Download,
  FileSpreadsheet,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Layers,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

const ACADEMIC_MONTHS = [
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

interface ConsolidationRow {
  s_no: number;
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
  monthly_scores: Record<string, number | null>;
  monthly_statuses: Record<string, string>;
  annual_total: number;
  submitted_months_count: number;
  performance_status: string;
}

type DownloadOption = 'annual_only' | 'selected_month' | 'complete_report';

export default function AdminAnnualConsolidationPage() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_DEFAULT_YEAR);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [allRows, setAllRows] = useState<ConsolidationRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Download Dialog & Options State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [downloadOption, setDownloadOption] = useState<DownloadOption>('complete_report');
  const [targetMonth, setTargetMonth] = useState<string>(CURRENT_DEFAULT_MONTH);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load consolidation data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getAnnualConsolidation(selectedYear);
      setAllRows(data);
    } catch (err) {
      console.error('Failed to load annual consolidation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchDept = selectedDept === 'all' || row.department.toLowerCase() === selectedDept.toLowerCase();
      const matchSearch =
        searchTerm.trim() === '' ||
        row.faculty_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.designation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [allRows, selectedDept, searchTerm]);

  // Overall KPIs
  const totalFacultyCount = allRows.length;
  const filteredFacultyCount = filteredRows.length;
  const averageAnnualScore = useMemo(() => {
    if (filteredRows.length === 0) return 0;
    const total = filteredRows.reduce((acc, r) => acc + r.annual_total, 0);
    return Math.round((total / filteredRows.length) * 10) / 10;
  }, [filteredRows]);

  const topScorer = useMemo(() => {
    if (filteredRows.length === 0) return null;
    return [...filteredRows].sort((a, b) => b.annual_total - a.annual_total)[0];
  }, [filteredRows]);

  // Handle Export based on chosen option
  const handleExecuteDownload = async () => {
    setIsExporting(true);
    setToastMessage(null);
    try {
      const allFaculty = await DataService.getAllFaculty();
      const evals = await DataService.getAllEvaluationsMap(selectedYear);

      let driveStatusMessage = '';

      if (downloadOption === 'annual_only') {
        await exportAnnualConsolidationOnlyToExcel(allFaculty, selectedYear, evals);
      } else if (downloadOption === 'selected_month') {
        await exportSelectedMonthToExcel(allFaculty, selectedYear, targetMonth, evals);
        
        // Save same Excel file to Google Drive
        const driveResult = await updateMonthlyExcelAction(
          allFaculty.map((f: any) => ({
            faculty_id: f.faculty_id,
            name: f.name,
            department: f.department,
          })),
          selectedYear,
          targetMonth,
          evals
        );
        
        if (driveResult.success) {
          driveStatusMessage = `✓ Excel Downloaded & Archived\n${targetMonth} ${selectedYear} report downloaded and archived to Google Drive.`;
        } else {
          driveStatusMessage = 'Excel downloaded successfully, but Google Drive archive failed.';
        }
      } else {
        // Complete Report (13 sheets)
        await exportCompleteReportToExcel(allFaculty, selectedYear, evals);
      }

      setToastMessage({
        type: driveStatusMessage.includes('failed') ? 'error' : 'success',
        text: driveStatusMessage || 'Excel report downloaded successfully.',
      });
      setIsDownloadModalOpen(false);
    } catch (err) {
      console.error('Final report export error:', err);
      setToastMessage({
        type: 'error',
        text: 'Unable to generate the Excel report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Annual Consolidation</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive 12-Month Performance Tracker &amp; SAR Consolidation (Academic Year {selectedYear} &ndash; {selectedYear + 1})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            onClick={() => {
              setToastMessage(null);
              setIsDownloadModalOpen(true);
            }}
            disabled={isLoading}
            className="font-bold flex items-center gap-2 shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4" />
            Download Final Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Faculty</p>
              <h3 className="text-2xl font-extrabold text-slate-900">{totalFacultyCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {filteredFacultyCount} shown in current filter
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Annual Score</p>
              <h3 className="text-2xl font-extrabold text-slate-900">{averageAnnualScore} <span className="text-xs font-normal text-slate-400">/ 1000</span></h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all 12 academic months</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Highest Scorer</p>
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {topScorer ? topScorer.name : 'N/A'}
              </h3>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {topScorer ? `${topScorer.annual_total} pts (${topScorer.department})` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Academic Cycle</p>
              <h3 className="text-lg font-bold text-slate-900">{selectedYear} &ndash; {selectedYear + 1}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">12 Calendar Sheets + 1 Master</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Year Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
              <Select
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="h-10 text-xs font-semibold"
              >
                <option value="2026">2026 &ndash; 2027</option>
                <option value="2025">2025 &ndash; 2026</option>
                <option value="2024">2024 &ndash; 2025</option>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 text-xs font-semibold"
              >
                <option value="all">All Departments ({totalFacultyCount})</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            </div>

            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Search Faculty</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search by ID, Name, Department, or Designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consolidation Table */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Annual Evaluation Master Sheet</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
                {filteredRows.length} Faculty
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Monthly breakdown across July &ndash; June academic cycle. Maximum Annual Score: 1000 Marks.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Consolidating 12-month records for all faculty...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No faculty records match the selected filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the department filter or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <Table className="w-full text-xs border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-100/80 hover:bg-slate-100/80 border-b border-slate-200">
                    <TableHead className="w-12 font-bold text-slate-700 text-center sticky left-0 bg-slate-100 z-10">
                      S.No
                    </TableHead>
                    <TableHead className="w-28 font-bold text-slate-700 sticky left-12 bg-slate-100 z-10">
                      Faculty ID
                    </TableHead>
                    <TableHead className="min-w-[170px] font-bold text-slate-700 sticky left-40 bg-slate-100 z-10">
                      Faculty Name
                    </TableHead>
                    <TableHead className="w-24 font-bold text-slate-700">Dept</TableHead>
                    <TableHead className="w-32 font-bold text-slate-700">Designation</TableHead>

                    {/* 12 Academic Months */}
                    {ACADEMIC_MONTHS.map((month) => (
                      <TableHead
                        key={month}
                        className="w-16 font-bold text-slate-700 text-center px-2 text-[11px]"
                      >
                        {month.slice(0, 3)}
                      </TableHead>
                    ))}

                    <TableHead className="w-24 font-bold text-slate-900 text-center bg-blue-50/50">
                      Annual Total
                    </TableHead>
                    <TableHead className="w-24 font-bold text-slate-700 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRows.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <TableRow
                        key={row.faculty_id}
                        className={`hover:bg-blue-50/40 transition-colors border-b border-slate-200/60 ${
                          isEven ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <TableCell className="text-center font-mono text-slate-500 font-semibold sticky left-0 bg-inherit z-10">
                          {row.s_no}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-900 sticky left-12 bg-inherit z-10">
                          {row.faculty_id}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 sticky left-40 bg-inherit z-10 whitespace-nowrap">
                          {row.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] text-slate-700">
                            {row.department}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 truncate max-w-[130px]" title={row.designation}>
                          {row.designation}
                        </TableCell>

                        {/* 12 Months Scores */}
                        {ACADEMIC_MONTHS.map((month) => {
                          const score = row.monthly_scores[month];
                          const status = row.monthly_statuses[month];
                          const hasScore = score !== null && score !== undefined;

                          return (
                            <TableCell
                              key={month}
                              className={`text-center font-mono px-2 text-[11px] ${
                                hasScore && score > 0
                                  ? 'font-bold text-slate-900'
                                  : 'text-slate-400 font-normal'
                              }`}
                            >
                              {hasScore ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                    status === 'submitted'
                                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                  title={`${month}: ${score} Marks (${status})`}
                                >
                                  {score}
                                </span>
                              ) : (
                                <span className="text-slate-300">&ndash;</span>
                              )}
                            </TableCell>
                          );
                        })}

                        {/* Annual Total */}
                        <TableCell className="text-center font-mono font-extrabold text-blue-900 bg-blue-50/40 text-xs">
                          {row.annual_total}
                        </TableCell>

                        {/* Performance Status */}
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              row.performance_status === 'Outstanding'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : row.performance_status === 'Commendable'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : row.performance_status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {row.performance_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Options Dialog */}
      <Dialog
        isOpen={isDownloadModalOpen}
        onClose={() => !isExporting && setIsDownloadModalOpen(false)}
        title="Download Final Report"
        description={`Select export format for Academic Year ${selectedYear} – ${selectedYear + 1}`}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {/* Option 1: Annual Consolidation Only */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                downloadOption === 'annual_only'
                  ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="download_option"
                value="annual_only"
                checked={downloadOption === 'annual_only'}
                onChange={() => setDownloadOption('annual_only')}
                className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-xs text-slate-900">Annual Consolidation Only</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Downloads single 1000-mark master sheet containing all 56 faculty members.
                </p>
                <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Faculty_Annual_Consolidation_{selectedYear}-{selectedYear + 1}.xlsx
                </span>
              </div>
            </label>

            {/* Option 2: Selected Month */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                downloadOption === 'selected_month'
                  ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="download_option"
                value="selected_month"
                checked={downloadOption === 'selected_month'}
                onChange={() => setDownloadOption('selected_month')}
                className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span className="font-bold text-xs text-slate-900">Selected Month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Downloads one specific monthly SAR tracker sheet with Head 1&ndash;8 scores for all 56 faculty.
                </p>

                {downloadOption === 'selected_month' && (
                  <div className="mt-2.5 pt-2.5 border-t border-blue-200/60">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Month:</label>
                    <Select
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="h-9 text-xs font-semibold bg-white"
                    >
                      {CALENDAR_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                    <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Faculty_SAR_Tracker_{targetMonth}_{selectedYear}-{selectedYear + 1}.xlsx
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Complete Report */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                downloadOption === 'complete_report'
                  ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="download_option"
                value="complete_report"
                checked={downloadOption === 'complete_report'}
                onChange={() => setDownloadOption('complete_report')}
                className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs text-slate-900">Complete Report (13 Sheets)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete workbook with all 12 monthly sheets (January &ndash; December) + Annual Consolidation as 13th sheet.
                </p>
                <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Faculty_SAR_Tracker_{selectedYear}-{selectedYear + 1}.xlsx
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => setIsDownloadModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isExporting}
              onClick={handleExecuteDownload}
              className="font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
