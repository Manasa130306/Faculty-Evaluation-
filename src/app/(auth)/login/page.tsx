'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function FacultyLoginPage() {
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginFaculty } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!facultyId.trim()) {
      setError('Please enter your Faculty ID.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginFaculty(facultyId, password);
      if (res.success) {
        router.push('/faculty');
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4">
      {/* Background Campus Image with Clear Balanced Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/campus_background.png"
          alt="NSRIET Campus"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/45" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* College Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-700 text-white items-center justify-center shadow-lg mb-2">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NSRIET Faculty Portal</h1>
          <p className="text-xs text-slate-200 font-medium mt-0.5">Monthly Evaluation & Appraisal Management System</p>
        </div>

        <Card className="shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-slate-900">Faculty Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your permanent Faculty ID (from Service Register) and password to access your monthly self-appraisal.
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Permanent Faculty ID (EMP. ID)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="Enter Faculty ID"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="pl-9 font-mono uppercase"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 cursor-pointer font-bold" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Log In to Evaluation Portal'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-0 border-t border-slate-100">
            <div className="text-xs text-center text-slate-600 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-700 font-semibold hover:underline">
                Register Faculty ID
              </Link>
            </div>
            <div className="text-xs text-center text-slate-400">
              <Link href="/admin-login" className="hover:text-slate-700 transition-colors">
                Switch to Admin Portal →
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
