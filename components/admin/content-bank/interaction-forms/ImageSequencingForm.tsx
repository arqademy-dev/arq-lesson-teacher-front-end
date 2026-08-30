"use client";
// components/admin/content-bank/interaction-forms/ImageSequencingForm.tsx
// Items only need text — an image is optional despite the type's name.
// The arranged order IS the correct order.
import { ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ImageSequencingConfig } from "./types";

type Props = {
  config: ImageSequencingConfig;
  // correctAnswers.order is derived from items[] order at save time, so
  // this form only ever touches config.
  onChange: (config: ImageSequencingConfig) => void;
};

export function ImageSequencingForm({ config, onChange }: Props) {
  function updateItem(id: string, patch: Partial<{ text: string; imageUrl: string }>) {
    onChange({
      ...config,
      items: config.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  }

  function addItem() {
    onChange({ ...config, items: [...config.items, { id: crypto.randomUUID(), text: "" }] });
  }

  function removeItem(id: string) {
    onChange({ ...config, items: config.items.filter((it) => it.id !== id) });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= config.items.length) return;
    const next = [...config.items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...config, items: next });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Instructions shown to the student
        </label>
        <textarea
          value={config.instructions ?? ""}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
          rows={2}
          placeholder="e.g. Put these steps in the correct order"
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Items — arrange in the correct order (top = first)
        </label>
        <div className="space-y-2">
          {config.items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-2 py-2"
            >
              <span className="w-5 text-center text-[11.5px] font-bold text-[var(--ink-3)] flex-none">
                {i + 1}
              </span>
              <div className="flex-1 grid gap-1.5 min-w-0">
                <input
                  value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })}
                  placeholder="Item text"
                  className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                />
                <input
                  value={item.imageUrl ?? ""}
                  onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                  placeholder="Image URL (optional)"
                  className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[11.5px]"
                />
              </div>
              <div className="flex flex-col flex-none">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-[var(--ink-3)] disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === config.items.length - 1}
                  className="p-1 text-[var(--ink-3)] disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={config.items.length <= 2}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30 flex-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>
    </div>
  );
}