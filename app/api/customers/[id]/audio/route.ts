import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  ALLOWED_AUDIO_MIME_TYPES,
  CUSTOMER_AUDIO_BUCKET,
  MAX_AUDIO_FILE_BYTES,
  type CustomerAudioAttachment,
} from '@/lib/customer-audio';
import { getAttachmentById, getCustomerAccess } from '@/app/api/customers/_helpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await getCustomerAccess(request, id);
  if ('response' in access) return access.response;

  return NextResponse.json({ data: access.attachments });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: customerId } = await context.params;
  const access = await getCustomerAccess(request, customerId);
  if ('response' in access) return access.response;

  const formData = await request.formData();
  const file = formData.get('file');
  const label = String(formData.get('label') || '').trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
  }

  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return NextResponse.json({ error: 'Audio file exceeds the 50MB limit' }, { status: 400 });
  }

  const mimeType = file.type || 'audio/webm';
  if (!ALLOWED_AUDIO_MIME_TYPES.includes(mimeType as (typeof ALLOWED_AUDIO_MIME_TYPES)[number])) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = safeName.includes('.') ? safeName.split('.').pop() : 'webm';
  const attachmentId = randomUUID();
  const storagePath = `customers/${customerId}/${Date.now()}_${attachmentId}.${extension}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await access.authed.supabase.storage
    .from(CUSTOMER_AUDIO_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const attachment: CustomerAudioAttachment = {
    id: attachmentId,
    storage_path: storagePath,
    file_name: safeName || `recording.${extension}`,
    mime_type: mimeType,
    size_bytes: file.size,
    uploaded_by: access.authed.user.id,
    uploaded_at: new Date().toISOString(),
    label: label || null,
  };

  const updatedAttachments = [...access.attachments, attachment];

  const { data: updatedCustomer, error: updateError } = await access.authed.supabase
    .from('customers')
    .update({ attachments: updatedAttachments })
    .eq('id', customerId)
    .select('attachments')
    .single();

  if (updateError) {
    await access.authed.supabase.storage.from(CUSTOMER_AUDIO_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: attachment, attachments: updatedCustomer.attachments });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id: customerId } = await context.params;
  const access = await getCustomerAccess(request, customerId);
  if ('response' in access) return access.response;

  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get('attachmentId');

  if (!attachmentId) {
    return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 });
  }

  const attachment = getAttachmentById(access.attachments, attachmentId);
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  await access.authed.supabase.storage.from(CUSTOMER_AUDIO_BUCKET).remove([attachment.storage_path]);

  const updatedAttachments = access.attachments.filter((item) => item.id !== attachmentId);

  const { error: updateError } = await access.authed.supabase
    .from('customers')
    .update({ attachments: updatedAttachments })
    .eq('id', customerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
