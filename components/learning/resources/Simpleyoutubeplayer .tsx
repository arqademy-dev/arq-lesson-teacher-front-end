"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALLOW_FORWARD_SEEK,
  extractYouTubeId,
  loadYouTubeApi,
  toggleFullscreen,
  YT_STATE_ENDED,
  type YTPlayer,
} from "./Youtube";
import { YouTubeShell } from "./YouTubeShell";

type Props = {
  videoUrl: string;
  /** Defaults to the global ALLOW_FORWARD_SEEK setting in Youtube.ts. */
  allowForwardSeek?: boolean;
};

export function SimpleYouTubePlayer({
  videoUrl,
  allowForwardSeek = ALLOW_FORWARD_SEEK,
}: Props) {
  const containerId = useRef(
    `yt-simple-${Math.random().toString(36).slice(2)}`
  ).current;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(0);
  const videoId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setEnded(false);
    setReady(false);
    maxWatchedRef.current = 0;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            setPlaying(e.data === 1 || e.data === 3);
            setEnded(e.data === YT_STATE_ENDED);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, containerId]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Progress + forward-seek guard
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      setDuration(p.getDuration() || 0);

      if (!allowForwardSeek && t > maxWatchedRef.current + 1.5) {
        p.seekTo(maxWatchedRef.current, true); // snap back
        setCurrent(maxWatchedRef.current);
        return;
      }
      maxWatchedRef.current = Math.max(maxWatchedRef.current, t);
      setCurrent(t);
    }, 300);
    return () => window.clearInterval(id);
  }, [ready, allowForwardSeek]);

  function togglePlay() {
    const p = playerRef.current;
    if (!p || !ready) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }

  function handleSeek(value: number) {
    const target = allowForwardSeek
      ? value
      : Math.min(value, maxWatchedRef.current);
    playerRef.current?.seekTo(target, true);
    setCurrent(target);
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full overflow-hidden border border-[var(--line)] bg-[var(--navy)]",
        isFullscreen
          ? "h-screen w-screen rounded-none"
          : "aspect-video rounded-[12px]"
      )}
    >
      {videoId ? (
        <YouTubeShell
          containerId={containerId}
          ready={ready}
          playing={playing}
          current={current}
          duration={duration}
          isFullscreen={isFullscreen}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          onFullscreen={() => toggleFullscreen(wrapperRef.current)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center px-4 text-center text-[13px] font-semibold text-white/50">
          No video URL for this resource yet.
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[var(--navy)]">
          <CheckCircle2 className="h-10 w-10 text-[var(--ok)]" />
          <p className="text-[13px] font-bold text-white">Video finished</p>
          <button
            type="button"
            onClick={() => {
              setEnded(false);
              maxWatchedRef.current = 0;
              playerRef.current?.seekTo(0, true);
              playerRef.current?.playVideo();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-white/15 px-3 text-[12px] font-bold text-white hover:bg-white/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Watch again
          </button>
        </div>
      )}
    </div>
  );
}