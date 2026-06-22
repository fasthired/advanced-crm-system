'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { followUpApi, customerApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function NewFollowUpForm() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: initialCustomerId,
    follow_up_type: 'call',
    priority: 'medium',
    description: '',
    scheduled_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      customerApi.getAll(user.id).then((data) => {
        setCustomers(data || []);
        // If customerId param matches a customer, make sure it is selected
        if (initialCustomerId && data && data.some((c: any) => c.id === initialCustomerId)) {
          setFormData(prev => ({ ...prev, customer_id: initialCustomerId }));
        }
        setCustomerLoading(false);
      });
    }
  }, [user?.id]);

  const handleChange = (e: any) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.customer_id) return;

    setLoading(true);
    try {
      const followUp = await followUpApi.create({
        user_id: user.id,
        customer_id: formData.customer_id,
        follow_up_type: formData.follow_up_type as any,
        priority: formData.priority as any,
        description: formData.description,
        scheduled_date: formData.scheduled_date,
      });

      await activityApi.log({
        user_id: user.id,
        activity_type: 'follow_up_created',
        entity_type: 'follow_up',
        entity_id: followUp.id,
        description: 'Follow-up created',
      });

      router.push('/dashboard/follow-ups');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (customerLoading) return <div className="p-6 bg-slate-900 text-white min-h-screen">Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <Link href="/dashboard/follow-ups">
        <Button variant="ghost" className="gap-2 text-slate-300">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Add Follow-up</h1>
        <p className="text-slate-400 mt-1">Create a new follow-up reminder</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">Follow-up Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-900/20 text-red-300 rounded text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Customer *</label>
              <Select value={formData.customer_id} onValueChange={(v) => v && handleSelectChange('customer_id', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <Select value={formData.follow_up_type} onValueChange={(v) => v && handleSelectChange('follow_up_type', v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <label className="text-sm font-medium text-slate-300">Scheduled Date *</label>
                <Input
                  name="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
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
                placeholder="What is this follow-up about?"
                required
                className="bg-slate-900 border-slate-700 text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Follow-up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewFollowUpPage() {
  return (
    <Suspense fallback={<div className="p-6 bg-slate-900 min-h-screen text-white">Loading form...</div>}>
      <NewFollowUpForm />
    </Suspense>
  );
}
