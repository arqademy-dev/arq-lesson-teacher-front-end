"use client";

import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { formatTime } from "./Youtube";

type Props = {
  containerId: string;
  ready: boolean;
  playing: boolean;
  current: number;
  duration: number;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onFullscreen: () => void;
};

/**
 * Goes inside a wrapper that is `relative overflow-hidden`.
 *
 * - The YouTube frame is shown at its natural size (nothing cropped).
 * - A transparent click shield sits over the whole video, so YouTube's
 *   "Watch on YouTube" button, title and related-video links can't be
 *   clicked. A tap/click just toggles play/pause.
 * - Our own controls replace YouTube's. They fade out while playing
 *   (so they never cover the picture) and show on hover or when paused.
 */
export function YouTubeShell({
  containerId,
  ready,
  playing,
  current,
  duration,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onFullscreen,
}: Props) {
  return (
    <>
      <div className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full">
        <div id={containerId} />
      </div>

      {/* Click shield */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={onTogglePlay}
      >
        {!playing && ready && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-black/50 text-white">
              <Play className="ml-0.5 h-6 w-6" />
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-black/60 px-3 py-2 transition-opacity ${
          playing
            ? "opacity-0 hover:opacity-100 focus-within:opacity-100"
            : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!ready}
          className="text-white"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        <span className="text-[11px] font-semibold tabular-nums text-white">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.5}
          value={Math.min(current, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 accent-[var(--brand)]"
          aria-label="Seek"
        />

        <button
          type="button"
          onClick={onFullscreen}
          className="text-white"
          title={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );
}