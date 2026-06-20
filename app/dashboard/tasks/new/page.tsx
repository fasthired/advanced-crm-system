'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { taskApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const task = await taskApi.create({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority as any,
        status: formData.status as any,
        due_date: formData.due_date ? formData.due_date : null,
      });

      await activityApi.log({
        user_id: user.id,
        activity_type: 'task_created',
        entity_type: 'task',
        entity_id: task.id,
        description: `Task created: ${task.title}`,
      });

      router.push('/dashboard/tasks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <Link href="/dashboard/tasks">
        <Button variant="ghost" className="gap-2 text-slate-300">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Create Task</h1>
        <p className="text-slate-400 mt-1">Add a new task to your to-do list</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-900/20 text-red-300 rounded text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task title"
                required
                disabled={loading}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => v && handleSelectChange('priority', v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <Select value={formData.status} onValueChange={(v) => v && handleSelectChange('status', v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Due Date</label>
                <Input
                  name="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task description..."
                disabled={loading}
                className="bg-slate-900 border-slate-700 text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
