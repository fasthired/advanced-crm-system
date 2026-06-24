'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAdminWorker } from '@/lib/admin-worker-context';
import AdminWorkerSelector from '@/components/admin-worker-selector';
import { customerApi, callApi, followUpApi, taskApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, CheckCircle2, ClipboardList, TrendingUp, Clock, ArrowUpRight, Zap, Target } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedWorkerId } = useAdminWorker();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLeads: 0,
    callsToday: 0,
    pendingFollowUps: 0,
    overdueTasks: 0,
    conversionRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user?.role !== 'admin' && !user?.id) return;

      try {
        const targetUserId = user?.role === 'admin' ? (selectedWorkerId === 'all' ? '' : selectedWorkerId) : user?.id;

        const [customers, calls, followUps, tasks, activities] = await Promise.all([
          customerApi.getAll(targetUserId || ''),
          callApi.getTodayCalls(targetUserId || ''),
          followUpApi.getUpcoming(targetUserId || ''),
          taskApi.getByStatus(targetUserId || '', 'todo'),
          activityApi.getAll(targetUserId || ''),
        ]);

        const leads = customers?.filter(c => c.status === 'lead') || [];
        const customers_count = customers?.filter(c => c.status !== 'lead') || [];
        const conversion = customers?.length ? Math.round((customers_count.length / customers.length) * 100) : 0;

        setStats({
          totalCustomers: customers?.length || 0,
          totalLeads: leads.length,
          callsToday: calls?.length || 0,
          pendingFollowUps: followUps?.length || 0,
          overdueTasks: tasks?.length || 0,
          conversionRate: conversion,
        });

        setRecentActivities((activities || []).slice(0, 10));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id, selectedWorkerId]);

  const StatCard = ({ icon: Icon, label, value, href, trend }: any) => (
    <Link href={href} className="group">
      <Card className="bg-card/40 border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300 cursor-pointer backdrop-blur">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-xs text-accent">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{trend}</span>
                </div>
              )}
            </div>
            <div className="p-2.5 md:p-3 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 p-3 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Welcome back, <span className="font-semibold text-accent">{user?.full_name || user?.email?.split('@')[0]}</span></p>
          </div>
          <AdminWorkerSelector />
        </div>

        {/* Primary Stats - Premium Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <StatCard 
            icon={Users} 
            label="Total Customers" 
            value={stats.totalCustomers} 
            href="/dashboard/customers"
            trend="+12% this month"
          />
          <StatCard 
            icon={Target} 
            label="Active Leads" 
            value={stats.totalLeads} 
            href="/dashboard/customers?status=lead"
            trend="High priority"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Conversion Rate" 
            value={`${stats.conversionRate}%`} 
            href="/dashboard/analytics"
            trend="Industry avg: 18%"
          />
          <StatCard 
            icon={Phone} 
            label="Calls Today" 
            value={stats.callsToday} 
            href="/dashboard/calls"
            trend="Keep it up!"
          />
          <StatCard 
            icon={CheckCircle2} 
            label="Follow-ups Pending" 
            value={stats.pendingFollowUps} 
            href="/dashboard/follow-ups"
            trend="Action needed"
          />
          <StatCard 
            icon={ClipboardList} 
            label="Pending Tasks" 
            value={stats.overdueTasks} 
            href="/dashboard/tasks"
            trend={stats.overdueTasks > 5 ? 'Review priority' : 'On track'}
          />
        </div>

        {/* Main Content - Premium Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Quick Actions - Premium Card */}
          <Card className="lg:col-span-1 bg-card/40 border-border/50 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Zap className="w-5 h-5 text-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link 
                href="/dashboard/customers/new" 
                className="block p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 font-medium text-sm"
              >
                + New Customer
              </Link>
              <Link 
                href="/dashboard/calls/new" 
                className="block p-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all duration-300 font-medium text-sm"
              >
                + Log Call
              </Link>
              <Link 
                href="/dashboard/follow-ups/new" 
                className="block p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all duration-300 font-medium text-sm"
              >
                + Schedule Follow-up
              </Link>
              <Link 
                href="/dashboard/tasks/new" 
                className="block p-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all duration-300 font-medium text-sm"
              >
                + Create Task
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activities - Enhanced */}
          <Card className="lg:col-span-3 bg-card/40 border-border/50 backdrop-blur">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5 text-primary" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, idx) => (
                    <div 
                      key={activity.id} 
                      className="flex gap-3 pb-3 border-b border-border/20 last:border-0 last:pb-0 group hover:bg-card/50 p-2 rounded-lg transition-colors"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
