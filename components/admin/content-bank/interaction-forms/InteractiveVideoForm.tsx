"use client";
// components/admin/content-bank/interaction-forms/InteractiveVideoForm.tsx
import { Plus, Trash2 } from "lucide-react";
import type { InteractiveVideoAnswers, InteractiveVideoConfig } from "./types";

type Props = {
  config: InteractiveVideoConfig;
  answers: InteractiveVideoAnswers;
  onChange: (config: InteractiveVideoConfig, answers: InteractiveVideoAnswers) => void;
  /** Timing lives at the top level of InteractiveElement, not in configSchema — passed
   *  through so this form can still be the one place you edit everything about a
   *  video interaction. */
  videoTimestampSeconds: string;
  pauseOnTrigger: boolean;
  onTimingChange: (videoTimestampSeconds: string, pauseOnTrigger: boolean) => void;
};

export function InteractiveVideoForm({
  config,
  answers,
  onChange,
  videoTimestampSeconds,
  pauseOnTrigger,
  onTimingChange,
}: Props) {
  function updateChoice(id: string, text: string) {
    onChange(
      { ...config, choices: config.choices.map((c) => (c.id === id ? { ...c, text } : c)) },
      answers
    );
  }

  function addChoice() {
    onChange(
      { ...config, choices: [...config.choices, { id: crypto.randomUUID(), text: "" }] },
      answers
    );
  }

  function removeChoice(id: string) {
    onChange(
      { ...config, choices: config.choices.filter((c) => c.id !== id) },
      { correctChoiceId: answers.correctChoiceId === id ? "" : answers.correctChoiceId }
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)] mb-2">
          Video timing
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
              Pop up at (seconds)
            </label>
            <input
              type="number"
              min={0}
              value={videoTimestampSeconds}
              onChange={(e) => onTimingChange(e.target.value, pauseOnTrigger)}
              placeholder="e.g. 45"
              className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
            />
          </div>
          <label className="flex items-center gap-2 mt-5 text-[12.5px] text-[var(--ink-2)]">
            <input
              type="checkbox"
              checked={pauseOnTrigger}
              onChange={(e) => onTimingChange(videoTimestampSeconds, e.target.checked)}
            />
            Pause the video when this triggers
          </label>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Prompt
        </label>
        <textarea
          value={config.prompt}
          onChange={(e) => onChange({ ...config, prompt: e.target.value }, answers)}
          rows={2}
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
        <input
          type="checkbox"
          checked={config.allowSkip ?? false}
          onChange={(e) => onChange({ ...config, allowSkip: e.target.checked }, answers)}
        />
        Allow student to skip without answering
      </label>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Choices — tick the correct one
        </label>
        <div className="space-y-2">
          {config.choices.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="iv-correct"
                checked={answers.correctChoiceId === c.id}
                onChange={() => onChange(config, { correctChoiceId: c.id })}
              />
              <input
                value={c.text}
                onChange={(e) => updateChoice(c.id, e.target.value)}
                placeholder="Choice text"
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => removeChoice(c.id)}
                disabled={config.choices.length <= 2}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addChoice}
          className="mt-2 inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add choice
        </button>
      </div>
    </div>
  );
}