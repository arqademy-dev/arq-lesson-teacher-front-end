"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionRenderer } from "../interactions/InteractionRenderer";
import { CheckCircle2, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  extractYouTubeId,
  loadYouTubeApi,
  toggleFullscreen,
  YT_STATE_ENDED,
  type YTPlayer,
} from "./Youtube";
import type {
  SafeInteractiveElement,
  InteractionAnswer,
  SubmissionResult,
} from "../types";

export { extractYouTubeId };

type Props = {
  videoUrl: string;
  title: string;
  elements: SafeInteractiveElement[];
  requireCorrectAnswersToProgress: boolean;
  /** Owned by the session page — single source of truth for what's answered. */
  results: Record<string, SubmissionResult>;
  priorAnswers?: Record<string, Record<string, unknown>>;
  submittingId?: string | null;
  onSubmitElement: (elementId: string, answer: InteractionAnswer) => void;
};

/** How long the feedback banner stays up before the video auto-resumes. */
const AUTO_ADVANCE_DELAY_MS = 1400;
/** How often we poll getCurrentTime() — YT's API has no timeupdate event. */
const POLL_INTERVAL_MS = 400;

export function InteractiveVideoPlayer({
  videoUrl,
  title,
  elements,
  requireCorrectAnswersToProgress,
  results,
  priorAnswers = {},
  submittingId = null,
  onSubmitElement,
}: Props) {
  const containerId = useRef(
    `yt-player-${Math.random().toString(36).slice(2)}`
  ).current;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

  const checkpoints = useMemo(
    () =>
      elements
        .filter((e) => typeof e.videoTimestampSeconds === "number")
        .sort(
          (a, b) =>
            (a.videoTimestampSeconds ?? 0) - (b.videoTimestampSeconds ?? 0)
        ),
    [elements]
  );

  const isCleared = useCallback(
    (id: string) => {
      const r = results[id];
      return !!r && (r.isCorrect || !requireCorrectAnswersToProgress);
    },
    [results, requireCorrectAnswersToProgress]
  );

  const clearPoll = useCallback(() => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Set up the YT player once per video.
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
          onReady: () => setReady(true),
          onStateChange: (e) => setEnded(e.data === YT_STATE_ENDED),
        },
      });
    });

    return () => {
      cancelled = true;
      clearPoll();
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, containerId, clearPoll]);

  // Keep our fullscreen icon in sync (also handles the user pressing Esc).
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Watch playback time and trigger checkpoints in order.
  useEffect(() => {
    if (!ready || checkpoints.length === 0) return;

    pollRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (activeElementId) return; // a checkpoint is already open — hold

      const currentTime = player.getCurrentTime();
      const next = checkpoints.find(
        (e) => !isCleared(e.id) && currentTime >= (e.videoTimestampSeconds ?? 0)
      );

      if (next) {
        // Snap back to the exact checkpoint in case the student seeked past it.
        player.seekTo(next.videoTimestampSeconds ?? 0, true);
        player.pauseVideo();
        setActiveElementId(next.id);
      }
    }, POLL_INTERVAL_MS);

    return clearPoll;
  }, [ready, checkpoints, isCleared, activeElementId, clearPoll]);

  // React to the parent's results updating (i.e. handleSubmit resolved).
  useEffect(() => {
    if (!activeElementId) return;
    if (!isCleared(activeElementId)) return; // still wrong + must retry — stay paused

    advanceTimerRef.current = window.setTimeout(() => {
      setActiveElementId(null);
      playerRef.current?.playVideo();
    }, AUTO_ADVANCE_DELAY_MS);

    return () => {
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, [results, activeElementId, isCleared]);

  const activeElement = checkpoints.find((e) => e.id === activeElementId);
  const activeResult = activeElement ? results[activeElement.id] : undefined;
  const activeSatisfied = !!activeElement && isCleared(activeElement.id);

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
        {title}
      </h2>

      <div
        ref={wrapperRef}
        className={cn(
          "relative w-full overflow-hidden border border-[var(--line)] bg-[var(--navy)]",
          isFullscreen ? "h-screen w-screen rounded-none" : "aspect-video rounded-[12px]"
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

        {/* Opaque cover once the video ends — this is what hides YouTube's
            end-screen "suggested videos" grid, since nothing built into
            the IFrame API can disable it directly anymore. */}
        {ended && !activeElement && (
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

        {activeElement && (
          <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-lg rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-xl p-5">
              <InteractionRenderer
                element={activeElement}
                result={activeResult}
                initialAnswer={priorAnswers[activeElement.id] ?? null}
                allowRetry={
                  requireCorrectAnswersToProgress &&
                  activeResult?.isCorrect === false
                }
                submitting={submittingId === activeElement.id}
                onSubmit={(answer) =>
                  onSubmitElement(activeElement.id, answer)
                }
              />
              {activeSatisfied && (
                <p className="mt-3 text-[11.5px] font-semibold text-[var(--ink-4)]">
                  Resuming…
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {checkpoints.length > 0 && (
        <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
          {checkpoints.filter((c) => isCleared(c.id)).length}/
          {checkpoints.length} checkpoint
          {checkpoints.length === 1 ? "" : "s"} cleared
        </p>
      )}
    </div>
  );
}