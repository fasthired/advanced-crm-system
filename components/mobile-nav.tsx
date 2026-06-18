'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Phone,
  CheckCircle2,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

const mobileItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Users, label: 'Customers', href: '/dashboard/customers' },
  { icon: Phone, label: 'Calls', href: '/dashboard/calls' },
  { icon: CheckCircle2, label: 'Follow-ups', href: '/dashboard/follow-ups' },
  { icon: ClipboardList, label: 'Tasks', href: '/dashboard/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex justify-around h-16 items-center">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`transition-colors p-2 rounded-lg ${
                isActive
                  ? 'text-blue-400'
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
