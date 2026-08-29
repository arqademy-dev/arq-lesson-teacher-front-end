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
  function updateOption(id: string, text: string, imageUrl: string) {
    onChange(
      {
        ...config,
        options: config.options.map((o) =>
          o.id === id ? { ...o, text, imageUrl: imageUrl || undefined } : o
        ),
      },
      answers
    );
  }

  function addOption() {
    onChange(
      {
        ...config,
        options: [...config.options, { id: crypto.randomUUID(), text: "" }],
      },
      answers
    );
  }

  function removeOption(id: string) {
    onChange(
      { ...config, options: config.options.filter((o) => o.id !== id) },
      { correctOptionIds: answers.correctOptionIds.filter((oid) => oid !== id) }
    );
  }

  function toggleCorrect(id: string) {
    const isCorrect = answers.correctOptionIds.includes(id);
    if (config.allowMultiple) {
      onChange(config, {
        correctOptionIds: isCorrect
          ? answers.correctOptionIds.filter((oid) => oid !== id)
          : [...answers.correctOptionIds, id],
      });
    } else {
      onChange(config, { correctOptionIds: isCorrect ? [] : [id] });
    }
  }

  function setAllowMultiple(allowMultiple: boolean) {
    // Switching to single-answer mode with 2+ correct options would be an
    // inconsistent state, so trim down to the first one.
    onChange(
      { ...config, allowMultiple },
      allowMultiple
        ? answers
        : { correctOptionIds: answers.correctOptionIds.slice(0, 1) }
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
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={config.allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
          />
          Allow multiple correct answers
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={config.shuffleOptions ?? false}
            onChange={(e) => onChange({ ...config, shuffleOptions: e.target.checked }, answers)}
          />
          Shuffle options for students
        </label>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Options — tick the correct one{config.allowMultiple ? "(s)" : ""}
        </label>
        <div className="space-y-2">
          {config.options.map((opt) => (
            <div key={opt.id} className="flex items-start gap-2">
              <input
                type={config.allowMultiple ? "checkbox" : "radio"}
                name="mc-correct"
                checked={answers.correctOptionIds.includes(opt.id)}
                onChange={() => toggleCorrect(opt.id)}
                className="mt-2.5"
              />
              <div className="flex-1 grid gap-1.5">
                <input
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value, opt.imageUrl ?? "")}
                  placeholder="Option text"
                  className="h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
                />
                <input
                  value={opt.imageUrl ?? ""}
                  onChange={(e) => updateOption(opt.id, opt.text, e.target.value)}
                  placeholder="Image URL (optional)"
                  className="h-8 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[11.5px]"
                />
              </div>
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                disabled={config.options.length <= 2}
                className="p-1.5 text-[var(--danger)] disabled:opacity-30 mt-1"
                title={
                  config.options.length <= 2
                    ? "At least 2 options required"
                    : "Remove option"
                }
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