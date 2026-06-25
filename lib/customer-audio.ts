export const CUSTOMER_AUDIO_BUCKET = 'customer-audio-attachments';

/** Extensions we accept when the browser reports a missing or generic MIME type. */
export const ALLOWED_AUDIO_EXTENSIONS = new Set([
  'aac',
  'm4a',
  'mp3',
  'mpga',
  'mpeg',
  'wav',
  'ogg',
  'oga',
  'webm',
  'flac',
  'opus',
  'amr',
  '3gp',
  'wma',
  'aiff',
  'aif',
  'mp4',
  'caf',
  'mid',
  'midi',
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  mpga: 'audio/mpeg',
  mpeg: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  webm: 'audio/webm',
  flac: 'audio/flac',
  opus: 'audio/opus',
  amr: 'audio/amr',
  '3gp': 'audio/3gpp',
  wma: 'audio/x-ms-wma',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  mp4: 'audio/mp4',
  caf: 'audio/x-caf',
  mid: 'audio/midi',
  midi: 'audio/midi',
};

/** MIME types browsers and OSes commonly send for audio files. */
export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'audio/x-aac',
  'audio/aacp',
  'audio/vnd.dlna.adts',
  'audio/flac',
  'audio/x-wav',
  'audio/x-flac',
  'audio/opus',
  'audio/amr',
  'audio/3gpp',
  'audio/x-ms-wma',
  'audio/aiff',
  'audio/x-aiff',
  'audio/x-caf',
  'audio/midi',
  'audio/x-midi',
  'audio/vnd.wave',
  'application/ogg',
]);

const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

export const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024;

export function getAudioFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts.pop()!.toLowerCase();
}

/**
 * Resolve a reliable audio MIME type from the file name and browser-reported type.
 * Returns null when the file does not look like supported audio.
 */
export function resolveAudioMimeType(fileName: string, reportedType = ''): string | null {
  const extension = getAudioFileExtension(fileName);
  const normalizedType = reportedType.split(';')[0].trim().toLowerCase();

  if (normalizedType.startsWith('audio/')) {
    return normalizedType;
  }

  if (normalizedType === 'application/ogg') {
    return 'audio/ogg';
  }

  if (GENERIC_MIME_TYPES.has(normalizedType) && extension && ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
    return EXTENSION_TO_MIME[extension] ?? `audio/${extension}`;
  }

  if (extension && ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
    return EXTENSION_TO_MIME[extension] ?? `audio/${extension}`;
  }

  return null;
}

export function isSupportedAudioFile(fileName: string, reportedType = ''): boolean {
  return resolveAudioMimeType(fileName, reportedType) !== null;
}

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
