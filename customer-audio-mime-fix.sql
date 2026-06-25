-- Fix: expand allowed MIME types on the customer audio bucket
-- Run this if AAC or other audio uploads fail at the storage layer.
-- Safe to re-run.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
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
  'application/octet-stream'
]
WHERE id = 'customer-audio-attachments';
