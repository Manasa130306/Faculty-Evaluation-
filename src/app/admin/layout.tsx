'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/shared/navbar';
import { AdminSidebar } from '@/components/admin/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === '/admin/login' || pathname === '/admin-login';

  useEffect(() => {
    if (isLoginRoute) return;

    if (!isLoading) {
      if (!user) {
        router.push('/admin-login');
      } else if (role !== 'admin') {
        router.push('/faculty');
      }
    }
  }, [user, role, isLoading, router, isLoginRoute]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (isLoading || !user || role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
