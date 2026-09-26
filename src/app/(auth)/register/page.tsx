'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { DEPARTMENTS, DESIGNATIONS } from '@/lib/constants/heads';
import { GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';

export default function FacultyRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    designation: DESIGNATIONS[0],
    department: DEPARTMENTS[0],
    faculty_id: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerFaculty } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAutoFillDefaultPassword = () => {
    if (formData.faculty_id.trim()) {
      const defPass = `${formData.faculty_id.trim().toUpperCase()}@NSRIET`;
      setFormData((prev) => ({
        ...prev,
        password: defPass,
        confirmPassword: defPass,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please provide your full faculty name.');
      return;
    }

    if (!formData.faculty_id.trim()) {
      setError('Please provide a unique Faculty ID.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerFaculty({
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        faculty_id: formData.faculty_id,
        password: formData.password,
      });

      if (res.success) {
        router.push('/faculty');
      } else {
        setError(res.error || 'Registration failed. Faculty ID may already exist.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 py-8">
      {/* Background Campus Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/campus_background.jpg"
          alt="NSRIET Campus"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-700 text-white items-center justify-center shadow-lg mb-2">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NSRIET Faculty Registration</h1>
          <p className="text-xs text-slate-200 font-medium">Create your permanent evaluation profile</p>
        </div>

        <Card className="shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-slate-900">Register New Faculty</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your official academic details. Your Faculty ID is permanent and unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name (with title)</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g. Dr. K. Srinivas"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Department & Designation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <Select name="department" value={formData.department} onChange={handleChange}>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Designation</label>
                  <Select name="designation" value={formData.designation} onChange={handleChange}>
                    {DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>
                        {desig}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Faculty ID */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Faculty ID (Unique)</label>
                  {formData.faculty_id.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoFillDefaultPassword}
                      className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer"
                    >
                      Use default password ({formData.faculty_id.trim().toUpperCase()}@NSRIET)
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  name="faculty_id"
                  placeholder="e.g. F102"
                  value={formData.faculty_id}
                  onChange={handleChange}
                  className="font-mono uppercase"
                  required
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-3" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Complete Registration & Sign In'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-0 border-t border-slate-100">
            <p className="text-xs text-slate-600 mt-4">
              Already registered?{' '}
              <Link href="/login" className="text-blue-700 font-semibold hover:underline">
                Sign In to Faculty Portal
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
