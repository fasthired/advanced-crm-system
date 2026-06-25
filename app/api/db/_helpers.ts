import { NextResponse } from 'next/server';
import { getActiveProfile, getAuthenticatedUser, getSupabaseAdmin, isAdminProfile } from '@/lib/supabase-admin';

const allowedTables = new Set([
  'customers',
  'calls',
  'follow_ups',
  'reminders',
  'tasks',
  'notifications',
  'activities',
]);

const tableOrderColumn: Record<string, string> = {
  customers: 'created_at',
  calls: 'created_at',
  follow_ups: 'scheduled_date',
  reminders: 'scheduled_time',
  tasks: 'due_date',
  notifications: 'created_at',
  activities: 'created_at',
};

const ascendingTables = new Set(['follow_ups', 'reminders', 'tasks']);

export function assertAllowedTable(table: string) {
  if (!allowedTables.has(table)) {
    return NextResponse.json({ error: 'Unsupported table' }, { status: 404 });
  }

  return null;
}

export async function getAuthedContext(request: Request) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error || !user) {
    return { response: NextResponse.json({ error }, { status: 401 }) };
  }

  const { profile, error: profileError } = await getActiveProfile(user.id);
  if (profileError || !profile) {
    return { response: NextResponse.json({ error: profileError }, { status: 403 }) };
  }

  return { user, profile, isAdmin: isAdminProfile(profile), supabase: getSupabaseAdmin() };
}

export function applyListFilters(query: any, table: string, searchParams: URLSearchParams) {
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const upcoming = searchParams.get('upcoming') === 'true';
  const today = searchParams.get('today') === 'true';
  const unread = searchParams.get('unread') === 'true';
  const search = searchParams.get('search');

  if (userId) query = query.eq('user_id', userId);
  if (status) query = query.eq('status', status);
  if (customerId) query = query.eq('customer_id', customerId);
  if (unread) query = query.eq('read', false);

  if (upcoming) {
    const timeColumn = table === 'reminders' ? 'scheduled_time' : 'scheduled_date';
    query = query.eq('completed', false).gte(timeColumn, new Date().toISOString());
  }

  if (today && table === 'calls') {
    const day = new Date().toISOString().split('T')[0];
    query = query.gte('created_at', `${day}T00:00:00`).lt('created_at', `${day}T23:59:59`);
  }

  if (search && table === 'customers') {
    const sanitized = search.replace(/[(),]/g, ' ');
    query = query.or(
      `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,company.ilike.%${sanitized}%,website.ilike.%${sanitized}%`
    );
  }

  const orderColumn = tableOrderColumn[table] || 'created_at';
  return query.order(orderColumn, { ascending: ascendingTables.has(table) });
}

export function ownsPayload(payload: any, userId: string) {
  return !payload?.user_id || payload.user_id === userId;
}
