'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Lock,
  FileSpreadsheet,
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
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
  );
}
