'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Phone,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react';

const mobileItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Users, label: 'Customers', href: '/dashboard/customers' },
  { icon: Phone, label: 'Calls', href: '/dashboard/calls' },
  { icon: CheckCircle2, label: 'Follow-ups', href: '/dashboard/follow-ups' },
  { icon: ClipboardList, label: 'Tasks', href: '/dashboard/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = user?.role === 'admin'
    ? [
        mobileItems[0],
        { icon: ShieldCheck, label: 'Admin', href: '/dashboard/admin' },
        ...mobileItems.slice(1),
      ]
    : mobileItems;

  return (
    <div className="flex h-18 items-center gap-1 overflow-x-auto px-2 py-2 touch-pan-x overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-20 flex-none snap-center flex-col items-center gap-1 rounded-lg px-2 py-1"
          >
            <div
              className={`transition-colors p-2 rounded-lg ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
