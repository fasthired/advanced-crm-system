import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const adminEmail = process.env.ADMIN_SETUP_EMAIL;
const adminPassword = process.env.ADMIN_SETUP_PASSWORD;
const adminFullName = process.env.ADMIN_SETUP_FULL_NAME || 'Admin User';
const setupToken = process.env.ADMIN_SETUP_TOKEN;

async function createOrPromoteAdmin(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('x-admin-setup-token');

  if (!setupToken || token !== setupToken) {
    return NextResponse.json({ error: 'Invalid setup token' }, { status: 401 });
  }

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Admin setup email or password is missing' }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  let authUser = usersData.users.find((user) => user.email?.toLowerCase() === adminEmail.toLowerCase());

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminFullName },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Unable to create admin user' }, { status: 500 });
    }

    authUser = data.user;
  }

  const { error: upsertError } = await supabase.from('users').upsert({
    id: authUser.id,
    email: adminEmail,
    full_name: adminFullName,
    role: 'admin',
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Admin account is ready.',
    user: {
      id: authUser.id,
      email: adminEmail,
      role: 'admin',
    },
  });
}

export async function GET(request: Request) {
  return createOrPromoteAdmin(request);
}

export async function POST(request: Request) {
  return createOrPromoteAdmin(request);
}
