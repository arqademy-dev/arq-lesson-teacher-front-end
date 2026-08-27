import type { Resource, SubmissionResult, InteractionAnswer } from "../types";
import { ArticleBody } from "./ArticleBody";
import { InteractiveVideoPlayer } from "./Interactivevideoplayer";
import { SimpleYouTubePlayer } from "./Simpleyoutubeplayer ";

type Props = {
  resource: Resource;
  requireCorrectAnswersToProgress: boolean;
  /** Only consumed for video resources with timestamped checkpoints. */
  results: Record<string, SubmissionResult>;
  priorAnswers?: Record<string, Record<string, unknown>>;
  submittingId?: string | null;
  onSubmitElement: (elementId: string, answer: InteractionAnswer) => void;
  onVideoTimeUpdate?: (seconds: number) => void;
};

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes(".pdf");
}

/**
 * True when this resource's interactive elements should render as
 * timestamp-triggered popups inside the video player itself, rather
 * than as a separate list underneath it. Callers (the session page)
 * use this to decide whether to skip their own elements list for the
 * active resource.
 */
export function resourceHasVideoCheckpoints(
  resource: Pick<Resource, "resourceType" | "urlOrPath" | "interactiveElements">
): boolean {
  if (resource.resourceType !== "video") return false;
  if (!isYouTubeUrl(resource.urlOrPath || "")) return false;
  return (resource.interactiveElements ?? []).some(
    (e) => typeof e.videoTimestampSeconds === "number"
  );
}

export function ResourceRenderer({
  resource,
  requireCorrectAnswersToProgress,
  results,
  priorAnswers,
  submittingId,
  onSubmitElement,
  onVideoTimeUpdate,
}: Props) {
  const type = resource.resourceType;

  if (type === "article") {
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>
        <ArticleBody
          blocks={
            resource.contentBody as Parameters<typeof ArticleBody>[0]["blocks"]
          }
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resource.urlOrPath}
          alt={resource.title}
          className="w-full rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)]"
        />
      </div>
    );
  }

  if (type === "video") {
    const url = resource.urlOrPath || "";

    // Timestamped YouTube checkpoints → hand off to the interactive player,
    // which owns pause/resume and popup timing but reports every answer
    // back through onSubmitElement so it lands in the page's own results.
    if (resourceHasVideoCheckpoints(resource)) {
      return (
        <InteractiveVideoPlayer
          videoUrl={url}
          title={resource.title}
          elements={resource.interactiveElements ?? []}
          requireCorrectAnswersToProgress={requireCorrectAnswersToProgress}
          results={results}
          priorAnswers={priorAnswers}
          submittingId={submittingId}
          onSubmitElement={onSubmitElement}
        />
      );
    }

    const isYouTube = isYouTubeUrl(url);
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>
        {isYouTube ? (
          <SimpleYouTubePlayer videoUrl={url} />
        ) : url && url !== "string" ? (
          <div className="relative w-full overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--navy)] aspect-video">
            <video
              src={url}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
              onTimeUpdate={(e) =>
                onVideoTimeUpdate?.(Math.floor(e.currentTarget.currentTime))
              }
            />
          </div>
        ) : (
          <div className="relative w-full overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--navy)] aspect-video">
            <div className="absolute inset-0 grid place-items-center text-[13px] text-white/50 font-semibold px-4 text-center">
              No video URL for this resource yet.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>
        <iframe
          src={resource.urlOrPath}
          title={resource.title}
          className="w-full h-[420px] sm:h-[480px] rounded-[12px] border border-[var(--line)] bg-[var(--surface)]"
        />
        <a
          href={resource.urlOrPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12.5px] font-bold text-[var(--brand)] hover:underline"
        >
          Open PDF in new tab →
        </a>
      </div>
    );
  }

  if (type === "submission") {
    const url = resource.urlOrPath || "";
    const hasUrl = !!url && url !== "string";
    const isYouTube = hasUrl && isYouTubeUrl(url);
    const isPdf = hasUrl && !isYouTube && isPdfUrl(url);

    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>

        {isYouTube && <SimpleYouTubePlayer videoUrl={url} />}

        {isPdf && (
          <div className="space-y-2">
            <iframe
              src={url}
              title={resource.title}
              className="w-full h-[380px] sm:h-[420px] rounded-[12px] border border-[var(--line)] bg-[var(--surface)]"
            />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-bold text-[var(--brand)] hover:underline"
            >
              Open PDF in new tab →
            </a>
          </div>
        )}

        <p className="text-[13px] text-[var(--ink-3)]">
          Upload your work for today below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
        {resource.title}
      </h2>
      <p className="text-[13px] text-[var(--ink-3)]">
        {type === "quiz"
          ? "Answer the questions below."
          : type === "interactive"
            ? "Complete the activities below."
            : `Resource type: ${type}`}
      </p>
    </div>
  );
}