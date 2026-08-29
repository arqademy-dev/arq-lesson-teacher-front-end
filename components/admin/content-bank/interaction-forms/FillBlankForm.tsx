"use client";
// components/admin/content-bank/interaction-forms/FillBlankForm.tsx
import { extractBlankIds, type FillBlankAnswers, type FillBlankConfig } from "./types";

type Props = {
  config: FillBlankConfig;
  answers: FillBlankAnswers;
  onChange: (config: FillBlankConfig, answers: FillBlankAnswers) => void;
};

export function FillBlankForm({ config, answers, onChange }: Props) {
  const detectedIds = extractBlankIds(config.template);

  function setTemplate(template: string) {
    const ids = extractBlankIds(template);
    // Keep blanks/answers in sync with whatever {{id}} tokens are
    // currently in the template — add new ones, drop removed ones.
    const blanks = ids.map(
      (id) => config.blanks.find((b) => b.id === id) ?? { id }
    );
    const nextAnswers: Record<string, string[]> = {};
    for (const id of ids) {
      nextAnswers[id] = answers.answers[id] ?? [];
    }
    onChange({ ...config, template, blanks }, { answers: nextAnswers });
  }

  function setBlankPlaceholder(id: string, placeholder: string) {
    onChange(
      {
        ...config,
        blanks: config.blanks.map((b) =>
          b.id === id ? { ...b, placeholder: placeholder || undefined } : b
        ),
      },
      answers
    );
  }

  function setAcceptedAnswers(id: string, raw: string) {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(config, { answers: { ...answers.answers, [id]: list } });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Template — wrap each blank in {"{{id}}"}, e.g.{" "}
          <span className="font-mono">
            The capital of Nigeria is {"{{c1}}"}.
          </span>
        </label>
        <textarea
          value={config.template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px] font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
        <input
          type="checkbox"
          checked={config.caseSensitive ?? false}
          onChange={(e) => onChange({ ...config, caseSensitive: e.target.checked }, answers)}
        />
        Case-sensitive grading
      </label>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Blanks {detectedIds.length === 0 && "— add a {{id}} token above"}
        </label>
        {detectedIds.length > 0 && (
          <div className="space-y-3">
            {detectedIds.map((id) => {
              const blank = config.blanks.find((b) => b.id === id);
              return (
                <div
                  key={id}
                  className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3"
                >
                  <p className="text-[11.5px] font-bold text-[var(--ink)] mb-2 font-mono">
                    {"{{" + id + "}}"}
                  </p>
                  <div className="grid gap-2">
                    <input
                      value={blank?.placeholder ?? ""}
                      onChange={(e) => setBlankPlaceholder(id, e.target.value)}
                      placeholder="Placeholder shown in the input (optional)"
                      className="h-8 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                    />
                    <input
                      value={(answers.answers[id] ?? []).join(", ")}
                      onChange={(e) => setAcceptedAnswers(id, e.target.value)}
                      placeholder="Accepted answers, comma-separated (e.g. Abuja, abuja)"
                      className="h-8 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}