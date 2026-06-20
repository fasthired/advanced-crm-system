import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server Supabase variables are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: 'Missing authorization token' };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired authorization token' };
  }

  return { user: data.user, error: null };
}

export type AccountStatus = 'active' | 'disabled' | 'banned' | 'removed';

export type AppProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  account_status: AccountStatus;
  status_reason: string | null;
};

export function isAdminProfile(profile: AppProfile | null | undefined) {
  return profile?.role === 'admin';
}

export async function getActiveProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, account_status, status_reason')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { profile: null, error: error?.message || 'Account profile was not found' };
  }

  const profile = data as AppProfile;
  if (profile.account_status !== 'active') {
    return {
      profile,
      error: `This account is ${profile.account_status}. Please contact the administrator.`,
    };
  }

  await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);

  return { profile, error: null };
}
