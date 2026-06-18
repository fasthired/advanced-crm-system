'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { customerApi, callApi, followUpApi, taskApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    customersByStatus: [] as any[],
    callsLastWeek: [] as any[],
    taskCompletion: 0,
    avgCallDuration: 0,
  });
  const [loading, setLoading] = useState(true);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;

      try {
        const [customers, calls, followUps, tasks] = await Promise.all([
          customerApi.getAll(user.id),
          callApi.getAll(user.id),
          followUpApi.getAll(user.id),
          taskApi.getAll(user.id),
        ]);

        // Customers by status
        const statusCounts = {
          lead: customers?.filter((c) => c.status === 'lead').length || 0,
          prospect: customers?.filter((c) => c.status === 'prospect').length || 0,
          qualified: customers?.filter((c) => c.status === 'qualified').length || 0,
          customer: customers?.filter((c) => c.status === 'customer').length || 0,
          inactive: customers?.filter((c) => c.status === 'inactive').length || 0,
        };

        // Task completion
        const completed = tasks?.filter((t) => t.status === 'completed').length || 0;
        const total = tasks?.length || 1;
        const completion = Math.round((completed / total) * 100);

        // Average call duration
        const totalDuration = calls?.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) || 0;
        const avgDuration = calls?.length ? Math.round(totalDuration / calls.length) : 0;

        setStats({
          customersByStatus: [
            { name: 'Lead', value: statusCounts.lead },
            { name: 'Prospect', value: statusCounts.prospect },
            { name: 'Qualified', value: statusCounts.qualified },
            { name: 'Customer', value: statusCounts.customer },
            { name: 'Inactive', value: statusCounts.inactive },
          ],
          callsLastWeek: [
            { day: 'Mon', calls: 0 },
            { day: 'Tue', calls: 0 },
            { day: 'Wed', calls: 0 },
            { day: 'Thu', calls: 0 },
            { day: 'Fri', calls: 0 },
            { day: 'Sat', calls: 0 },
            { day: 'Sun', calls: 0 },
          ],
          taskCompletion: completion,
          avgCallDuration: avgDuration,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.id]);

  if (loading) {
    return <div className="p-6 bg-slate-900 min-h-screen text-white">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Analytics
        </h1>
        <p className="text-slate-400 mt-1">Your CRM performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">Avg Call Duration</p>
            <p className="text-4xl font-bold text-white mt-2">{stats.avgCallDuration} min</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">Task Completion</p>
            <p className="text-4xl font-bold text-white mt-2">{stats.taskCompletion}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers by Status - Pie Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Customers by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.customersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.customersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Calls This Week - Line Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Calls This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.callsLastWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Details Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Customer Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.customersByStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
                <span className="text-slate-300">{item.name}</span>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
