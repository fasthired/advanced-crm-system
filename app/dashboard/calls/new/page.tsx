'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { callApi, customerApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function NewCallForm() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: initialCustomerId,
    call_type: 'outbound',
    duration_minutes: '',
    outcome: 'completed',
    notes: '',
  });
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id]);

  const fetchCustomers = async () => {
    if (!user?.id) return;
    try {
      const data = await customerApi.getAll(user.id);
      setCustomers(data || []);
      // If customerId param matches a customer, make sure it is selected
      if (initialCustomerId && data && data.some((c: any) => c.id === initialCustomerId)) {
        setFormData(prev => ({ ...prev, customer_id: initialCustomerId }));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.customer_id) return;

    setError('');
    setLoading(true);
    setUploading(false);

    try {
      let recordingUrl = null;
      if (recordingFile) {
        setUploading(true);
        const fileExt = recordingFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `recordings/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('call-recordings')
          .upload(filePath, recordingFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('call-recordings')
          .getPublicUrl(filePath);

        recordingUrl = publicUrl;
        setUploading(false);
      }

      const call = await callApi.create({
        user_id: user.id,
        customer_id: formData.customer_id,
        call_type: formData.call_type as any,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        outcome: formData.outcome as any,
        notes: formData.notes || null,
        recording_url: recordingUrl,
      });

      // Update customer last contact date
      await customerApi.update(formData.customer_id, {
        last_contact_date: new Date().toISOString(),
      });

      await activityApi.log({
        user_id: user.id,
        activity_type: 'call_logged',
        entity_type: 'call',
        entity_id: call.id,
        description: `Call logged with ${customers.find((c) => c.id === formData.customer_id)?.name}`,
      });

      router.push('/dashboard/calls');
    } catch (err: any) {
      setError(err.message || 'Failed to log call');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (customerLoading) {
    return <div className="p-6 bg-slate-900 min-h-screen text-white">Loading customers...</div>;
  }

  if (customers.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
        <Link href="/dashboard/calls">
          <Button variant="ghost" className="gap-2 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-400 mb-4">No customers found. Please create a customer first.</p>
            <Link href="/dashboard/customers/new">
              <Button className="bg-blue-600 hover:bg-blue-700">Create Customer</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      <Link href="/dashboard/calls">
        <Button variant="ghost" className="gap-2 text-slate-300">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Log a Call</h1>
        <p className="text-slate-400 mt-1">Record details about your customer interaction</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Customer *</label>
              <Select value={formData.customer_id} onValueChange={(value) => value && handleSelectChange('customer_id', value)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company || 'No company'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Call Type *</label>
                <Select value={formData.call_type} onValueChange={(value) => value && handleSelectChange('call_type', value)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Duration (minutes)</label>
                <Input
                  name="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  placeholder="15"
                  disabled={loading}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Outcome *</label>
                <Select value={formData.outcome} onValueChange={(value) => value && handleSelectChange('outcome', value)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notes</label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Call summary, action items, next steps..."
                disabled={loading || uploading}
                className="bg-slate-900 border-slate-700 text-white"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Voice Recording File (Optional)</label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRecordingFile(e.target.files[0]);
                  }
                }}
                disabled={loading || uploading}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">Upload MP3, OGG, WAV, M4A, or other common phone audio formats (Max 50MB).</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || uploading} className="gap-2 bg-green-600 hover:bg-green-700">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading Audio...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  'Log Call'
                )}
              </Button>
              <Link href="/dashboard/calls">
                <Button variant="outline" className="text-slate-300">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewCallPage() {
  return (
    <Suspense fallback={<div className="p-6 bg-slate-900 min-h-screen text-white">Loading form...</div>}>
      <NewCallForm />
    </Suspense>
  );
}
