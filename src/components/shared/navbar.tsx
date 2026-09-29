'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { DataService } from '@/lib/services/data-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { DEPARTMENTS, DESIGNATIONS } from '@/lib/constants/heads';
import {
  GraduationCap,
  LogOut,
  User,
  Edit3,
  CheckCircle2,
  ChevronDown,
  Building2,
  Briefcase,
  Hash,
  Loader2,
} from 'lucide-react';

export function Navbar() {
  const { user, role, logout, updateCurrentUserProfile } = useAuth();
  const router = useRouter();

  // Popover state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  
  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Profile edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    designation: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        department: user.department || '',
        designation: user.designation || '',
      });
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const wasAdmin = role === 'admin';
    setIsProfileMenuOpen(false);
    await logout();
    if (wasAdmin) {
      router.push('/admin-login');
    } else {
      router.push('/login');
    }
  };

  const handleOpenEditProfile = () => {
    if (user) {
      setEditForm({
        name: user.name || '',
        department: user.department || '',
        designation: user.designation || '',
      });
    }
    setIsProfileMenuOpen(false);
    setIsEditModalOpen(true);
    setProfileSuccessMsg(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const updatedProfile = await DataService.updateFacultyProfile(user.faculty_id, {
        name: editForm.name.trim(),
        department: editForm.department,
        designation: editForm.designation,
      });
      updateCurrentUserProfile(updatedProfile);
      setProfileSuccessMsg(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setProfileSuccessMsg(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { changePasswordAction } = await import('@/app/actions/auth');
      const result = await changePasswordAction(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">NSRIET</span>
                <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold border border-blue-200 truncate">
                  Evaluation Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block truncate">Faculty Performance Management System</p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center space-x-3" ref={menuRef}>
              {/* Profile Avatar Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {user.name}
                      <Badge
                        variant={role === 'admin' ? 'default' : 'secondary'}
                        className="text-[10px] py-0 px-1.5 font-mono"
                      >
                        {user.faculty_id}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize truncate max-w-[140px]">
                      {user.department} &bull; {user.role}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Popover Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] font-mono text-blue-700">{user.faculty_id}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.designation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2 text-[11px] text-slate-500 space-y-1 border-b border-slate-100">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-semibold text-slate-700">{user.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role:</span>
                        <span className="font-semibold text-slate-700 capitalize">{user.role}</span>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Edit3 className="w-4 h-4 text-blue-600" />
                        Edit Profile Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsPasswordModalOpen(true);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordError(null);
                          setPasswordSuccess(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Change Password
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex text-slate-600 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Faculty Login
                </Button>
              </Link>
              <Link href="/admin-login">
                <Button variant="primary" size="sm">
                  Admin Portal
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Edit Profile Modal */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Faculty Profile Management"
        description="Update your personal details. Faculty ID is immutable."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Faculty ID <span className="text-slate-400 font-normal">(Read-only / Immutable)</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={user?.faculty_id || ''}
                disabled
                className="pl-9 h-10 text-xs bg-slate-100 font-mono text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className="pl-9 h-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Select
                value={editForm.department}
                onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                className="pl-9 h-10 text-xs"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Designation</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Select
                value={editForm.designation}
                onChange={(e) => setEditForm((prev) => ({ ...prev, designation: e.target.value }))}
                className="pl-9 h-10 text-xs"
              >
                {DESIGNATIONS.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingProfile}
              className="font-bold cursor-pointer"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        description="Securely update your authentication password."
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password successfully updated!</span>
            </div>
          )}
          
          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold">
              {passwordError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Current Password</label>
            <Input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
              className="h-10 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password (min 6 chars)"
              className="h-10 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isChangingPassword}
              className="font-bold cursor-pointer"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Updating...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
