'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/services/data-service';
import { CURRENT_DEFAULT_YEAR, CURRENT_DEFAULT_MONTH, MONTHS } from '@/lib/constants/heads';
import { MonthLock } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { updateMonthlyExcelAction } from '@/app/actions/drive';

export default function LockMonthPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_DEFAULT_MONTH);

  const [locks, setLocks] = useState<MonthLock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLocks = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getMonthLocks();
      setLocks(data);
    } catch (err) {
      console.error('Failed to load month locks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocks();
  }, []);

  const handleToggleLock = async (year: number, month: string, targetLockState: boolean) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      await DataService.toggleMonthLock(year, month, targetLockState);
      
      let driveMsg = '';
      if (targetLockState) {
        // Automatically generate Excel report when month is locked
        try {
          const allFaculty = await DataService.getAllFaculty();
          const evals = await DataService.getAllEvaluationsMap(year);
          const result = await updateMonthlyExcelAction(allFaculty, year, month, evals);
          if (result.success) {
            driveMsg = '\n✓ Excel archived to Google Drive.';
          } else {
            driveMsg = '\n✕ Google Drive upload failed.';
          }
        } catch (e) {
          console.error(e);
          driveMsg = '\n✕ Google Drive upload failed.';
        }
      }

      setActionMessage({
        type: 'success',
        text: `Successfully ${targetLockState ? 'locked' : 'unlocked'} evaluation records for ${month} ${year}.${driveMsg}`,
      });
      await loadLocks();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update lock status.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Find status of currently selected month in top control
  const currentSelectedLock = locks.find(
    (l) => l.year === selectedYear && l.month.toLowerCase() === selectedMonth.toLowerCase()
  );
  const isCurrentSelectedLocked = currentSelectedLock?.is_locked ?? false;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lock Month Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Freeze completed monthly evaluation cycles to protect submitted marks from modification while keeping them permanently accessible
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Quick Lock Action Card */}
      <Card className="border-slate-200 shadow-xs bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
        <CardHeader className="border-slate-700/60 pb-3">
          <div className="flex items-center gap-2 text-blue-300">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-base text-white font-bold">Month Lock Action Controller</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-300">
            Select a target month and lock evaluation submissions for that period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 text-xs bg-slate-800 text-white border-slate-700 w-32"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-slate-900">
                    {y}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 text-xs bg-slate-800 text-white border-slate-700 w-40"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900">
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-300 block">Current Status:</span>
                <span
                  className={`text-xs font-bold ${
                    isCurrentSelectedLocked ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isCurrentSelectedLocked ? '● Currently Locked' : '○ Active / Unlocked'}
                </span>
              </div>

              {isCurrentSelectedLocked ? (
                <Button
                  variant="outline"
                  onClick={() => handleToggleLock(selectedYear, selectedMonth, false)}
                  disabled={isUpdating}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white border-slate-600 font-bold cursor-pointer"
                >
                  <Unlock className="w-4 h-4 mr-1.5" /> Unlock Month
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => handleToggleLock(selectedYear, selectedMonth, true)}
                  disabled={isUpdating}
                  className="w-full sm:w-auto font-bold cursor-pointer"
                >
                  <Lock className="w-4 h-4 mr-1.5" /> Lock Month
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-wise Lock Status Table for Current Year */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="bg-slate-50/70 pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Monthly Evaluation Cycles & Lock Status ({selectedYear})
          </CardTitle>
          <CardDescription className="text-xs">
            Review and manage lock status for all 12 academic months of {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-slate-100/80">
                <TableHead>Month</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-center">Lock Status</TableHead>
                <TableHead>Faculty Modification Access</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs">Loading monthly cycle statuses...</span>
                  </TableCell>
                </TableRow>
              ) : (
                MONTHS.map((month) => {
                  const lock = locks.find(
                    (l) => l.year === selectedYear && l.month.toLowerCase() === month.toLowerCase()
                  );
                  const isLocked = lock?.is_locked ?? false;

                return (
                  <TableRow key={month} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-slate-900 text-xs">{month}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{selectedYear}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isLocked ? 'danger' : 'success'} className="text-[10px] gap-1">
                        {isLocked ? (
                          <>
                            <Lock className="w-3 h-3" /> Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" /> Unlocked / Open
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {isLocked ? (
                        <span className="text-rose-700 font-medium">Read-Only (No edits allowed)</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Editable by Faculty</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isLocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(selectedYear, month, false)}
                          disabled={isUpdating}
                          className="text-xs text-slate-700 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5 mr-1" /> Unlock
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(selectedYear, month, true)}
                          disabled={isUpdating}
                          className="text-xs text-slate-700 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1" /> Lock Month
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
