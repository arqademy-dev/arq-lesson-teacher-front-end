"use client";
// components/admin/content-bank/ContentBlockEditor.tsx
import { useState } from "react";
import {
  updateResource,
  type ContentBlock,
  type ContentBlockBulletList,
  type ContentBlockFile,
  type ContentBlockHeading,
  type ContentBlockImage,
  type ContentBlockParagraph,
} from "@/lib/api";
import { X, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

type Props = {
  resourceId: string;
  initialBlocks: ContentBlock[];
  onClose: () => void;
  onSaved: (blocks: ContentBlock[]) => void;
};

const BLOCK_LABELS: Record<ContentBlock["type"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  file: "File",
  bullet_list: "Bullet list",
};

function newBlock(type: ContentBlock["type"]): ContentBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "image":
      return { type: "image", url: "", altText: "", caption: "" };
    case "file":
      return { type: "file", url: "", fileName: "", mimeType: "" };
    case "bullet_list":
      return { type: "bullet_list", items: [""] };
  }
}

export function ContentBlockEditor({
  resourceId,
  initialBlocks,
  onClose,
  onSaved,
}: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, next: ContentBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? next : b)));
  }

  function remove(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function add(type: ContentBlock["type"]) {
    setBlocks((prev) => [...prev, newBlock(type)]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateResource(resourceId, { contentBody: blocks });
      onSaved(blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line-soft)]">
          <p className="font-heading text-[14px] font-semibold">
            Article content
          </p>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--ink-3)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {blocks.length === 0 && (
            <p className="text-[12.5px] text-[var(--ink-3)] text-center py-6">
              No content blocks yet — add one below.
            </p>
          )}

          {blocks.map((block, i) => (
            <div
              key={i}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                  {BLOCK_LABELS[block.type]}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="p-1 text-[var(--ink-3)]">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="p-1 text-[var(--ink-3)]">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(i)} className="p-1 text-[var(--danger)]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {block.type === "heading" && (
                <div className="flex gap-2">
                  <select
                    value={block.level}
                    onChange={(e) =>
                      update(i, {
                        ...block,
                        level: Number(e.target.value) as 1 | 2 | 3,
                      } as ContentBlockHeading)
                    }
                    className="h-9 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                  >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <input
                    value={block.text}
                    onChange={(e) =>
                      update(i, { ...block, text: e.target.value } as ContentBlockHeading)
                    }
                    placeholder="Heading text"
                    className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                  />
                </div>
              )}

              {block.type === "paragraph" && (
                <textarea
                  value={block.text}
                  onChange={(e) =>
                    update(i, { ...block, text: e.target.value } as ContentBlockParagraph)
                  }
                  placeholder="Paragraph text"
                  rows={3}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                />
              )}

              {block.type === "image" && (
                <div className="grid gap-2">
                  <input
                    value={block.url}
                    onChange={(e) =>
                      update(i, { ...block, url: e.target.value } as ContentBlockImage)
                    }
                    placeholder="Image URL (from upload)"
                    className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={block.altText ?? ""}
                      onChange={(e) =>
                        update(i, { ...block, altText: e.target.value } as ContentBlockImage)
                      }
                      placeholder="Alt text"
                      className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                    />
                    <input
                      value={block.caption ?? ""}
                      onChange={(e) =>
                        update(i, { ...block, caption: e.target.value } as ContentBlockImage)
                      }
                      placeholder="Caption"
                      className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                    />
                  </div>
                </div>
              )}

              {block.type === "file" && (
                <div className="grid gap-2">
                  <input
                    value={block.url}
                    onChange={(e) =>
                      update(i, { ...block, url: e.target.value } as ContentBlockFile)
                    }
                    placeholder="File URL (from upload)"
                    className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={block.fileName ?? ""}
                      onChange={(e) =>
                        update(i, { ...block, fileName: e.target.value } as ContentBlockFile)
                      }
                      placeholder="File name"
                      className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                    />
                    <input
                      value={block.mimeType ?? ""}
                      onChange={(e) =>
                        update(i, { ...block, mimeType: e.target.value } as ContentBlockFile)
                      }
                      placeholder="MIME type"
                      className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                    />
                  </div>
                </div>
              )}

              {block.type === "bullet_list" && (
                <textarea
                  value={block.items.join("\n")}
                  onChange={(e) =>
                    update(i, {
                      ...block,
                      items: e.target.value.split("\n"),
                    } as ContentBlockBulletList)
                  }
                  placeholder={"One item per line"}
                  rows={4}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(BLOCK_LABELS) as ContentBlock["type"][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => add(t)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
              >
                <Plus className="w-3.5 h-3.5" />
                {BLOCK_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="px-5 text-[12px] font-semibold text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--line-soft)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-[8px] text-[12.5px] font-semibold text-[var(--ink-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save content
          </button>
        </div>
      </div>
    </div>
  );
}