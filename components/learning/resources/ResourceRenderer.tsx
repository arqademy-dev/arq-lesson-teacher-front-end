import type { Resource } from "../types";
import { ArticleBody } from "./ArticleBody";

type Props = {
  resource: Resource;
  onVideoTimeUpdate?: (seconds: number) => void;
};

export function ResourceRenderer({ resource, onVideoTimeUpdate }: Props) {
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
    const isYouTube =
      url.includes("youtube.com") || url.includes("youtu.be");

    return (
      <div className="space-y-3">
        <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
          {resource.title}
        </h2>
        <div className="relative w-full overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--navy)] aspect-video">
          {isYouTube ? (
            <iframe
              src={toYouTubeEmbed(url)}
              title={resource.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : url && url !== "string" ? (
            <video
              src={url}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
              onTimeUpdate={(e) =>
                onVideoTimeUpdate?.(Math.floor(e.currentTarget.currentTime))
              }
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-white/50 font-semibold px-4 text-center">
              No video URL for this resource yet.
            </div>
          )}
        </div>
        {isYouTube && (
          <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
            Video checkpoints appear below (YouTube cannot pause at exact times
            in this player).
          </p>
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
          className="w-full h-[480px] rounded-[12px] border border-[var(--line)] bg-[var(--surface)]"
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

function toYouTubeEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    /* ignore */
  }
  return url;
}