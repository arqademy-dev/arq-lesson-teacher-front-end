"use client";
// components/admin/content-bank/interaction-forms/BranchingForm.tsx
// A single decision point — a scenario, several choices, each routing to
// a feedback message via its `next` key. Not a multi-step tree.
import { Plus, Trash2 } from "lucide-react";
import type { BranchingAnswers, BranchingConfig } from "./types";

type Props = {
  config: BranchingConfig;
  answers: BranchingAnswers;
  onChange: (config: BranchingConfig, answers: BranchingAnswers) => void;
};

export function BranchingForm({ config, answers, onChange }: Props) {
  const usedKeys = Array.from(new Set(config.choices.map((c) => c.next).filter(Boolean)));

  function updateChoice(id: string, patch: Partial<{ text: string; next: string }>) {
    onChange(
      { ...config, choices: config.choices.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
      answers
    );
  }

  function addChoice() {
    const next = `outcome_${config.choices.length + 1}`;
    onChange(
      {
        ...config,
        choices: [...config.choices, { id: crypto.randomUUID(), text: "", next }],
        feedback: { ...config.feedback, [next]: config.feedback[next] ?? "" },
      },
      answers
    );
  }

  function removeChoice(id: string) {
    const removed = config.choices.find((c) => c.id === id);
    onChange(
      { ...config, choices: config.choices.filter((c) => c.id !== id) },
      { answer: answers.answer === id ? "" : answers.answer }
    );
  }

  function setFeedback(key: string, message: string) {
    onChange({ ...config, feedback: { ...config.feedback, [key]: message } }, answers);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Scenario
        </label>
        <textarea
          value={config.scenario}
          onChange={(e) => onChange({ ...config, scenario: e.target.value }, answers)}
          rows={2}
          placeholder="e.g. Which best describes photosynthesis?"
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Choices — tick the correct one
        </label>
        <div className="space-y-2">
          {config.choices.map((choice) => (
            <div
              key={choice.id}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="branch-correct"
                  checked={answers.answer === choice.id}
                  onChange={() => onChange(config, { answer: choice.id })}
                  className="flex-none"
                />
                <input
                  value={choice.text}
                  onChange={(e) => updateChoice(choice.id, { text: e.target.value })}
                  placeholder="Choice text"
                  className="flex-1 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => removeChoice(choice.id)}
                  disabled={config.choices.length <= 2}
                  className="p-1 text-[var(--danger)] disabled:opacity-30 flex-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <label className="text-[10.5px] text-[var(--ink-3)] flex-none">
                  Outcome key
                </label>
                <input
                  value={choice.next}
                  onChange={(e) => updateChoice(choice.id, { next: e.target.value })}
                  placeholder="e.g. correct_feedback"
                  className="flex-1 h-7 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[11.5px] font-mono"
                />
              </div>
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

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Feedback messages
        </label>
        {usedKeys.length === 0 ? (
          <p className="text-[12px] text-[var(--ink-3)] italic">
            Set an outcome key on a choice above to add its feedback message.
          </p>
        ) : (
          <div className="space-y-2">
            {usedKeys.map((key) => (
              <div key={key}>
                <p className="text-[10.5px] font-bold text-[var(--ink-3)] mb-1 font-mono">
                  {key}
                </p>
                <textarea
                  value={config.feedback[key] ?? ""}
                  onChange={(e) => setFeedback(key, e.target.value)}
                  rows={1}
                  placeholder="Message shown to the student for this outcome"
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}