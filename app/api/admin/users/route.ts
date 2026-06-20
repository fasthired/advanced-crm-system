import { NextResponse } from 'next/server';
import { getActiveProfile, getAuthenticatedUser, getSupabaseAdmin, isAdminProfile } from '@/lib/supabase-admin';

const recordTables = ['customers', 'calls', 'follow_ups', 'reminders', 'tasks', 'notifications', 'activities'];

async function getAdminContext(request: Request) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error || !user) {
    return { response: NextResponse.json({ error }, { status: 401 }) };
  }

  const { profile, error: profileError } = await getActiveProfile(user.id);
  if (profileError || !profile || !isAdminProfile(profile)) {
    return { response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  return { user, profile, supabase: getSupabaseAdmin() };
}

function startOfToday() {
  const day = new Date().toISOString().split('T')[0];
  return `${day}T00:00:00.000Z`;
}

function increment(map: Map<string, number>, userId: string, amount = 1) {
  map.set(userId, (map.get(userId) || 0) + amount);
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminContext(request);
    if ('response' in admin) return admin.response;

    const { supabase } = admin;
    const { data: users, error } = await supabase
      .from('users')
      .select(
        'id, email, full_name, role, account_status, status_reason, status_updated_at, status_updated_by, disabled_at, banned_at, removed_at, last_seen_at, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const since = startOfToday();
    const totalRecords = new Map<string, number>();
    const recordsToday = new Map<string, number>();
    const tasksCompletedToday = new Map<string, number>();

    await Promise.all(
      recordTables.map(async (table) => {
        const select = table === 'tasks' ? 'user_id, created_at, status, completed_at' : 'user_id, created_at';
        const { data } = await supabase.from(table).select(select);
        (data || []).forEach((record: any) => {
          if (!record.user_id) return;
          increment(totalRecords, record.user_id);
          if (record.created_at >= since) increment(recordsToday, record.user_id);
          if (table === 'tasks' && record.status === 'completed' && record.completed_at >= since) {
            increment(tasksCompletedToday, record.user_id);
          }
        });
      })
    );

    const { data: activitiesToday } = await supabase
      .from('activities')
      .select('user_id, activity_type, entity_type, description, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const activityCountToday = new Map<string, number>();
    (activitiesToday || []).forEach((activity: any) => increment(activityCountToday, activity.user_id));

    const enrichedUsers = (users || []).map((worker: any) => ({
      ...worker,
      stats: {
        total_records: totalRecords.get(worker.id) || 0,
        records_today: recordsToday.get(worker.id) || 0,
        activities_today: activityCountToday.get(worker.id) || 0,
        tasks_completed_today: tasksCompletedToday.get(worker.id) || 0,
      },
    }));

    return NextResponse.json({
      data: {
        users: enrichedUsers,
        activities_today: activitiesToday || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminContext(request);
    if ('response' in admin) return admin.response;

    const { userId, action, reason } = await request.json();
    const allowedActions = new Set(['activate', 'disable', 'ban', 'remove']);

    if (!userId || !allowedActions.has(action)) {
      return NextResponse.json({ error: 'A valid userId and action are required' }, { status: 400 });
    }

    const { supabase, user: adminUser } = admin;
    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: targetError?.message || 'User not found' }, { status: 404 });
    }

    if (target.role === 'admin') {
      return NextResponse.json({ error: 'The admin account cannot be disabled, banned, or removed' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      account_status: action === 'activate' ? 'active' : action === 'disable' ? 'disabled' : action === 'ban' ? 'banned' : 'removed',
      status_reason: reason || null,
      status_updated_at: now,
      status_updated_by: adminUser.id,
    };

    if (action === 'disable') updates.disabled_at = now;
    if (action === 'ban') updates.banned_at = now;
    if (action === 'remove') updates.removed_at = now;
    if (action === 'activate') {
      updates.disabled_at = null;
      updates.banned_at = null;
      updates.removed_at = null;
    }

    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (action === 'ban' || action === 'remove') {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: '876000h' } as any);
    }

    if (action === 'activate') {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' } as any);
    }

    await supabase.from('activities').insert({
      user_id: adminUser.id,
      activity_type: `user_${action}`,
      entity_type: 'user',
      entity_id: userId,
      description: `Admin ${action}d a worker account`,
      metadata: { reason: reason || null },
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
