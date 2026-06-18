'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { taskApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Download, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { stringify } from 'csv-stringify/sync';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const fetchTasks = async () => {
    if (!user?.id) return;
    try {
      const data = await taskApi.getAll(user.id);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await taskApi.update(id, {
        status: newStatus as any,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
      setTasks(tasks.map((t) => (t.id === id ? updated : t)));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'task_updated',
        entity_type: 'task',
        entity_id: id,
        description: `Task status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.delete(id);
      setTasks(tasks.filter((t) => t.id !== id));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'task_deleted',
        entity_type: 'task',
        entity_id: id,
        description: 'Task deleted',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const exportToCSV = () => {
    const columns = ['Title', 'Status', 'Priority', 'Due Date', 'Created'];
    const rows = tasks.map((t) => [
      t.title,
      t.status,
      t.priority,
      t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A',
      new Date(t.created_at).toLocaleDateString(),
    ]);
    const csv = stringify([columns, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().getTime()}.csv`;
    a.click();
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400',
    medium: 'bg-yellow-500/10 text-yellow-400',
    high: 'bg-orange-500/10 text-orange-400',
    urgent: 'bg-red-500/10 text-red-400',
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-slate-500/10 text-slate-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    completed: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-gray-500/10 text-gray-400',
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const TaskCard = ({ task }: any) => (
    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-white">{task.title}</p>
          <p className="text-sm text-slate-400 mt-1">{task.description}</p>
        </div>
        <Badge className={`${priorityColors[task.priority]} border-0 capitalize flex-shrink-0`}>
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {task.status !== 'completed' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange(task.id, 'completed')}
              className="text-green-400 hover:text-green-300"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(task.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {task.due_date && (
          <p className="text-xs text-slate-500">
            {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">Manage your to-do list and projects</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/dashboard/tasks/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Card className="bg-slate-800/50">
          <CardContent className="p-8 text-center text-slate-400">Loading tasks...</CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="todo" className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="todo" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              To Do ({todoTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Done ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="space-y-3">
            {todoTasks.length === 0 ? (
              <Card className="bg-slate-800/50">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No tasks in to-do list</p>
                  <Link href="/dashboard/tasks/new">
                    <Button className="gap-2 bg-blue-600">
                      <Plus className="w-4 h-4" />
                      Create Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <Card className="bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">No tasks in progress</CardContent>
              </Card>
            ) : (
              inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedTasks.length === 0 ? (
              <Card className="bg-slate-800/50">
                <CardContent className="p-8 text-center text-slate-400">No completed tasks</CardContent>
              </Card>
            ) : (
              completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
