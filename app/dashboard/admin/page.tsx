'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, type AdminUserAction } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Ban, CheckCircle2, ShieldCheck, UserMinus, Users } from 'lucide-react';

const statusClasses: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  disabled: 'bg-yellow-500/10 text-yellow-400',
  banned: 'bg-red-500/10 text-red-400',
  removed: 'bg-slate-500/10 text-slate-400',
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [workers, setWorkers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [router, user]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers();
      setWorkers(data.users || []);
      setActivities(data.activities_today || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user?.role]);

  const workerRows = useMemo(() => workers.filter((worker) => worker.role !== 'admin'), [workers]);
  const totals = useMemo(
    () => ({
      workers: workerRows.length,
      active: workerRows.filter((worker) => worker.account_status === 'active').length,
      recordsToday: workerRows.reduce((sum, worker) => sum + (worker.stats?.records_today || 0), 0),
      activitiesToday: workerRows.reduce((sum, worker) => sum + (worker.stats?.activities_today || 0), 0),
    }),
    [workerRows]
  );

  const handleUserAction = async (userId: string, action: AdminUserAction) => {
    setBusyUserId(userId);
    setError('');
    try {
      await adminApi.updateUser(userId, action, reason);
      setReason('');
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Unable to update worker');
    } finally {
      setBusyUserId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" />
            Admin Oversight
          </h1>
          <p className="text-slate-400 mt-1">Monitor worker progress, records, and account access</p>
        </div>
        <Button onClick={loadUsers} disabled={loading} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Workers</p>
            <p className="text-3xl font-bold text-white mt-2">{totals.workers}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Active Workers</p>
            <p className="text-3xl font-bold text-white mt-2">{totals.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Records Today</p>
            <p className="text-3xl font-bold text-white mt-2">{totals.recordsToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <p className="text-sm text-slate-400">Activities Today</p>
            <p className="text-3xl font-bold text-white mt-2">{totals.activitiesToday}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason for disable, ban, remove, or activation"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading workers...</div>
          ) : workerRows.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No worker accounts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Worker</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Today</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Total Records</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Seen</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workerRows.map((worker) => (
                    <tr key={worker.id} className="border-b border-slate-700/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{worker.full_name || 'Unnamed worker'}</p>
                        <p className="text-sm text-slate-400">{worker.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusClasses[worker.account_status] || statusClasses.active} border-0 capitalize`}>
                          {worker.account_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{worker.stats.records_today} records</div>
                        <div className="text-xs text-slate-500">{worker.stats.activities_today} activities</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{worker.stats.total_records}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {worker.last_seen_at ? new Date(worker.last_seen_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyUserId === worker.id || worker.account_status === 'active'}
                            onClick={() => handleUserAction(worker.id, 'activate')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyUserId === worker.id || worker.account_status === 'disabled'}
                            onClick={() => handleUserAction(worker.id, 'disable')}
                          >
                            <UserMinus className="w-4 h-4" />
                            Disable
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyUserId === worker.id || worker.account_status === 'banned'}
                            onClick={() => handleUserAction(worker.id, 'ban')}
                          >
                            <Ban className="w-4 h-4" />
                            Ban
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyUserId === worker.id || worker.account_status === 'removed'}
                            onClick={() => handleUserAction(worker.id, 'remove')}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Today&apos;s Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No activity recorded today.</p>
            ) : (
              activities.map((activity, index) => (
                <div key={`${activity.user_id}-${activity.created_at}-${index}`} className="p-3 rounded-lg bg-slate-900/50">
                  <p className="text-sm text-white">{activity.description || activity.activity_type}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.entity_type} at {new Date(activity.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
