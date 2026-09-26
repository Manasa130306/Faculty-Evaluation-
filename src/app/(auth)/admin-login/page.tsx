'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState('NSRE01');
  const [password, setPassword] = useState('NSRE@ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginAdmin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminId.trim() || !password) {
      setError('Please provide administrator ID and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAdmin(adminId, password);
      if (res.success) {
        console.log('[ADMIN AUTH] Redirecting to /admin/dashboard');
        router.push('/admin/dashboard');
      } else {
        console.warn('[ADMIN AUTH ERROR]', res.error);
        setError(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      console.error('[ADMIN AUTH ERROR]', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 text-white items-center justify-center shadow-lg mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NSRIET Administration</h1>
          <p className="text-xs text-slate-400 font-medium">Restricted Executive & Leadership Portal</p>
        </div>

        <Card className="shadow-2xl border-slate-800 bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Executive Sign In</CardTitle>
            <CardDescription>
              Authorized access for College Principal, Deans, and Evaluation Administrators.
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
                <label className="text-xs font-semibold text-slate-700">Administrator ID</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="NSRE01"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="pl-9 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Admin Password</label>
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
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Main Administrator Credentials:</span>
                <br />
                ID: <code className="font-mono text-blue-700 font-bold">NSRE01</code> • Password:{' '}
                <code className="font-mono text-blue-700 font-bold">NSRE@ADMIN</code>
              </div>

              <Button type="submit" variant="secondary" className="w-full mt-2 cursor-pointer font-bold" disabled={isSubmitting}>
                {isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-0 border-t border-slate-100">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-800 transition-colors mt-4">
              ← Return to Faculty Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
