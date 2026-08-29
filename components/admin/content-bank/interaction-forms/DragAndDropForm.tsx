"use client";
// components/admin/content-bank/interaction-forms/DragAndDropForm.tsx
import { Plus, Trash2 } from "lucide-react";
import { RegionPicker } from "./RegionPicker";
import type { DragAndDropAnswers, DragAndDropConfig } from "./types";

type Props = {
  config: DragAndDropConfig;
  answers: DragAndDropAnswers;
  onChange: (config: DragAndDropConfig, answers: DragAndDropAnswers) => void;
};

export function DragAndDropForm({ config, answers, onChange }: Props) {
  function updateItem(id: string, patch: Partial<{ label: string; imageUrl: string }>) {
    onChange(
      {
        ...config,
        items: config.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      },
      answers
    );
  }

  function addItem() {
    onChange(
      { ...config, items: [...config.items, { id: crypto.randomUUID(), label: "" }] },
      answers
    );
  }

  function removeItem(id: string) {
    const { [id]: _removed, ...rest } = answers.placements;
    onChange(
      { ...config, items: config.items.filter((it) => it.id !== id) },
      { placements: rest }
    );
  }

  function setPlacement(itemId: string, zoneId: string) {
    onChange(config, { placements: { ...answers.placements, [itemId]: zoneId } });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Background image URL
        </label>
        <input
          value={config.backgroundImageUrl}
          onChange={(e) => onChange({ ...config, backgroundImageUrl: e.target.value }, answers)}
          placeholder="https://…"
          className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
        <input
          type="checkbox"
          checked={config.allowMultiplePerZone ?? false}
          onChange={(e) => onChange({ ...config, allowMultiplePerZone: e.target.checked }, answers)}
        />
        A zone can accept more than one item
      </label>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Drop zones
        </label>
        <RegionPicker
          imageUrl={config.backgroundImageUrl}
          regions={config.zones}
          shapeMode="fixed"
          fixedShape="rect"
          onChange={(zones) => onChange({ ...config, zones }, answers)}
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Draggable items
        </label>
        <div className="space-y-2">
          {config.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <input
                value={it.label}
                onChange={(e) => updateItem(it.id, { label: e.target.value })}
                placeholder="Item label"
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <input
                value={it.imageUrl ?? ""}
                onChange={(e) => updateItem(it.id, { imageUrl: e.target.value })}
                placeholder="Image URL (optional)"
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                disabled={config.items.length <= 1}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
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

      {config.zones.length === 0 ? (
        <p className="text-[12px] text-[var(--ink-3)] italic">
          Add at least one drop zone above before assigning correct placements.
        </p>
      ) : (
        <div>
          <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
            Correct zone per item
          </label>
          <div className="space-y-2">
            {config.items.map((it) => (
              <div key={it.id} className="flex items-center gap-2">
                <span className="flex-1 text-[12.5px] text-[var(--ink-2)] truncate">
                  {it.label || "(untitled item)"}
                </span>
                <select
                  value={answers.placements[it.id] ?? ""}
                  onChange={(e) => setPlacement(it.id, e.target.value)}
                  className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px]"
                >
                  <option value="">Select zone…</option>
                  {config.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.label || "(untitled zone)"}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}