import { NextResponse } from 'next/server';
import { CUSTOMER_AUDIO_BUCKET } from '@/lib/customer-audio';
import { getAttachmentById, getCustomerAccess } from '@/app/api/customers/_helpers';

type RouteContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

function buildAudioResponse(
  buffer: Buffer,
  mimeType: string,
  request: Request
): NextResponse {
  const total = buffer.length;
  const commonHeaders: Record<string, string> = {
    'Content-Type': mimeType,
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-store',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader.trim());
    if (match) {
      const start = Number.parseInt(match[1], 10);
      const end = match[2] ? Number.parseInt(match[2], 10) : total - 1;

      if (Number.isFinite(start) && start >= 0 && start < total && end >= start && end < total) {
        const chunk = buffer.subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            ...commonHeaders,
            'Content-Length': String(chunk.length),
            'Content-Range': `bytes ${start}-${end}/${total}`,
          },
        });
      }
    }
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      ...commonHeaders,
      'Content-Length': String(total),
    },
  });
}

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
    .download(attachment.storage_path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to load audio' }, { status: 500 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return buildAudioResponse(buffer, attachment.mime_type, request);
}
