'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { customerAudioApi } from '@/lib/api-client';
import { AudioPlayer } from '@/components/audio-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatFileSize,
  type CustomerAudioAttachment,
} from '@/lib/customer-audio';
import {
  Loader2,
  Mic,
  MicOff,
  Trash2,
  Upload,
  FileAudio,
} from 'lucide-react';

type CustomerAudioSectionProps = {
  customerId: string;
  initialAttachments?: CustomerAudioAttachment[];
  onAttachmentsChange?: (attachments: CustomerAudioAttachment[]) => void;
};

export function CustomerAudioSection({
  customerId,
  initialAttachments = [],
  onAttachmentsChange,
}: CustomerAudioSectionProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [attachments, setAttachments] = useState<CustomerAudioAttachment[]>(initialAttachments);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    customerAudioApi.getAuthHeaders().then(setAuthHeaders);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  const updateAttachments = useCallback(
    (next: CustomerAudioAttachment[]) => {
      setAttachments(next);
      onAttachmentsChange?.(next);
    },
    [onAttachmentsChange]
  );

  const uploadFile = async (file: File, uploadLabel?: string) => {
    setError('');
    setUploading(true);
    try {
      const result = await customerAudioApi.upload(customerId, file, uploadLabel || label);
      updateAttachments(result.attachments);
      setLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload audio');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fileName = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        const file = new File([blob], fileName, { type: mimeType.split(';')[0] });
        await uploadFile(file, label || 'Voice recording');
        setRecordingSeconds(0);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch {
      setError('Microphone access is required to record audio.');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Remove this audio attachment?')) return;

    setDeletingId(attachmentId);
    setError('');
    try {
      const next = await customerAudioApi.delete(customerId, attachmentId);
      updateAttachments(next);
    } catch (err: any) {
      setError(err.message || 'Failed to delete audio');
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-blue-400" />
          Audio Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-slate-400">
          Upload recordings or record directly from your device. All team members can play audio back here.
          {isAdmin ? ' Administrators can also download files.' : ' Downloads are restricted to administrators.'}
        </p>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-sm">{error}</div>
        )}

        <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Label (optional)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Discovery call, voicemail follow-up"
              disabled={uploading || isRecording}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading || isRecording}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-slate-700 text-slate-200"
              disabled={uploading || isRecording}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Audio
            </Button>

            {!isRecording ? (
              <Button
                type="button"
                className="gap-2 bg-red-600/90 hover:bg-red-600 text-white"
                disabled={uploading}
                onClick={startRecording}
              >
                <Mic className="w-4 h-4" />
                Record
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-2 bg-slate-700 hover:bg-slate-600 text-white"
                onClick={stopRecording}
              >
                <MicOff className="w-4 h-4" />
                Stop ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">Supported formats: MP3, WAV, M4A, OGG, WebM, AAC, FLAC. Max 50MB.</p>
        </div>

        {attachments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/80 p-8 text-center text-slate-500 text-sm">
            No audio files attached yet.
          </div>
        ) : (
          <div className="space-y-4">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {attachment.label || attachment.file_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(attachment.size_bytes)} · {new Date(attachment.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 shrink-0"
                    disabled={deletingId === attachment.id}
                    onClick={() => handleDelete(attachment.id)}
                    aria-label="Delete attachment"
                  >
                    {deletingId === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {Object.keys(authHeaders).length > 0 && (
                  <AudioPlayer
                    src={customerAudioApi.getPlayUrl(customerId, attachment.id)}
                    fetchHeaders={authHeaders}
                    title={attachment.label || undefined}
                    subtitle={attachment.label ? attachment.file_name : undefined}
                    allowDownload={isAdmin}
                    downloadUrl={customerAudioApi.getDownloadUrl(customerId, attachment.id)}
                    downloadFileName={attachment.file_name}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
