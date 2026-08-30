"use client";
// components/admin/content-bank/interaction-forms/DragAndDropForm.tsx
// Flat match-the-term exercise — no image, no canvas positions.
import { Plus, Trash2 } from "lucide-react";
import type { DragAndDropAnswers, DragAndDropConfig } from "./types";

type Props = {
  config: DragAndDropConfig;
  answers: DragAndDropAnswers;
  onChange: (config: DragAndDropConfig, answers: DragAndDropAnswers) => void;
};

export function DragAndDropForm({ config, answers, onChange }: Props) {
  function updateDraggable(id: string, text: string) {
    onChange(
      { ...config, draggables: config.draggables.map((d) => (d.id === id ? { ...d, text } : d)) },
      answers
    );
  }

  function addDraggable() {
    onChange(
      { ...config, draggables: [...config.draggables, { id: crypto.randomUUID(), text: "" }] },
      answers
    );
  }

  function removeDraggable(id: string) {
    const { [id]: _removed, ...rest } = answers;
    onChange(
      { ...config, draggables: config.draggables.filter((d) => d.id !== id) },
      rest
    );
  }

  function updateDropzone(id: string, label: string) {
    onChange(
      { ...config, dropzones: config.dropzones.map((z) => (z.id === id ? { ...z, label } : z)) },
      answers
    );
  }

  function addDropzone() {
    onChange(
      { ...config, dropzones: [...config.dropzones, { id: crypto.randomUUID(), label: "" }] },
      answers
    );
  }

  function removeDropzone(id: string) {
    const nextAnswers = { ...answers };
    for (const draggableId of Object.keys(nextAnswers)) {
      if (nextAnswers[draggableId] === id) delete nextAnswers[draggableId];
    }
    onChange(
      { ...config, dropzones: config.dropzones.filter((z) => z.id !== id) },
      nextAnswers
    );
  }

  function setPlacement(draggableId: string, dropzoneId: string) {
    onChange(config, { ...answers, [draggableId]: dropzoneId });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Instructions shown to the student
        </label>
        <textarea
          value={config.instructions ?? ""}
          onChange={(e) => onChange({ ...config, instructions: e.target.value }, answers)}
          rows={2}
          placeholder="e.g. Match each term to its correct definition."
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Draggable items
        </label>
        <div className="space-y-2">
          {config.draggables.map((d) => (
            <div key={d.id} className="flex items-center gap-2">
              <input
                value={d.text}
                onChange={(e) => updateDraggable(d.id, e.target.value)}
                placeholder="Item text (e.g. a term)"
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => removeDraggable(d.id)}
                disabled={config.draggables.length <= 1}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDraggable}
          className="mt-2 inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Drop zones
        </label>
        <div className="space-y-2">
          {config.dropzones.map((z) => (
            <div key={z.id} className="flex items-center gap-2">
              <input
                value={z.label}
                onChange={(e) => updateDropzone(z.id, e.target.value)}
                placeholder="Zone label (e.g. a definition)"
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => removeDropzone(z.id)}
                disabled={config.dropzones.length <= 1}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDropzone}
          className="mt-2 inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add zone
        </button>
      </div>

      {config.dropzones.length === 0 ? (
        <p className="text-[12px] text-[var(--ink-3)] italic">
          Add at least one drop zone before assigning correct placements.
        </p>
      ) : (
        <div>
          <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
            Correct zone per item
          </label>
          <div className="space-y-2">
            {config.draggables.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="flex-1 text-[12.5px] text-[var(--ink-2)] truncate">
                  {d.text || "(untitled item)"}
                </span>
                <select
                  value={answers[d.id] ?? ""}
                  onChange={(e) => setPlacement(d.id, e.target.value)}
                  className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px]"
                >
                  <option value="">Select zone…</option>
                  {config.dropzones.map((z) => (
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