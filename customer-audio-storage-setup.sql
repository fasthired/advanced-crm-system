-- Customer Audio Attachments — Private Supabase Storage Bucket
-- Run this SQL in your Supabase SQL Editor to enable customer audio uploads.
--
-- After running:
--   1. Confirm bucket "customer-audio-attachments" appears in Storage (private).
--   2. Upload/play audio from any customer profile in the CRM.
--   3. Only admins can download files; all active users can upload and play.

-- 1. Create the private bucket (50MB per file, common audio formats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-audio-attachments',
  'customer-audio-attachments',
  false,
  52428800,
  ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/x-wav'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "customer_audio_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "customer_audio_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "customer_audio_authenticated_delete" ON storage.objects;

-- 3. Authenticated users can read objects (playback via signed URLs from API)
CREATE POLICY "customer_audio_authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'customer-audio-attachments');

-- 4. Authenticated users can upload audio attachments
CREATE POLICY "customer_audio_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-audio-attachments');

-- 5. Authenticated users can delete attachments they manage via the app
CREATE POLICY "customer_audio_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'customer-audio-attachments');
