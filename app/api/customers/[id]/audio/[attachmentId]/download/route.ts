import { NextResponse } from 'next/server';
import { CUSTOMER_AUDIO_BUCKET } from '@/lib/customer-audio';
import { getAttachmentById, getCustomerAccess } from '@/app/api/customers/_helpers';

type RouteContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id: customerId, attachmentId } = await context.params;
  const access = await getCustomerAccess(request, customerId);
  if ('response' in access) return access.response;

  if (!access.authed.isAdmin) {
    return NextResponse.json({ error: 'Only administrators can download audio files' }, { status: 403 });
  }

  const attachment = getAttachmentById(access.attachments, attachmentId);
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const { data, error } = await access.authed.supabase.storage
    .from(CUSTOMER_AUDIO_BUCKET)
    .download(attachment.storage_path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to load audio' }, { status: 500 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const safeFileName = attachment.file_name.replace(/["\\]/g, '_');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': attachment.mime_type,
      'Content-Length': String(buffer.length),
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
