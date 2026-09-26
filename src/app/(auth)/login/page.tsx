'use client';

import React, { useState } from 'react';
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Top College Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-700 text-white items-center justify-center shadow-md mb-2">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">NSRIET Faculty Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Monthly Evaluation & Appraisal Management (1000-Mark Framework)</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Faculty Sign In</CardTitle>
            <CardDescription>
              Enter your permanent Faculty EMP. ID (from Service Register) and password to access your monthly self-appraisal.
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
                    placeholder="e.g. 23TS050009 or 25TS040053"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="pl-9 font-mono uppercase"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">Unique permanent Faculty ID issued in the Service Register</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 bg-blue-50/70 p-2 rounded-md border border-blue-100">
                  <strong className="text-blue-900">Default Password Format:</strong>{' '}
                  <code className="text-blue-700 font-mono">FacultyID@NSRIET</code> (e.g.{' '}
                  <code className="text-blue-700 font-mono">23TS050009@NSRIET</code> or <code className="text-blue-700 font-mono">password123</code>)
                </p>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
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
