'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import { CURRENT_DEFAULT_YEAR, CURRENT_DEFAULT_MONTH, MONTHS } from '@/lib/constants/heads';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  HardDrive,
  RefreshCw,
  X
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_DEFAULT_MONTH);

  const [metrics, setMetrics] = useState<{
    totalFaculty: number;
    submittedCount: number;
    pendingCount: number;
    pendingFaculty: Array<{
      faculty_id: string;
      name: string;
      department: string;
      status: string;
    }>;
    submittedFaculty?: Array<{
      sNo: number;
      faculty_id: string;
      name: string;
      department: string;
      submitted_at: string | null;
    }>;
    departmentStats: Record<
      string,
      { total: number; submitted: number; pending: number; avgTotal: number; sumMarks: number }
    >;
  } | null>(null);

  const [driveStatus, setDriveStatus] = useState<{
    connected: boolean;
    authMethod: string;
    hasOAuthClientId: boolean;
    hasRefreshToken: boolean;
    tokenSource: string;
  } | null>(null);

  const [isPendingModalOpen, setIsPendingModalOpen] = useState<boolean>(false);
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authBanner, setAuthBanner] = useState<string | null>(null);

  useEffect(() => {
    const driveAuthParam = searchParams.get('drive_auth');
    const reason = searchParams.get('reason');
    if (driveAuthParam === 'success') {
      setAuthBanner('Google Drive OAuth 2.0 authorization completed successfully! Refresh token persisted.');
    } else if (driveAuthParam === 'error') {
      setAuthBanner(`Google Drive OAuth error: ${reason || 'Failed to authorize'}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const driveAuthParam = searchParams.get('drive_auth');
        const fetchUrl = driveAuthParam === 'success' 
          ? '/api/auth/google/status?refresh=true' 
          : '/api/auth/google/status';

        const [data, driveRes] = await Promise.all([
          DataService.getDashboardMetrics(selectedYear, selectedMonth),
          fetch(fetchUrl)
            .then((r) => r.json())
            .catch(() => null),
        ]);
        setMetrics(data);
        if (driveRes && !driveRes.error) {
          setDriveStatus(driveRes);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth, searchParams]);

  const handleConnectDrive = () => {
    if (typeof document !== 'undefined') {
      const adminSessionData = {
        id: user?.id || 'NSRE01',
        faculty_id: user?.faculty_id || 'NSRE01',
        role: 'admin',
        timestamp: Date.now(),
      };
      document.cookie = `nsriet_admin_session=${encodeURIComponent(
        JSON.stringify(adminSessionData)
      )}; path=/; max-age=604800; SameSite=Lax`;

      try {
        const token = btoa(JSON.stringify(adminSessionData));
        window.location.href = `/api/auth/google?admin_token=${encodeURIComponent(token)}`;
        return;
      } catch {
        // Fallback
      }
    }
    window.location.href = '/api/auth/google';
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Google OAuth Banner */}
      {authBanner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium border ${
            authBanner.includes('success')
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {authBanner.includes('success') ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{authBanner}</span>
          </div>
          <button
            onClick={() => setAuthBanner(null)}
            className="p-1 hover:bg-black/5 rounded text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Period Slicer & Drive OAuth Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Admin Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Overall institution evaluation summary and department-level submission tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Drive Integration Status / Button */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-700">Drive: </span>
              {driveStatus?.connected ? (
                <span className="text-emerald-700 font-bold">Connected ({driveStatus.authMethod})</span>
              ) : (
                <span className="text-amber-700 font-semibold">Not Connected</span>
              )}
            </div>
            <Button
              onClick={handleConnectDrive}
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold py-0 px-2.5 ml-1 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {driveStatus?.connected ? 'Re-authorize' : 'Connect Drive'}
            </Button>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-1 shrink-0" />
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-8 text-xs font-semibold py-0 px-2 w-24"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>

            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 text-xs font-semibold py-0 px-2 w-32"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {isLoading || !metrics ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Calculating summary statistics...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
            {/* Card 1: Total Faculty */}
            <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-none">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Faculty
                </CardTitle>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">{metrics.totalFaculty}</div>
                <p className="text-xs text-slate-500 mt-1">Registered academic members across all departments</p>
              </CardContent>
            </Card>

            {/* Card 2: Submitted (CLICKABLE - Opens Submitted Modal) */}
            <Card
              onClick={() => setIsSubmittedModalOpen(true)}
              className="border-emerald-200 bg-emerald-50/20 shadow-xs hover:bg-emerald-50/50 hover:border-emerald-400 cursor-pointer transition-all group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-none">
                <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Submitted</span>
                  <Badge variant="success" className="text-[10px] py-0 px-1.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    Click to View
                  </Badge>
                </CardTitle>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-700">{metrics.submittedCount}</div>
                <p className="text-xs text-emerald-800/80 mt-1 font-medium flex items-center gap-1">
                  <span>
                    {metrics.totalFaculty > 0
                      ? `${Math.round((metrics.submittedCount / metrics.totalFaculty) * 100)}% submission rate`
                      : 'No faculty'}
                  </span>
                  <span>— View {metrics.submittedCount} submitted →</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Pending (CLICKABLE - Opens Pending Modal) */}
            <Card
              onClick={() => setIsPendingModalOpen(true)}
              className="border-amber-200 bg-amber-50/20 shadow-xs hover:bg-amber-50/50 hover:border-amber-400 cursor-pointer transition-all group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-none">
                <CardTitle className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pending</span>
                  <Badge variant="warning" className="text-[10px] py-0 px-1.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    Click to View
                  </Badge>
                </CardTitle>
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-amber-700">{metrics.pendingCount}</div>
                <p className="text-xs text-amber-800/80 mt-1 font-medium flex items-center gap-1">
                  <span>Click here to view all {metrics.pendingCount} pending faculty</span>
                  <span>→</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Department-Wise Summary Card / Table */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <div>
                  <CardTitle className="text-lg">Department-Wise Summary</CardTitle>
                  <CardDescription>
                    Breakdown of faculty submissions and completion status across departments for{' '}
                    {selectedMonth} {selectedYear}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Total Faculty</TableHead>
                    <TableHead className="text-center">Submitted</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-right">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metrics.departmentStats).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                        No department evaluation data recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(metrics.departmentStats).map(([dept, stat]) => {
                      const rate = stat.total > 0 ? Math.round((stat.submitted / stat.total) * 100) : 0;
                      return (
                        <TableRow key={dept}>
                          <TableCell className="font-bold text-slate-900">{dept}</TableCell>
                          <TableCell className="text-center font-semibold">{stat.total}</TableCell>
                          <TableCell className="text-center text-emerald-700 font-semibold">
                            {stat.submitted}
                          </TableCell>
                          <TableCell className="text-center text-amber-700 font-semibold">
                            {stat.pending}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                                rate === 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rate > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {rate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* POPUP/MODAL FOR SUBMITTED FACULTY */}
      <Dialog
        isOpen={isSubmittedModalOpen}
        onClose={() => setIsSubmittedModalOpen(false)}
        title={`Submitted Faculty — ${selectedMonth} ${selectedYear}`}
        description="Faculty members who have successfully submitted their monthly evaluation"
        className="max-w-3xl"
      >
        {!metrics?.submittedFaculty || metrics.submittedFaculty.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-sm">
              No faculty have submitted the {selectedMonth} {selectedYear} evaluation yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="text-emerald-800 font-medium">
                Total <strong>{metrics.submittedFaculty.length}</strong> faculty submitted for{' '}
                {selectedMonth} {selectedYear}.
              </span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">S.No</TableHead>
                    <TableHead className="w-28">Faculty ID</TableHead>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead className="w-24">Department</TableHead>
                    <TableHead className="w-36">Submitted At</TableHead>
                    <TableHead className="w-20 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.submittedFaculty.map((item, idx) => (
                    <TableRow key={item.faculty_id} className="hover:bg-slate-50">
                      <TableCell className="text-center font-mono text-xs text-slate-400">
                        {item.sNo || idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-blue-700 text-xs">
                        {item.faculty_id}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDateTime(item.submitted_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/month-records?facultyId=${encodeURIComponent(
                            item.faculty_id
                          )}&month=${encodeURIComponent(selectedMonth)}&year=${selectedYear}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Dialog>

      {/* POPUP/MODAL FOR PENDING FACULTY */}
      <Dialog
        isOpen={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        title={`Pending Faculty List (${selectedMonth} ${selectedYear})`}
        description="Faculty members who have not yet submitted their monthly evaluation"
        className="max-w-3xl"
      >
        {metrics?.pendingFaculty.length === 0 ? (
          <div className="py-8 text-center text-emerald-700">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
            <p className="font-bold text-sm">All faculty have submitted their evaluations for this month!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs flex items-center gap-1.5 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Total <strong>{metrics?.pendingFaculty.length}</strong> faculty pending submission.
              </span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.pendingFaculty.map((p) => (
                    <TableRow key={p.faculty_id}>
                      <TableCell className="font-mono font-bold text-blue-700">{p.faculty_id}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
                      <TableCell>{p.department}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.status === 'draft' ? 'warning' : 'secondary'} className="text-[11px]">
                          {p.status === 'draft' ? 'Draft in progress' : 'Not started'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
