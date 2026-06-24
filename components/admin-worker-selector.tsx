'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAdminWorker } from '@/lib/admin-worker-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, User } from 'lucide-react';

export default function AdminWorkerSelector() {
  const { user } = useAuth();
  const { selectedWorkerId, setSelectedWorkerId, workers } = useAdminWorker();

  if (user?.role !== 'admin') {
    return null;
  }

  // Filter out any other admins from selector list if needed, or keep them.
  const activeWorkers = workers.filter((w) => w.role !== 'admin');

  return (
    <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-1.5 backdrop-blur-md">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-blue-500" />
        Oversight:
      </span>
      <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
        <SelectTrigger className="h-8 w-[180px] bg-slate-900/60 border-slate-700 text-xs text-white hover:bg-slate-900/90 transition-colors">
          <SelectValue placeholder="Select worker scope" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
          <SelectItem value="all">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              All Workers
            </span>
          </SelectItem>
          <SelectItem value={user.id}>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-green-400" />
              My Records (Admin)
            </span>
          </SelectItem>
          {activeWorkers.map((worker) => (
            <SelectItem key={worker.id} value={worker.id}>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {worker.full_name || worker.email}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
