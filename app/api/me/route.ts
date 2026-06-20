import { NextResponse } from 'next/server';
import { getActiveProfile, getAuthenticatedUser } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error || !user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { profile, error: profileError } = await getActiveProfile(user.id);

    if (profileError || !profile) {
      const status = profile?.account_status === 'active' ? 500 : 403;
      return NextResponse.json({ error: profileError }, { status });
    }

    return NextResponse.json({ data: profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
