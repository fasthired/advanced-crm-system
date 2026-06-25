'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAudioDuration, isLikelyUnsupportedPlaybackMime } from '@/lib/customer-audio';

type AudioPlayerProps = {
  src: string;
  /** Bearer token for authenticated play URLs (required for HTML audio on mobile). */
  authToken?: string;
  fetchHeaders?: Record<string, string>;
  mimeType?: string;
  title?: string;
  subtitle?: string;
  allowDownload?: boolean;
  downloadUrl?: string;
  downloadFileName?: string;
  className?: string;
};

function buildAuthenticatedSrc(src: string, authToken: string): string {
  const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('access_token', authToken);
  return `${url.pathname}${url.search}`;
}

export function AudioPlayer({
  src,
  authToken,
  fetchHeaders,
  mimeType,
  title,
  subtitle,
  allowDownload = false,
  downloadUrl,
  downloadFileName,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const playbackSrc = useMemo(() => {
    if (authToken) return buildAuthenticatedSrc(src, authToken);
    return src;
  }, [src, authToken]);

  const formatError = useMemo(() => {
    if (!mimeType || !isLikelyUnsupportedPlaybackMime(mimeType)) return null;
    return 'This audio format is not supported on this device. Try downloading on desktop or re-upload as MP3/M4A.';
  }, [mimeType]);

  useEffect(() => {
    if (formatError) {
      setError(formatError);
      setLoading(false);
    }
  }, [formatError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || formatError) return;

    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    audio.src = playbackSrc;
    audio.load();

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
    };
    const onCanPlay = () => setLoading(false);
    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(audio.currentTime);
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setLoading(false);
      setError(
        mimeType && isLikelyUnsupportedPlaybackMime(mimeType)
          ? 'This audio format is not supported on this device. Try MP3 or M4A instead.'
          : 'Unable to play audio on this device'
      );
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.pause();
    };
  }, [playbackSrc, isSeeking, formatError, mimeType]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || loading || formatError) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      audio.load();
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setError('Tap play again to start audio');
      });
    }
  };

  const seekToClientX = useCallback(
    (clientX: number) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const nextTime = ratio * duration;
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration]
  );

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    seekToClientX(event.clientX);
  };

  const handleProgressPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    seekToClientX(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleProgressPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeeking) return;
    seekToClientX(event.clientX);
  };

  const handleProgressPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsSeeking(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleDownload = async () => {
    if (!allowDownload || !downloadUrl || !fetchHeaders) return;

    setDownloading(true);
    try {
      const response = await fetch(downloadUrl, { headers: fetchHeaders });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = downloadFileName || 'recording';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" playsInline />

      {(title || subtitle) && (
        <div className="mb-3 min-w-0">
          {title && <p className="text-sm font-medium text-white truncate">{title}</p>}
          {subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading audio...
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 py-2">{error}</p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div
              ref={progressRef}
              className="relative h-2 rounded-full bg-slate-700/80 cursor-pointer group touch-none"
              onClick={handleProgressClick}
              onPointerDown={handleProgressPointerDown}
              onPointerMove={handleProgressPointerMove}
              onPointerUp={handleProgressPointerUp}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              aria-label="Seek audio"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
            <div className="flex justify-between text-[11px] tabular-nums text-slate-400">
              <span>{formatAudioDuration(currentTime)}</span>
              <span>{formatAudioDuration(duration)}</span>
            </div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8 text-slate-400 hover:text-white shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {allowDownload && downloadUrl && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleDownload}
              disabled={downloading}
              className="h-8 w-8 text-slate-400 hover:text-emerald-400 shrink-0"
              aria-label="Download audio"
              title="Download (admin only)"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
