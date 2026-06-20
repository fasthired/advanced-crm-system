import { NextResponse } from 'next/server';
import { applyListFilters, assertAllowedTable, getAuthedContext, ownsPayload } from '../_helpers';

type RouteContext = {
  params: Promise<{ table: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { table } = await context.params;
  const tableError = assertAllowedTable(table);
  if (tableError) return tableError;

  const authed = await getAuthedContext(request);
  if ('response' in authed) return authed.response;

  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get('userId');
  if (requestedUserId && requestedUserId !== authed.user.id && !authed.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!requestedUserId && !authed.isAdmin) {
    url.searchParams.set('userId', authed.user.id);
  }

  const select = url.searchParams.get('select') || '*';
  const query = applyListFilters(authed.supabase.from(table).select(select), table, url.searchParams);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request, context: RouteContext) {
  const { table } = await context.params;
  const tableError = assertAllowedTable(table);
  if (tableError) return tableError;

  const authed = await getAuthedContext(request);
  if ('response' in authed) return authed.response;

  const payload = await request.json();
  if (!authed.isAdmin && !ownsPayload(payload, authed.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const record = { ...payload, user_id: payload.user_id || authed.user.id };
  const { data, error } = await authed.supabase.from(table).insert([record]).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
