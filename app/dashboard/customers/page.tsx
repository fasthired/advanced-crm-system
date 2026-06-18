'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { customerApi, activityApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit2, Trash2, Download, FileJson, Eye } from 'lucide-react';
import Link from 'next/link';
import { stringify } from 'csv-stringify/sync';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    lead: 'bg-yellow-500/10 text-yellow-400',
    prospect: 'bg-blue-500/10 text-blue-400',
    qualified: 'bg-green-500/10 text-green-400',
    customer: 'bg-purple-500/10 text-purple-400',
    inactive: 'bg-slate-500/10 text-slate-400',
  };

  useEffect(() => {
    fetchCustomers();
  }, [user?.id]);

  const fetchCustomers = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await customerApi.getAll(user.id);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    setDeleting(id);
    try {
      await customerApi.delete(id);
      setCustomers(customers.filter((c) => c.id !== id));
      await activityApi.log({
        user_id: user!.id,
        activity_type: 'customer_deleted',
        entity_type: 'customer',
        entity_id: id,
        description: 'Customer deleted',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setDeleting(null);
    }
  };

  const exportToCSV = () => {
    const columns = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Value', 'Created Date'];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.email || '',
      c.phone || '',
      c.company || '',
      c.status,
      c.value || 0,
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csv = stringify([columns, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 mt-1">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Link href="/dashboard/customers/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No customers found</p>
              <Link href="/dashboard/customers/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Your First Customer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Company</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Value</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{customer.name}</p>
                          <p className="text-sm text-slate-400">{customer.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{customer.company || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusColors[customer.status]} border-0`}>
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">${customer.value.toFixed(2)}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-yellow-400 hover:text-yellow-300">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          disabled={deleting === customer.id}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
