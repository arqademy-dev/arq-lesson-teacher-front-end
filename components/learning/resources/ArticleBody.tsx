import type { ContentBlock } from "../types";

export function ArticleBody({ blocks }: { blocks: ContentBlock[] | null | undefined }) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-[13px] text-[var(--ink-3)] italic">
        No article content for this resource yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const Tag = (`h${block.level}` as "h1" | "h2" | "h3");
            const sizes = {
              1: "text-[20px]",
              2: "text-[17px]",
              3: "text-[15px]",
            } as const;
            return (
              <Tag
                key={i}
                className={`font-heading font-semibold text-[var(--ink)] ${sizes[block.level] ?? "text-[15px]"}`}
              >
                {block.text}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i} className="text-[14px] text-[var(--ink-2)] leading-relaxed">
                {block.text}
              </p>
            );
          case "image":
            return (
              <figure key={i} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.altText || ""}
                  className="w-full rounded-[10px] border border-[var(--line)]"
                />
                {block.caption && (
                  <figcaption className="text-[12px] text-[var(--ink-3)] text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "file":
            return (
              <a
                key={i}
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--brand)] hover:underline"
              >
                {block.fileName || "Download file"} →
              </a>
            );
          case "bullet_list":
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 text-[14px] text-[var(--ink-2)]">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}