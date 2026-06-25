export const CUSTOMER_AUDIO_BUCKET = 'customer-audio-attachments';

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/x-wav',
] as const;

export const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024;

export type CustomerAudioAttachment = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  label?: string | null;
};

export function parseCustomerAttachments(value: unknown): CustomerAudioAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is CustomerAudioAttachment =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as CustomerAudioAttachment).id === 'string' &&
      typeof (item as CustomerAudioAttachment).storage_path === 'string'
  );
}

export function formatAudioDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
