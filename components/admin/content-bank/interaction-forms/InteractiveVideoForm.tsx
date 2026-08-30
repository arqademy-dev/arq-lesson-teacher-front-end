"use client";
// components/admin/content-bank/interaction-forms/InteractiveVideoForm.tsx
// Same single-answer pattern as MultipleChoiceForm — prompt_text + plain
// string options. Owns the timing fields directly (timestamp lives at the
// top level of InteractiveElement, but this is the one place you edit
// everything about a video interaction).
import { Plus, Trash2 } from "lucide-react";
import type { InteractiveVideoAnswers, InteractiveVideoConfig } from "./types";

type Props = {
  config: InteractiveVideoConfig;
  answers: InteractiveVideoAnswers;
  onChange: (config: InteractiveVideoConfig, answers: InteractiveVideoAnswers) => void;
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
  function updateOption(index: number, value: string) {
    const wasCorrect = config.options[index] === answers.answer && answers.answer !== "";
    const options = config.options.map((o, i) => (i === index ? value : o));
    onChange(
      { ...config, options },
      { answer: wasCorrect ? value : answers.answer }
    );
  }

  function addOption() {
    onChange({ ...config, options: [...config.options, ""] }, answers);
  }

  function removeOption(index: number) {
    const removed = config.options[index];
    onChange(
      { ...config, options: config.options.filter((_, i) => i !== index) },
      { answer: answers.answer === removed ? "" : answers.answer }
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
          value={config.prompt_text}
          onChange={(e) => onChange({ ...config, prompt_text: e.target.value }, answers)}
          rows={2}
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Options — tick the correct one
        </label>
        <div className="space-y-2">
          {config.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="iv-correct"
                checked={opt !== "" && opt === answers.answer}
                onChange={() => onChange(config, { answer: opt })}
              />
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={config.options.length <= 2}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add option
        </button>
      </div>
    </div>
  );
}