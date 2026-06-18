'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { followUpApi, customerApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Download, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { stringify } from 'csv-stringify/sync';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [fups, customersData] = await Promise.all([
        followUpApi.getAll(user.id),
        customerApi.getAll(user.id),
      ]);
      setFollowUps(fups || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const completed = await followUpApi.complete(id, '');
      setFollowUps(followUps.map((f) => (f.id === id ? completed : f)));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'follow_up_completed',
        entity_type: 'follow_up',
        entity_id: id,
        description: 'Follow-up marked as completed',
      });
    } catch (error) {
      console.error('Error completing follow-up:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this follow-up?')) return;
    try {
      await followUpApi.delete(id);
      setFollowUps(followUps.filter((f) => f.id !== id));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'follow_up_deleted',
        entity_type: 'follow_up',
        entity_id: id,
        description: 'Follow-up deleted',
      });
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  const exportToCSV = () => {
    const columns = ['Customer', 'Type', 'Priority', 'Scheduled Date', 'Status'];
    const rows = followUps.map((f) => [
      customers.find((c) => c.id === f.customer_id)?.name || 'Unknown',
      f.follow_up_type,
      f.priority,
      new Date(f.scheduled_date).toLocaleString(),
      f.completed ? 'Completed' : 'Pending',
    ]);
    const csv = stringify([columns, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `follow-ups-${new Date().getTime()}.csv`;
    a.click();
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-orange-500/10 text-orange-400',
    urgent: 'bg-red-500/10 text-red-400',
  };

  const upcoming = followUps.filter((f) => !f.completed);
  const completed = followUps.filter((f) => f.completed);

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Follow-ups</h1>
          <p className="text-slate-400 mt-1">Manage customer follow-ups and reminders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/dashboard/follow-ups/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Follow-up
            </Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Follow-ups ({upcoming.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading follow-ups...</div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No upcoming follow-ups</p>
              <Link href="/dashboard/follow-ups/new">
                <Button className="gap-2 bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Follow-up
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((followUp) => (
                <div key={followUp.id} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <Checkbox
                    checked={false}
                    onClick={() => handleComplete(followUp.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">
                          {customers.find((c) => c.id === followUp.customer_id)?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">{followUp.description}</p>
                      </div>
                      <Badge className={`${priorityColors[followUp.priority]} border-0 capitalize flex-shrink-0`}>
                        {followUp.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(followUp.scheduled_date).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(followUp.id)}
                    className="text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Follow-ups */}
      {completed.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Completed ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completed.slice(0, 10).map((followUp) => (
                <div key={followUp.id} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 opacity-75">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-400 line-through">
                      {customers.find((c) => c.id === followUp.customer_id)?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{followUp.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(followUp.id)}
                    className="text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
