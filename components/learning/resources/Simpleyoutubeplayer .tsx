"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  extractYouTubeId,
  loadYouTubeApi,
  toggleFullscreen,
  YT_STATE_ENDED,
  type YTPlayer,
} from "./Youtube";

type Props = {
  videoUrl: string;
};

/**
 * Plain YouTube playback — no interactive checkpoints. Still drives the
 * real IFrame Player API (not a bare <iframe src>) so we can cover the
 * end-of-video "suggested videos" grid and offer a real fullscreen toggle,
 * same as the checkpoint player.
 */
export function SimpleYouTubePlayer({ videoUrl }: Props) {
  const containerId = useRef(
    `yt-simple-${Math.random().toString(36).slice(2)}`
  ).current;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const videoId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

  const [ended, setEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setEnded(false);

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => setEnded(e.data === YT_STATE_ENDED),
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
        <div id={containerId} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[13px] text-white/50 font-semibold px-4 text-center">
          No video URL for this resource yet.
        </div>
      )}

      {videoId && (
        <button
          type="button"
          onClick={() => toggleFullscreen(wrapperRef.current)}
          className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white grid place-items-center backdrop-blur-sm"
          title={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      )}

      {ended && (
        <div className="absolute inset-0 z-10 bg-[var(--navy)] flex flex-col items-center justify-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-[var(--ok)]" />
          <p className="text-[13px] font-bold text-white">Video finished</p>
          <button
            type="button"
            onClick={() => {
              setEnded(false);
              playerRef.current?.seekTo(0, true);
              playerRef.current?.playVideo();
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12px] font-bold bg-white/15 hover:bg-white/25 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Watch again
          </button>
        </div>
      )}
    </div>
  );
}