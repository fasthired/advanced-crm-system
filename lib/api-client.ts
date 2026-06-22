import { supabase, type Database } from './supabase';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('You must be signed in to access CRM data.');
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}

function queryString(params: Record<string, string | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

const tableApi = {
  list<T>(table: string, params: Record<string, string | boolean | undefined> = {}) {
    return apiRequest<T[]>(`/api/db/${table}${queryString(params)}`);
  },

  get<T>(table: string, id: string) {
    return apiRequest<T>(`/api/db/${table}/${id}`);
  },

  create<T>(table: string, payload: Record<string, any>) {
    return apiRequest<T>(`/api/db/${table}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update<T>(table: string, id: string, payload: Record<string, any>) {
    return apiRequest<T>(`/api/db/${table}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete(table: string, id: string) {
    return apiRequest<boolean>(`/api/db/${table}/${id}`, {
      method: 'DELETE',
    });
  },
};

type Customer = Database['public']['Tables']['customers']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];
type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
type Reminder = Database['public']['Tables']['reminders']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];

export const customerApi = {
  getAll(userId: string) {
    return tableApi.list<Customer>('customers', { userId });
  },

  getById(id: string) {
    return tableApi.get<Customer>('customers', id);
  },

  create(customer: Record<string, any>) {
    return tableApi.create<Customer>('customers', customer);
  },

  update(id: string, updates: Database['public']['Tables']['customers']['Update']) {
    return tableApi.update<Customer>('customers', id, updates);
  },

  delete(id: string) {
    return tableApi.delete('customers', id);
  },

  search(userId: string, search: string) {
    return tableApi.list<Customer>('customers', { userId, search });
  },

  getByStatus(userId: string, status: string) {
    return tableApi.list<Customer>('customers', { userId, status });
  },
};

export const callApi = {
  getAll(userId: string) {
    return tableApi.list<Call>('calls', { userId, select: '*, customers(name, email)' });
  },

  getByCustomer(customerId: string) {
    return tableApi.list<Call>('calls', { customerId });
  },

  create(call: Record<string, any>) {
    return tableApi.create<Call>('calls', call);
  },

  update(id: string, updates: Database['public']['Tables']['calls']['Update']) {
    return tableApi.update<Call>('calls', id, updates);
  },

  delete(id: string) {
    return tableApi.delete('calls', id);
  },

  getTodayCalls(userId: string) {
    return tableApi.list<Call>('calls', { userId, today: true });
  },
};

export const followUpApi = {
  getAll(userId: string) {
    return tableApi.list<FollowUp>('follow_ups', { userId, select: '*, customers(name, email)' });
  },

  getUpcoming(userId: string) {
    return tableApi.list<FollowUp>('follow_ups', {
      userId,
      upcoming: true,
      select: '*, customers(name, email)',
    });
  },

  getByCustomer(customerId: string) {
    return tableApi.list<FollowUp>('follow_ups', { customerId, select: '*, customers(name, email)' });
  },

  create(followUp: Record<string, any>) {
    return tableApi.create<FollowUp>('follow_ups', followUp);
  },

  update(id: string, updates: Database['public']['Tables']['follow_ups']['Update']) {
    return tableApi.update<FollowUp>('follow_ups', id, updates);
  },

  delete(id: string) {
    return tableApi.delete('follow_ups', id);
  },

  complete(id: string, notes: string) {
    return tableApi.update<FollowUp>('follow_ups', id, {
      completed: true,
      completed_at: new Date().toISOString(),
      completion_notes: notes,
    });
  },
};

export const reminderApi = {
  getAll(userId: string) {
    return tableApi.list<Reminder>('reminders', { userId });
  },

  getUpcoming(userId: string) {
    return tableApi.list<Reminder>('reminders', { userId, upcoming: true });
  },

  create(reminder: Record<string, any>) {
    return tableApi.create<Reminder>('reminders', reminder);
  },

  update(id: string, updates: Database['public']['Tables']['reminders']['Update']) {
    return tableApi.update<Reminder>('reminders', id, updates);
  },

  delete(id: string) {
    return tableApi.delete('reminders', id);
  },

  complete(id: string) {
    return tableApi.update<Reminder>('reminders', id, {
      completed: true,
      completed_at: new Date().toISOString(),
    });
  },
};

export const taskApi = {
  getAll(userId: string) {
    return tableApi.list<Task>('tasks', { userId });
  },

  getByStatus(userId: string, status: string) {
    return tableApi.list<Task>('tasks', { userId, status });
  },

  getByCustomer(customerId: string) {
    return tableApi.list<Task>('tasks', { customerId });
  },

  create(task: Record<string, any>) {
    return tableApi.create<Task>('tasks', task);
  },

  update(id: string, updates: Database['public']['Tables']['tasks']['Update']) {
    return tableApi.update<Task>('tasks', id, updates);
  },

  delete(id: string) {
    return tableApi.delete('tasks', id);
  },
};

export const notificationApi = {
  getAll(userId: string) {
    return tableApi.list<Notification>('notifications', { userId });
  },

  getUnread(userId: string) {
    return tableApi.list<Notification>('notifications', { userId, unread: true });
  },

  create(notification: Record<string, any>) {
    return tableApi.create<Notification>('notifications', notification);
  },

  markAsRead(id: string) {
    return tableApi.update<Notification>('notifications', id, {
      read: true,
      read_at: new Date().toISOString(),
    });
  },

  async markAllAsRead(userId: string) {
    const unread = await notificationApi.getUnread(userId);
    await Promise.all(unread.map((notification) => notificationApi.markAsRead(notification.id)));
  },

  delete(id: string) {
    return tableApi.delete('notifications', id);
  },
};

export const activityApi = {
  getAll(userId: string) {
    return tableApi.list<Activity>('activities', { userId });
  },

  log(activity: Record<string, any>) {
    return tableApi.create<Activity>('activities', activity);
  },
};

export type AdminUserAction = 'activate' | 'disable' | 'ban' | 'remove';

export const adminApi = {
  getUsers() {
    return apiRequest<{
      users: Array<Database['public']['Tables']['users']['Row'] & {
        stats: {
          total_records: number;
          records_today: number;
          activities_today: number;
          tasks_completed_today: number;
        };
      }>;
      activities_today: any[];
    }>('/api/admin/users');
  },

  updateUser(userId: string, action: AdminUserAction, reason?: string) {
    return apiRequest<Database['public']['Tables']['users']['Row']>('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, action, reason }),
    });
  },
};
