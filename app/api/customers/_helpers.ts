import { NextResponse } from 'next/server';
import { getAuthedContext } from '@/app/api/db/_helpers';
import { parseCustomerAttachments } from '@/lib/customer-audio';

export async function getCustomerAccess(request: Request, customerId: string) {
  const authed = await getAuthedContext(request);
  if ('response' in authed) return { response: authed.response };

  const { data: customer, error } = await authed.supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    return { response: NextResponse.json({ error: 'Customer not found' }, { status: 404 }) };
  }

  if (customer.user_id !== authed.user.id && !authed.isAdmin) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const attachments = parseCustomerAttachments(customer.attachments);

  return {
    authed,
    customer,
    attachments,
  };
}

export function getAttachmentById(
  attachments: ReturnType<typeof parseCustomerAttachments>,
  attachmentId: string
) {
  return attachments.find((attachment) => attachment.id === attachmentId) ?? null;
}
