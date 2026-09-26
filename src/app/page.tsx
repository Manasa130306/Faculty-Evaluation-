'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, ShieldCheck, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">NSRIET</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Performance Appraisal System
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Faculty Login
              </Button>
            </Link>
            <Link href="/admin-login">
              <Button variant="primary" size="sm">
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Body */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-6">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          Official 1000-Mark Annual Performance Appraisal System (July–June)
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl leading-tight">
          N S Raju Institute of Engineering & Technology
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl">
          Faculty Performance Appraisal System covering all 8 Performance Heads across 12 monthly evaluation cycles
        </p>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-3xl text-left">
          {/* Faculty Card */}
          <Card className="hover:shadow-lg transition-all border-slate-300 hover:border-blue-400 group">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <UserCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Faculty Self-Appraisal Portal</CardTitle>
              <CardDescription>
                Submit monthly self-evaluations for Heads 2–8, upload evidence documents, preview total scores, and view Head 1 IQAC marks.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700">Service Register Credentials:</span>
                <br />
                Faculty ID: <code className="text-blue-700 font-mono">23TS050009</code> (e.g. Mr Adibabu Riparagiri)
                <br />
                Password: <code className="text-blue-700 font-mono">23TS050009@NSRIET</code> or <code className="text-blue-700 font-mono">password123</code>
              </div>
              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button className="w-full font-bold">
                    Faculty Login <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Register</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-lg transition-all border-slate-300 hover:border-blue-400 group">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">IQAC Administration Portal</CardTitle>
              <CardDescription>
                Executive dashboard, 72 faculty Service Register management, Head 1 entry, SheetJS Excel export, and Month Locking.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700">Admin Credentials:</span>
                <br />
                Admin ID: <code className="text-blue-700 font-mono">ADMIN01</code> / Password:{' '}
                <code className="text-blue-700 font-mono">admin123</code>
              </div>
              <Link href="/admin-login">
                <Button variant="secondary" className="w-full font-bold">
                  Admin Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} N S Raju Institute of Engineering & Technology (NSRIET). All rights reserved.
      </footer>
    </div>
  );
}
