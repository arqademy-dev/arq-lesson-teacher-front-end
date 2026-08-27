/**
 * Shared YouTube IFrame Player API glue — types, script loading, and small
 * helpers used by both video players (Interactivevideoplayer.tsx and
 * SimpleYouTubePlayer.tsx).
 *
 * This must be the ONLY place that declares `Window.YT`. TypeScript
 * requires every declaration of the same global property to match by
 * exact type identity — a second copy elsewhere, even structurally
 * identical, breaks the build with "Subsequent property declarations
 * must have the same type." Both player files import from here instead
 * of redeclaring it themselves.
 */

export type YTPlayer = {
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
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** YouTube player states we care about — 0 is ENDED. */
export const YT_STATE_ENDED = 0;

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
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

export function extractYouTubeId(url: string): string | null {
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

/**
 * Fullscreen works reliably for arbitrary elements on desktop and Android
 * Chrome. iOS Safari largely restricts the Fullscreen API to actual
 * <video> elements, so on iPhone this may silently no-op — YouTube's own
 * in-player fullscreen control (still enabled, fs isn't set to 0) remains
 * the working fallback there.
 */
export function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    el.requestFullscreen?.().catch(() => {});
  }
}