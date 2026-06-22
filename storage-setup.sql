-- Supabase Storage Configuration for Call Recordings
-- Run this SQL in your Supabase SQL Editor to create the bucket and set permissions

-- 1. Create the call-recordings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings', 
  'call-recordings', 
  true, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated users to read recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own recordings" ON storage.objects;

-- 3. Policy to allow authenticated users to read/play call recordings
CREATE POLICY "Allow authenticated users to read recordings" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'call-recordings');

-- 4. Policy to allow authenticated users to upload call recordings
CREATE POLICY "Allow authenticated users to upload recordings" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'call-recordings');

-- 5. Policy to allow authenticated users to delete call recordings
CREATE POLICY "Allow authenticated users to delete own recordings" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'call-recordings');
