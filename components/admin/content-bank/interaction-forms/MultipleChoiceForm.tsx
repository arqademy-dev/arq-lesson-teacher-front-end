"use client";
// components/admin/content-bank/interaction-forms/MultipleChoiceForm.tsx
import { Plus, Trash2 } from "lucide-react";
import type { MultipleChoiceAnswers, MultipleChoiceConfig } from "./types";

type Props = {
  config: MultipleChoiceConfig;
  answers: MultipleChoiceAnswers;
  onChange: (config: MultipleChoiceConfig, answers: MultipleChoiceAnswers) => void;
};

export function MultipleChoiceForm({ config, answers, onChange }: Props) {
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
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Question
        </label>
        <textarea
          value={config.question}
          onChange={(e) => onChange({ ...config, question: e.target.value }, answers)}
          rows={2}
          placeholder="e.g. What does the digit 0 represent?"
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
                name="mc-correct"
                checked={opt !== "" && opt === answers.answer}
                onChange={() => onChange(config, { answer: opt })}
                className="flex-none"
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
                className="p-1.5 text-[var(--danger)] disabled:opacity-30 flex-none"
                title={config.options.length <= 2 ? "At least 2 options required" : "Remove option"}
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