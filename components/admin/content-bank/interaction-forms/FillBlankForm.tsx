"use client";
// components/admin/content-bank/interaction-forms/FillBlankForm.tsx
import { extractBlankKeys, type FillBlankAnswers, type FillBlankConfig } from "./types";

type Props = {
  config: FillBlankConfig;
  answers: FillBlankAnswers;
  onChange: (config: FillBlankConfig, answers: FillBlankAnswers) => void;
};

export function FillBlankForm({ config, answers, onChange }: Props) {
  const keys = extractBlankKeys(config.prompt_text);

  function setTemplate(prompt_text: string) {
    const nextKeys = extractBlankKeys(prompt_text);
    const dropdown_options: Record<string, string[]> = {};
    const nextAnswers: FillBlankAnswers = {};
    for (const key of nextKeys) {
      dropdown_options[key] = config.dropdown_options[key] ?? [];
      nextAnswers[key] = answers[key] ?? "";
    }
    onChange({ ...config, prompt_text, dropdown_options }, nextAnswers);
  }

  function setOptionsForKey(key: string, raw: string) {
    const options = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const dropdown_options = { ...config.dropdown_options, [key]: options };
    const currentAnswer = answers[key];
    const answer = currentAnswer && options.includes(currentAnswer) ? currentAnswer : "";
    onChange({ ...config, dropdown_options }, { ...answers, [key]: answer });
  }

  function setCorrectForKey(key: string, value: string) {
    onChange(config, { ...answers, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Template — wrap each blank in [id], e.g.{" "}
          <span className="font-mono">Water boils at [temp] degrees.</span>
        </label>
        <textarea
          value={config.prompt_text}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px] font-mono"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Blanks {keys.length === 0 && "— add a [id] token above"}
        </label>
        {keys.length > 0 && (
          <div className="space-y-3">
            {keys.map((key) => {
              const options = config.dropdown_options[key] ?? [];
              return (
                <div
                  key={key}
                  className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3 space-y-2"
                >
                  <p className="text-[11.5px] font-bold text-[var(--ink)] font-mono">
                    [{key}]
                  </p>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[var(--ink-3)] mb-1">
                      Dropdown choices shown to the student (comma-separated)
                    </label>
                    <input
                      value={options.join(", ")}
                      onChange={(e) => setOptionsForKey(key, e.target.value)}
                      placeholder="e.g. 100, 90, 50"
                      className="w-full h-8 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[var(--ink-3)] mb-1">
                      Correct choice
                    </label>
                    <select
                      value={answers[key] ?? ""}
                      onChange={(e) => setCorrectForKey(key, e.target.value)}
                      disabled={options.length === 0}
                      className="w-full h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px] disabled:opacity-50"
                    >
                      <option value="">Select…</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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