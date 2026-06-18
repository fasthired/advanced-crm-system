import { NextResponse } from 'next/server';
import { assertAllowedTable, getAuthedContext, ownsPayload } from '../../_helpers';

type RouteContext = {
  params: Promise<{ table: string; id: string }>;
};

async function getOwnedRecord(supabase: any, table: string, id: string, userId: string) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();

  if (error || !data) {
    return { response: NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 }) };
  }

  if (data.user_id !== userId) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { data };
}

export async function GET(request: Request, context: RouteContext) {
  const { table, id } = await context.params;
  const tableError = assertAllowedTable(table);
  if (tableError) return tableError;

  const authed = await getAuthedContext(request);
  if ('response' in authed) return authed.response;

  const owned = await getOwnedRecord(authed.supabase, table, id, authed.user.id);
  if ('response' in owned) return owned.response;

  return NextResponse.json({ data: owned.data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { table, id } = await context.params;
  const tableError = assertAllowedTable(table);
  if (tableError) return tableError;

  const authed = await getAuthedContext(request);
  if ('response' in authed) return authed.response;

  const owned = await getOwnedRecord(authed.supabase, table, id, authed.user.id);
  if ('response' in owned) return owned.response;

  const payload = await request.json();
  if (!ownsPayload(payload, authed.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await authed.supabase.from(table).update(payload).eq('id', id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { table, id } = await context.params;
  const tableError = assertAllowedTable(table);
  if (tableError) return tableError;

  const authed = await getAuthedContext(request);
  if ('response' in authed) return authed.response;

  const owned = await getOwnedRecord(authed.supabase, table, id, authed.user.id);
  if ('response' in owned) return owned.response;

  const { error } = await authed.supabase.from(table).delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
