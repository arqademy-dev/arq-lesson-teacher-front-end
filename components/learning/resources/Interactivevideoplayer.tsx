import { createPortal } from "react-dom";
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionRenderer } from "../interactions/InteractionRenderer";
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
  results: Record<string, SubmissionResult>;
  priorAnswers?: Record<string, Record<string, unknown>>;
  submittingId?: string | null;
  onSubmitElement: (elementId: string, answer: InteractionAnswer) => void;
};

const AUTO_ADVANCE_DELAY_MS = 1400; // how long "Correct" is shown
const POLL_INTERVAL_MS = 400;
const SEEK_SETTLE_MS = 1500; // pause checkpoint polling after seeking back

// Identifies one specific attempt's result, so we can tell a fresh answer
// from an old one that is still sitting in `results`.
function resultKeyOf(id: string, r?: SubmissionResult): string | null {
  if (!r) return null;
  const attempt = (r as { attemptNumber?: number }).attemptNumber ?? 0;
  return `${id}:${attempt}:${r.isCorrect}`;
}

export function InteractiveVideoPlayer({
  videoUrl,
  title,
  elements,
  requireCorrectAnswersToProgress: _requireCorrect,
  results,
  priorAnswers: _priorAnswers = {},
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
  const maxWatchedRef = useRef(0);

  const handledKeyRef = useRef<string | null>(null); // never reset on popup close
  const pollPausedUntilRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [baselineKey, setBaselineKey] = useState<string | null>(null);
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

  // Cleared only by a CORRECT answer — wrong answers force a rewatch.
  const isCleared = useCallback(
    (id: string) => results[id]?.isCorrect === true,
    [results]
  );

  const clearPoll = useCallback(() => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Player setup ──────────────────────────────────────────────
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
          controls: 0, // removes YouTube's bar, logo and "Watch on YouTube"
          disablekb: 1,
          fs: 0, // we provide our own fullscreen button
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
      clearPoll();
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, containerId, clearPoll]);

  // Keep our fullscreen icon in sync
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Progress + forward-seek guard ─────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      setDuration(p.getDuration() || 0);

      if (!ALLOW_FORWARD_SEEK && t > maxWatchedRef.current + 1.5) {
        p.seekTo(maxWatchedRef.current, true); // snap back
        setCurrent(maxWatchedRef.current);
        return;
      }
      maxWatchedRef.current = Math.max(maxWatchedRef.current, t);
      setCurrent(t);
    }, 300);
    return () => window.clearInterval(id);
  }, [ready]);

  // ── Checkpoint polling ────────────────────────────────────────
  useEffect(() => {
    if (!ready || checkpoints.length === 0) return;

    pollRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (activeElementId) return; // popup already open
      if (Date.now() < pollPausedUntilRef.current) return; // seek still settling

      const currentTime = player.getCurrentTime();
      const next = checkpoints.find(
        (e) =>
          !isCleared(e.id) && currentTime >= (e.videoTimestampSeconds ?? 0)
      );

      if (next) {
        player.seekTo(next.videoTimestampSeconds ?? 0, true);
        player.pauseVideo();
        // Whatever result exists now is stale; only a different one is a new answer.
        setBaselineKey(resultKeyOf(next.id, results[next.id]));
        setActiveElementId(next.id);
      }
    }, POLL_INTERVAL_MS);

    return clearPoll;
  }, [ready, checkpoints, isCleared, activeElementId, clearPoll, results]);

  // ── React to a FRESH answer only ──────────────────────────────
  useEffect(() => {
    if (!activeElementId) return;
    const result = results[activeElementId];
    if (!result) return;

    const key = resultKeyOf(activeElementId, result);
    if (key === baselineKey) return; // old attempt, not a new answer
    if (handledKeyRef.current === key) return;
    handledKeyRef.current = key;

    if (result.isCorrect) {
      advanceTimerRef.current = window.setTimeout(() => {
        setActiveElementId(null);
        playerRef.current?.playVideo();
      }, AUTO_ADVANCE_DELAY_MS);
    } else {
      const idx = checkpoints.findIndex((e) => e.id === activeElementId);
      const prevTs =
        idx > 0 ? checkpoints[idx - 1].videoTimestampSeconds ?? 0 : 0;

      // Same delay as a correct answer, so "Try again" is readable
      // before the popup closes and the video jumps back.
      advanceTimerRef.current = window.setTimeout(() => {
        pollPausedUntilRef.current = Date.now() + SEEK_SETTLE_MS;
        setActiveElementId(null);
        playerRef.current?.seekTo(prevTs, true);
        playerRef.current?.playVideo();
      }, AUTO_ADVANCE_DELAY_MS);
    }
  }, [results, activeElementId, checkpoints, baselineKey]);

  function handleTogglePlay() {
    const p = playerRef.current;
    if (!p || !ready || activeElementId) return; // no play/pause while a question is open
    if (playing) p.pauseVideo();
    else p.playVideo();
  }

  function handleSeek(value: number) {
    if (activeElementId) return;
    const target = ALLOW_FORWARD_SEEK
      ? value
      : Math.min(value, maxWatchedRef.current);
    playerRef.current?.seekTo(target, true);
    setCurrent(target);
  }

  const activeElement = checkpoints.find((e) => e.id === activeElementId);
  const activeResult = activeElement ? results[activeElement.id] : undefined;
  // Hide the stale result so the reopened popup is clean and submittable.
  const freshResult =
    activeElement &&
    activeResult &&
    resultKeyOf(activeElement.id, activeResult) !== baselineKey
      ? activeResult
      : undefined;

  const popup = activeElement ? (
  <div
    className={cn(
      isFullscreen ? "absolute" : "fixed",
      "inset-0 z-[100] overflow-y-auto bg-black/85 p-4 backdrop-blur-sm sm:p-8"
    )}
  >
    <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-2xl rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl sm:p-8">
        <InteractionRenderer
          key={`${activeElement.id}:${baselineKey}`}
          element={activeElement}
          result={freshResult}
          initialAnswer={null}
          allowRetry={false}
          submitting={submittingId === activeElement.id}
          onSubmit={(answer) => {
            // normalise fill_blank just in case
            if (
              activeElement.interactionType === "fill_blank" &&
              answer &&
              typeof answer === "object"
            ) {
              const keys = Object.keys(answer as Record<string, unknown>);
              if (keys.length === 1) {
                const value = String(
                  (answer as Record<string, unknown>)[keys[0]] ?? ""
                );
                onSubmitElement(activeElement.id, {
                  ...(answer as Record<string, unknown>),
                  answerText: value,
                } as InteractionAnswer);
                return;
              }
            }
            onSubmitElement(activeElement.id, answer);
          }}
        />

        {freshResult && (
          <p
            className={cn(
              "mt-3 text-center text-[13px] font-bold",
              freshResult.isCorrect
                ? "text-[var(--ok)]"
                : "text-[var(--danger)]"
            )}
          >
            {freshResult.isCorrect ? "Correct" : "Try again"}
          </p>
        )}
      </div>
    </div>
  </div>
) : null;

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
        {title}
      </h2>

      <div
        ref={wrapperRef}
        className={cn(
          "relative w-full overflow-hidden border border-[var(--line)] bg-[var(--navy)]",
          isFullscreen
            ? "h-screen w-screen rounded-none"
            : "aspect-[16/10] rounded-[12px]"
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
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onFullscreen={() => toggleFullscreen(wrapperRef.current)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-4 text-center text-[13px] font-semibold text-white/50">
            No video URL for this resource yet.
          </div>
        )}

        {/* End-of-video cover (hides YouTube suggestions) */}
        {ended && !activeElement && (
          <div className="absolute inset-0 z-30 bg-[var(--navy)] flex flex-col items-center justify-center gap-3">
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

        {/* Checkpoint popup */}
        {popup && (isFullscreen ? popup : createPortal(popup, document.body))}

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