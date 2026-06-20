'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { callApi, customerApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Phone, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { stringify } from 'csv-stringify/sync';

export default function CallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [callsData, customersData] = await Promise.all([
        callApi.getAll(user.id),
        customerApi.getAll(user.id),
      ]);
      setCalls(callsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = calls;
    if (filterType !== 'all') {
      filtered = filtered.filter((c) => c.call_type === filterType);
    }
    setFilteredCalls(filtered);
  }, [calls, filterType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this call?')) return;
    try {
      await callApi.delete(id);
      setCalls(calls.filter((c) => c.id !== id));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'call_deleted',
        entity_type: 'call',
        entity_id: id,
        description: 'Call log deleted',
      });
    } catch (error) {
      console.error('Error deleting call:', error);
    }
  };

  const exportToCSV = () => {
    const columns = ['Customer', 'Type', 'Duration (min)', 'Outcome', 'Date'];
    const rows = filteredCalls.map((c) => [
      customers.find((cu) => cu.id === c.customer_id)?.name || 'Unknown',
      c.call_type,
      c.duration_minutes,
      c.outcome,
      new Date(c.created_at).toLocaleString(),
    ]);
    const csv = stringify([columns, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calls-${new Date().getTime()}.csv`;
    a.click();
  };

  const callTypeColors: Record<string, string> = {
    inbound: 'bg-blue-500/10 text-blue-400',
    outbound: 'bg-green-500/10 text-green-400',
    missed: 'bg-red-500/10 text-red-400',
  };

  const outcomeColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    completed: 'bg-green-500/10 text-green-400',
    no_answer: 'bg-red-500/10 text-red-400',
    voicemail: 'bg-slate-500/10 text-slate-400',
    rescheduled: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Phone className="w-8 h-8" />
            Call Logs
          </h1>
          <p className="text-slate-400 mt-1">Track all customer interactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/dashboard/calls/new">
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4" />
              Log Call
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
            <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
            <SelectTrigger className="w-full md:w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading calls...</div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No calls logged yet</p>
              <Link href="/dashboard/calls/new">
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4" />
                  Log Your First Call
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Duration</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Outcome</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-white">{customers.find((c) => c.id === call.customer_id)?.name || 'Unknown'}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${callTypeColors[call.call_type]} border-0 capitalize`}>{call.call_type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{call.duration_minutes} min</td>
                      <td className="py-3 px-4">
                        <Badge className={`${outcomeColors[call.outcome]} border-0 capitalize`}>{call.outcome.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">{new Date(call.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(call.id)} className="text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
