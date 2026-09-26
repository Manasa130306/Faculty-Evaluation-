'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Lock,
  FileSpreadsheet,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 5 Admin Navigation Items
const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Faculty Management',
    href: '/admin/faculty',
    icon: Users,
  },
  {
    name: 'Month Records',
    href: '/admin/month-records',
    icon: CalendarDays,
  },
  {
    name: 'Lock Month',
    href: '/admin/lock-month',
    icon: Lock,
  },
  {
    name: 'Annual Consolidation',
    href: '/admin/annual-consolidation',
    icon: FileSpreadsheet,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  ) || NAV_ITEMS[0];

  return (
    <>
      {/* Mobile Top Sub-Navbar & Drawer Toggle */}
      <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 flex items-center justify-between sticky top-16 z-30 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin &gt;</span>
          <span className="text-xs font-bold text-white truncate">{activeItem.name}</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          aria-label="Toggle admin navigation"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 sticky top-[7rem] z-30 shadow-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Persistent Sidebar (Unchanged) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Admin Navigation
          </span>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          NSRIET Executive Panel
        </div>
      </aside>
    </>
  );
}
