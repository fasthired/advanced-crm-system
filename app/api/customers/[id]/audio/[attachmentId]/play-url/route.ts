import { NextResponse } from 'next/server';
import { CUSTOMER_AUDIO_BUCKET } from '@/lib/customer-audio';
import { getAttachmentById, getCustomerAccess } from '@/app/api/customers/_helpers';

type RouteContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

/** Returns a short-lived Supabase signed URL for native mobile audio playback. */
export async function GET(request: Request, context: RouteContext) {
  const { id: customerId, attachmentId } = await context.params;
  const access = await getCustomerAccess(request, customerId);
  if ('response' in access) return access.response;

  const attachment = getAttachmentById(access.attachments, attachmentId);
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const { data, error } = await access.authed.supabase.storage
    .from(CUSTOMER_AUDIO_BUCKET)
    .createSignedUrl(attachment.storage_path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Failed to create playback URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
