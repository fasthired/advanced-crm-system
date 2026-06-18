'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardNav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">CRM System</h2>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
        </Link>

        <div className="hidden md:block px-4 py-2 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-300">{user?.email}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-slate-300 hover:text-red-400"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
