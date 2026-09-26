'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import { DEPARTMENTS } from '@/lib/constants/heads';
import { FacultyRecord, SarAuditRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  HelpCircle,
  UserMinus,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

export default function FacultyManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'service_register' | 'sar_audit'>('service_register');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [sarAuditList, setSarAuditList] = useState<SarAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for Safe Deactivation
  const [selectedFacultyForRemoval, setSelectedFacultyForRemoval] = useState<FacultyRecord | null>(null);
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allFaculty, audit] = await Promise.all([
        DataService.getAllFaculty(),
        DataService.getSarAuditLogs(),
      ]);
      setFacultyList(allFaculty);
      setSarAuditList(audit);
    } catch (err) {
      console.error('Failed to load faculty master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRemovalModal = (faculty: FacultyRecord) => {
    setSelectedFacultyForRemoval(faculty);
    setIsRemovalModalOpen(true);
  };

  const handleConfirmRemoval = async () => {
    if (!selectedFacultyForRemoval) return;
    setIsProcessing(true);
    try {
      await DataService.deactivateFaculty(
        selectedFacultyForRemoval.faculty_id,
        user?.name || 'Administrator',
        2026,
        'October'
      );
      setIsRemovalModalOpen(false);
      setSelectedFacultyForRemoval(null);
      await loadData();
    } catch (err) {
      console.error('Failed to deactivate faculty:', err);
      alert('Failed to remove faculty. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateFaculty = async (facultyId: string) => {
    if (!confirm('Reactivate this faculty for monthly evaluations?')) return;
    setIsProcessing(true);
    try {
      await DataService.reactivateFaculty(facultyId);
      await loadData();
    } catch (err) {
      console.error('Failed to reactivate faculty:', err);
      alert('Failed to reactivate faculty. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeCount = facultyList.filter((f) => f.is_active !== false).length;
  const inactiveCount = facultyList.filter((f) => f.is_active === false).length;

  const filteredFaculty = facultyList.filter((f) => {
    if (statusFilter === 'active' && f.is_active === false) return false;
    if (statusFilter === 'inactive' && f.is_active !== false) return false;

    if (selectedDept !== 'all' && f.department.toUpperCase() !== selectedDept.toUpperCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = f.name.toLowerCase().includes(q);
      const matchId = f.faculty_id.toLowerCase().includes(q);
      const matchDesig = f.designation.toLowerCase().includes(q);
      const matchDept = f.department.toLowerCase().includes(q);
      return matchName || matchId || matchDesig || matchDept;
    }
    return true;
  });

  const ambiguousCount = sarAuditList.filter((s) => s.match_status === 'ambiguous').length;
  const unmatchedCount = sarAuditList.filter((s) => s.match_status === 'unmatched').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official NSRIET Faculty Master sourced from the Service Register ({activeCount} Active, {inactiveCount} Removed/Inactive)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('service_register')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'service_register'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty Register ({facultyList.length})
          </button>
          <button
            onClick={() => setActiveTab('sar_audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sar_audit'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>SAR Audit & Mapping</span>
            {ambiguousCount + unmatchedCount > 0 && (
              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
                {ambiguousCount + unmatchedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'service_register' ? (
        <>
          {/* Filters Bar */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    placeholder="Search by Faculty Name, EMP. ID (e.g. 23TS050009), or Designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>

                <div>
                  <Select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="h-10 text-xs"
                  >
                    <option value="all">All Departments ({facultyList.length})</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d} ({facultyList.filter((f) => f.department === d).length})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-10 text-xs font-medium"
                  >
                    <option value="all">All Statuses ({facultyList.length})</option>
                    <option value="active">Active Only ({activeCount})</option>
                    <option value="inactive">Inactive / Removed ({inactiveCount})</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Master Table */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3 px-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Service Register Master Faculty Records
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredFaculty.length} of {facultyList.length} total staff records
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white font-mono">
                  Source: SERVICE REGISTER
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Loading faculty records...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 text-slate-800">
                      <TableHead className="w-32 font-bold">Faculty ID</TableHead>
                      <TableHead className="min-w-[180px] font-bold">Name</TableHead>
                      <TableHead className="w-44 font-bold">Designation</TableHead>
                      <TableHead className="w-24 font-bold">Dept</TableHead>
                      <TableHead className="w-24 font-bold text-center">DOJ</TableHead>
                      <TableHead className="w-36 font-bold text-center">Status</TableHead>
                      <TableHead className="w-32 font-bold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaculty.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          No faculty records match your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFaculty.map((faculty) => {
                        const isInactive = faculty.is_active === false;
                        return (
                          <TableRow
                            key={faculty.faculty_id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isInactive ? 'bg-slate-50/60 opacity-80' : ''
                            }`}
                          >
                            <TableCell className="font-mono font-bold text-blue-700 text-xs">
                              {faculty.faculty_id}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900 text-xs">
                              {faculty.name}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {faculty.designation}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                {faculty.department}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-slate-600">
                              {faculty.doj || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {isInactive ? (
                                <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px] font-bold">
                                  Inactive / Removed
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px] font-bold">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isInactive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleReactivateFaculty(faculty.faculty_id)}
                                  className="text-xs h-7 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Restore</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleOpenRemovalModal(faculty)}
                                  className="text-xs h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300 cursor-pointer gap-1"
                                >
                                  <UserMinus className="w-3 h-3" />
                                  <span>Remove Faculty</span>
                                </Button>
                              )}
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
        </>
      ) : (
        /* SAR TRACKER AUDIT & MAPPING TAB */
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-900 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4 text-blue-700" />
              SAR Historical Tracker Audit & Normalization Report
            </p>
            <p className="text-slate-600">
              Audit log preserving all original names from the SAR Tracker and their mapping to official Faculty IDs in the Service Register. Ambiguous or unlisted historical records are strictly isolated for admin review and never assigned without verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/30 shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-800">
                    {sarAuditList.filter((s) => s.match_status === 'verified').length}
                  </div>
                  <div className="text-xs font-semibold text-emerald-900">Verified Matches</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30 shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-800">{ambiguousCount}</div>
                  <div className="text-xs font-semibold text-amber-900">Ambiguous (Needs Review)</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50 shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">{unmatchedCount}</div>
                  <div className="text-xs font-semibold text-slate-700">Unmatched / Historical Only</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 text-slate-800">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-48 font-bold">Original SAR Name</TableHead>
                    <TableHead className="w-24 font-bold">SAR Dept</TableHead>
                    <TableHead className="w-36 font-bold">Matched Faculty ID</TableHead>
                    <TableHead className="w-32 font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold">Audit Rationale / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sarAuditList.map((audit, idx) => (
                    <TableRow key={audit.id || idx} className="hover:bg-slate-50">
                      <TableCell className="text-xs text-slate-400 font-mono">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-900 text-xs">
                        {audit.sar_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {audit.sar_department}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-blue-700 text-xs">
                        {audit.matched_faculty_id || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            audit.match_status === 'verified'
                              ? 'success'
                              : audit.match_status === 'ambiguous'
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-[10px]"
                        >
                          {audit.match_status === 'verified'
                            ? 'Verified'
                            : audit.match_status === 'ambiguous'
                            ? 'Ambiguous'
                            : 'Needs Admin Confirmation'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {audit.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR FACULTY REMOVAL */}
      <Dialog
        isOpen={isRemovalModalOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsRemovalModalOpen(false);
            setSelectedFacultyForRemoval(null);
          }
        }}
        title="Remove this faculty from future evaluations?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-900">
                {selectedFacultyForRemoval?.name} ({selectedFacultyForRemoval?.faculty_id})
              </p>
              <p className="text-rose-700">
                Department: {selectedFacultyForRemoval?.department} • {selectedFacultyForRemoval?.designation}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Historical evaluation records will be preserved. This faculty will not appear in future monthly evaluations.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => {
                setIsRemovalModalOpen(false);
                setSelectedFacultyForRemoval(null);
              }}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmRemoval}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs"
            >
              {isProcessing ? 'Deactivating...' : 'Confirm Removal'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
