"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionRenderer } from "../interactions/InteractionRenderer";
import { submitInteraction } from "@/lib/api";
import type {
  SafeInteractiveElement,
  InteractionAnswer,
  SubmissionResult,
  SessionSubmission,
} from "../types";

/**
 * Minimal shape of the bits of the YouTube IFrame Player API we use.
 * Avoids pulling in @types/youtube just for four methods.
 */
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return shorts[1];
  } catch {
    /* ignore malformed urls */
  }
  return null;
}

type Props = {
  videoUrl: string;
  title: string;
  scheduledSessionId: string;
  elements: SafeInteractiveElement[];
  requireCorrectAnswersToProgress: boolean;
  /** Latest submission per element for this session — restores state on refresh */
  initialSubmissions?: SessionSubmission[];
};

/** How long the feedback banner stays up before the video auto-resumes. */
const AUTO_ADVANCE_DELAY_MS = 1400;
/** How often we poll getCurrentTime() — YT's API has no timeupdate event. */
const POLL_INTERVAL_MS = 400;

export function InteractiveVideoPlayer({
  videoUrl,
  title,
  scheduledSessionId,
  elements,
  requireCorrectAnswersToProgress,
  initialSubmissions = [],
}: Props) {
  const containerId = useRef(
    `yt-player-${Math.random().toString(36).slice(2)}`
  ).current;
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [results, setResults] = useState<Record<string, SubmissionResult>>(
    () => {
      const seed: Record<string, SubmissionResult> = {};
      for (const s of initialSubmissions) {
        seed[s.interactiveElementId] = {
          isCorrect: s.isCorrect,
          scoreAwarded: s.scoreAwarded,
          attemptNumber: s.attemptNumber,
        } as SubmissionResult;
      }
      return seed;
    }
  );

  // Elements that already count as "cleared" and should not re-trigger.
  const [triggered, setTriggered] = useState<Set<string>>(() => {
    const done = new Set<string>();
    for (const s of initialSubmissions) {
      if (s.isCorrect || !requireCorrectAnswersToProgress) {
        done.add(s.interactiveElementId);
      }
    }
    return done;
  });

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

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: { onReady: () => setReady(true) },
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

  // Watch playback time and trigger checkpoints in order.
  useEffect(() => {
    if (!ready || checkpoints.length === 0) return;

    pollRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (activeElementId) return; // a checkpoint is already open — hold

      const currentTime = player.getCurrentTime();
      const next = checkpoints.find(
        (e) =>
          !triggered.has(e.id) && currentTime >= (e.videoTimestampSeconds ?? 0)
      );

      if (next) {
        // Snap back to the exact checkpoint in case the student seeked past it.
        player.seekTo(next.videoTimestampSeconds ?? 0, true);
        player.pauseVideo();
        setActiveElementId(next.id);
      }
    }, POLL_INTERVAL_MS);

    return clearPoll;
  }, [ready, checkpoints, triggered, activeElementId, clearPoll]);

  function resumePlayback() {
    setActiveElementId(null);
    playerRef.current?.playVideo();
  }

  async function handleSubmit(elementId: string, answer: InteractionAnswer) {
    setSubmittingId(elementId);
    try {
      const result = (await submitInteraction({
        interactiveElementId: elementId,
        scheduledSessionId,
        response: answer as Record<string, unknown>,
      })) as SubmissionResult;

      setResults((prev) => ({ ...prev, [elementId]: result }));

      const satisfied = result.isCorrect || !requireCorrectAnswersToProgress;
      if (satisfied) {
        setTriggered((prev) => new Set(prev).add(elementId));
        advanceTimerRef.current = window.setTimeout(
          resumePlayback,
          AUTO_ADVANCE_DELAY_MS
        );
      }
      // If correctness is required and the answer was wrong, we deliberately
      // leave activeElementId set — InteractionRenderer shows the retry
      // button and handleSubmit runs again on the next attempt.
    } finally {
      setSubmittingId(null);
    }
  }

  const activeElement = checkpoints.find((e) => e.id === activeElementId);
  const activeResult = activeElement ? results[activeElement.id] : undefined;
  const activeSatisfied =
    !!activeResult &&
    (activeResult.isCorrect || !requireCorrectAnswersToProgress);

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
        {title}
      </h2>

      <div className="relative w-full overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--navy)] aspect-video">
        {videoId ? (
          <div id={containerId} className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[13px] text-white/50 font-semibold px-4 text-center">
            No video URL for this resource yet.
          </div>
        )}

        {activeElement && (
          <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-lg rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-xl p-5">
              <InteractionRenderer
                element={activeElement}
                result={activeResult}
                allowRetry={
                  requireCorrectAnswersToProgress &&
                  activeResult?.isCorrect === false
                }
                submitting={submittingId === activeElement.id}
                onSubmit={(answer) => handleSubmit(activeElement.id, answer)}
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
          {triggered.size}/{checkpoints.length} checkpoint
          {checkpoints.length === 1 ? "" : "s"} cleared
        </p>
      )}
    </div>
  );
}