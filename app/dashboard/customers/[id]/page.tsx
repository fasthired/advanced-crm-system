'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { customerApi, callApi, taskApi, followUpApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit2, Trash2, Plus, Phone, ClipboardList, 
  CheckCircle2, Calendar, User, Building2, MapPin, Mail, 
  Clock, FileText, Check, Loader2, ArrowUpRight, DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [completingFollowUp, setCompletingFollowUp] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    lead: 'bg-yellow-500/10 text-yellow-400',
    prospect: 'bg-blue-500/10 text-blue-400',
    qualified: 'bg-green-500/10 text-green-400',
    customer: 'bg-purple-500/10 text-purple-400',
    inactive: 'bg-slate-500/10 text-slate-400',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-orange-500/10 text-orange-400',
    urgent: 'bg-red-500/10 text-red-400',
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

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerData, callsData, tasksData, followUpsData] = await Promise.all([
        customerApi.getById(id),
        callApi.getByCustomer(id),
        taskApi.getByCustomer(id),
        followUpApi.getByCustomer(id)
      ]);
      setCustomer(customerData);
      setCalls(callsData || []);
      setTasks(tasksData || []);
      setFollowUps(followUpsData || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? All associated data will be deleted.')) return;
    setDeleting(true);
    try {
      await customerApi.delete(id);
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'customer_deleted',
        entity_type: 'customer',
        entity_id: id,
        description: `Customer deleted: ${customer.name}`,
      });
      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      setDeleting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      const updated = await taskApi.update(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'task_updated',
        entity_type: 'task',
        entity_id: taskId,
        description: `Task "${updated.title}" marked as completed`,
      });
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleCompleteFollowUp = async (fupId: string) => {
    setCompletingFollowUp(fupId);
    try {
      const completed = await followUpApi.complete(fupId, 'Completed from customer profile');
      setFollowUps(followUps.map(f => f.id === fupId ? completed : f));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'follow_up_completed',
        entity_type: 'follow_up',
        entity_id: fupId,
        description: `Follow-up completed`,
      });
    } catch (error) {
      console.error('Error completing follow-up:', error);
    } finally {
      setCompletingFollowUp(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'task_deleted',
        entity_type: 'task',
        entity_id: taskId,
        description: 'Task deleted',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteFollowUp = async (fupId: string) => {
    if (!confirm('Delete this follow-up?')) return;
    try {
      await followUpApi.delete(fupId);
      setFollowUps(followUps.filter(f => f.id !== fupId));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'follow_up_deleted',
        entity_type: 'follow_up',
        entity_id: fupId,
        description: 'Follow-up deleted',
      });
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          <p className="text-slate-400">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 bg-slate-900 min-h-screen text-white">
        <Link href="/dashboard/customers">
          <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Button>
        </Link>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-400 text-lg">Customer profile not found or access denied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingFollowUps = followUps.filter(f => !f.completed);
  const completedFollowUps = followUps.filter(f => f.completed);
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/customers">
          <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Button>
        </Link>
      </div>

      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="w-8 h-8 text-blue-500" />
            {customer.name}
          </h1>
          <p className="text-slate-400 flex items-center gap-2">
            {customer.position && <span>{customer.position}</span>}
            {customer.position && customer.company && <span>at</span>}
            {customer.company && <span className="font-semibold text-slate-300">{customer.company}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${id}/edit`}>
            <Button variant="outline" className="gap-2 text-slate-300 hover:text-white border-slate-700 bg-slate-800/40">
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
          {user?.role === 'admin' && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details and Tabs (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Contact & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/40 border-slate-700/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Email</p>
                  <p className="text-sm font-medium text-white truncate mt-0.5">{customer.email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-lg text-green-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Phone</p>
                  <p className="text-sm font-medium text-white truncate mt-0.5">{customer.phone || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Location</p>
                  <p className="text-sm font-medium text-white truncate mt-0.5">
                    {customer.city || customer.country 
                      ? `${customer.city || ''}${customer.city && customer.country ? ', ' : ''}${customer.country || ''}`
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History and Activity Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-800 border border-slate-700 w-full justify-start p-1 h-auto grid grid-cols-4 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calls" className="gap-2">
                Calls ({calls.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                Tasks ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="followups" className="gap-2">
                Follow-ups ({upcomingFollowUps.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Customer Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {customer.notes || (
                    <span className="text-slate-500 italic">No notes captured for this customer.</span>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Full Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Full Name</span>
                    <span className="text-white font-medium">{customer.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Email Address</span>
                    <span className="text-white font-medium truncate max-w-[200px]">{customer.email || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Phone Number</span>
                    <span className="text-white font-medium">{customer.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Company Name</span>
                    <span className="text-white font-medium">{customer.company || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Job Title/Position</span>
                    <span className="text-white font-medium">{customer.position || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Street Address</span>
                    <span className="text-white font-medium">{customer.address || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">City</span>
                    <span className="text-white font-medium">{customer.city || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Country</span>
                    <span className="text-white font-medium">{customer.country || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Source Lead</span>
                    <span className="text-white font-medium capitalize">{customer.source}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/40">
                    <span className="text-slate-400">Valuation</span>
                    <span className="text-emerald-400 font-bold">¢{parseFloat(customer.value).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calls Tab */}
            <TabsContent value="calls" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Call Timeline</h3>
                <Link href={`/dashboard/calls/new?customerId=${id}`}>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Log Call
                  </Button>
                </Link>
              </div>

              {calls.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700/60 p-8 text-center">
                  <p className="text-slate-400">No calls logged with this customer.</p>
                  <Link href={`/dashboard/calls/new?customerId=${id}`} className="inline-block mt-3">
                    <Button variant="link" className="text-blue-400 hover:text-blue-300">Log the first call</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => (
                    <Card key={call.id} className="bg-slate-800/40 border-slate-700/60">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Badge className={`${callTypeColors[call.call_type]} border-0 capitalize`}>
                              {call.call_type}
                            </Badge>
                            <Badge className={`${outcomeColors[call.outcome]} border-0 capitalize`}>
                              {call.outcome.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(call.created_at).toLocaleString()}
                          </span>
                        </div>
                        {call.notes && <p className="text-slate-300 text-sm">{call.notes}</p>}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Duration: {call.duration_minutes} min
                          </span>
                          {call.recording_url && (
                            <a href={call.recording_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                              Listen Recording
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Tasks Associated</h3>
                <Link href={`/dashboard/tasks/new?customerId=${id}`}>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    New Task
                  </Button>
                </Link>
              </div>

              {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700/60 p-8 text-center">
                  <p className="text-slate-400">No tasks linked to this customer.</p>
                  <Link href={`/dashboard/tasks/new?customerId=${id}`} className="inline-block mt-3">
                    <Button variant="link" className="text-blue-400 hover:text-blue-300">Create a task</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">To Do / In Progress</h4>
                      {pendingTasks.map((task) => (
                        <Card key={task.id} className="bg-slate-800/40 border-slate-700/60">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="font-medium text-white text-sm truncate">{task.title}</p>
                              {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
                              {task.due_date && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`${priorityColors[task.priority]} border-0 capitalize`}>
                                {task.priority}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCompleteTask(task.id)}
                                disabled={completingTask === task.id}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                {completingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              {user?.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Done</h4>
                      {completedTasks.slice(0, 5).map((task) => (
                        <Card key={task.id} className="bg-slate-800/20 border-slate-700/40 opacity-70">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-400 text-sm line-through truncate">{task.title}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Completed: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            {user?.role === 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Follow-ups Tab */}
            <TabsContent value="followups" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Follow-up Tasks</h3>
                <Link href={`/dashboard/follow-ups/new?customerId=${id}`}>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Schedule Follow-up
                  </Button>
                </Link>
              </div>

              {upcomingFollowUps.length === 0 && completedFollowUps.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700/60 p-8 text-center">
                  <p className="text-slate-400">No follow-up reminders scheduled.</p>
                  <Link href={`/dashboard/follow-ups/new?customerId=${id}`} className="inline-block mt-3">
                    <Button variant="link" className="text-blue-400 hover:text-blue-300">Schedule follow-up now</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Upcoming Follow-ups */}
                  {upcomingFollowUps.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Upcoming</h4>
                      {upcomingFollowUps.map((fup) => (
                        <Card key={fup.id} className="bg-slate-800/40 border-slate-700/60">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/10 text-blue-400 border-0 capitalize text-xs">
                                  {fup.follow_up_type}
                                </Badge>
                                <Badge className={`${priorityColors[fup.priority]} border-0 capitalize text-xs`}>
                                  {fup.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-white font-medium mt-1 leading-snug">{fup.description}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Scheduled: {new Date(fup.scheduled_date).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCompleteFollowUp(fup.id)}
                                disabled={completingFollowUp === fup.id}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                {completingFollowUp === fup.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              {user?.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFollowUp(fup.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Completed Follow-ups */}
                  {completedFollowUps.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Completed</h4>
                      {completedFollowUps.slice(0, 5).map((fup) => (
                        <Card key={fup.id} className="bg-slate-800/20 border-slate-700/40 opacity-70">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <span className="bg-slate-600/20 text-slate-400 border-0 capitalize text-xs px-2 py-0.5 rounded font-medium">
                                {fup.follow_up_type}
                              </span>
                              <p className="text-sm text-slate-400 font-medium line-through mt-1 leading-snug">{fup.description}</p>
                              {fup.completion_notes && <p className="text-xs text-slate-500 italic mt-1">{fup.completion_notes}</p>}
                              <p className="text-xs text-slate-500 mt-1">
                                Completed: {fup.completed_at ? new Date(fup.completed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            {user?.role === 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFollowUp(fup.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info Panels (Right Column) */}
        <div className="space-y-6">
          {/* Pipelines & Deal Status Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <span className="text-slate-400 text-sm">Status Stage</span>
                <Badge className={`${statusColors[customer.status]} border-0 capitalize text-sm font-medium px-3 py-1`}>
                  {customer.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <span className="text-slate-400 text-sm">Estimated Deal Value</span>
                <span className="text-white font-bold text-lg flex items-center text-emerald-400">
                  <span className="mr-0.5">¢</span>
                  {parseFloat(customer.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <span className="text-slate-400 text-sm">Lead Source</span>
                <span className="text-slate-300 font-medium capitalize text-sm">{customer.source}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Quick Interaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/calls/new?customerId=${id}`} className="block">
                <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Log a Call
                </Button>
              </Link>
              <Link href={`/dashboard/tasks/new?customerId=${id}`} className="block">
                <Button className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4" />
                  Create a Task
                </Button>
              </Link>
              <Link href={`/dashboard/follow-ups/new?customerId=${id}`} className="block">
                <Button className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4" />
                  Schedule Follow-up
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">System Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Created Date</span>
                <span className="text-slate-300">{new Date(customer.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="text-slate-300">{new Date(customer.updated_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Contacted</span>
                <span className="text-slate-300">
                  {customer.last_contact_date ? new Date(customer.last_contact_date).toLocaleString() : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
