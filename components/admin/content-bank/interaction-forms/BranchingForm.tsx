"use client";
// components/admin/content-bank/interaction-forms/BranchingForm.tsx
import { Plus, Trash2 } from "lucide-react";
import type { BranchingAnswers, BranchingConfig, BranchingStep } from "./types";

type Props = {
  config: BranchingConfig;
  answers: BranchingAnswers;
  onChange: (config: BranchingConfig, answers: BranchingAnswers) => void;
};

export function BranchingForm({ config, answers, onChange }: Props) {
  function updateStep(id: string, patch: Partial<BranchingStep>) {
    onChange(
      { ...config, steps: config.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
      answers
    );
  }

  function addStep() {
    const step: BranchingStep = {
      id: crypto.randomUUID(),
      prompt: "",
      choices: [{ id: crypto.randomUUID(), text: "", nextStepId: null }],
    };
    onChange({ ...config, steps: [...config.steps, step] }, answers);
  }

  function removeStep(id: string) {
    // Clear any choice that pointed at the removed step, and reset the
    // start step if it was the one removed.
    const steps = config.steps
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        choices: s.choices.map((c) => (c.nextStepId === id ? { ...c, nextStepId: null } : c)),
      }));
    onChange(
      {
        ...config,
        steps,
        startStepId: config.startStepId === id ? steps[0]?.id ?? "" : config.startStepId,
      },
      { idealPath: [] } // path is no longer trustworthy once the tree changes shape
    );
  }

  function updateChoice(stepId: string, choiceId: string, patch: Partial<{ text: string; nextStepId: string | null }>) {
    onChange(
      {
        ...config,
        steps: config.steps.map((s) =>
          s.id === stepId
            ? { ...s, choices: s.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)) }
            : s
        ),
      },
      { idealPath: [] }
    );
  }

  function addChoice(stepId: string) {
    onChange(
      {
        ...config,
        steps: config.steps.map((s) =>
          s.id === stepId
            ? { ...s, choices: [...s.choices, { id: crypto.randomUUID(), text: "", nextStepId: null }] }
            : s
        ),
      },
      answers
    );
  }

  function removeChoice(stepId: string, choiceId: string) {
    onChange(
      {
        ...config,
        steps: config.steps.map((s) =>
          s.id === stepId ? { ...s, choices: s.choices.filter((c) => c.id !== choiceId) } : s
        ),
      },
      { idealPath: answers.idealPath.filter((cid) => cid !== choiceId) }
    );
  }

  // --- Ideal path builder ---
  // Walk the path so far: start at startStepId, follow each chosen ideal
  // choice's nextStepId, and show a "pick the ideal choice" selector at
  // each step reached, until a choice with nextStepId === null ends it.
  function stepById(id: string) {
    return config.steps.find((s) => s.id === id);
  }

  const walk: { step: BranchingStep; chosenChoiceId: string | null }[] = [];
  let cursor: string | undefined = config.startStepId;
  let guard = 0;
  while (cursor && guard < config.steps.length + 1) {
    guard++;
    const step = stepById(cursor);
    if (!step) break;
    const chosenChoiceId = answers.idealPath[walk.length] ?? null;
    walk.push({ step, chosenChoiceId });
    if (!chosenChoiceId) break; // path not decided past this point yet
    const chosen = step.choices.find((c) => c.id === chosenChoiceId);
    if (!chosen || chosen.nextStepId === null) break; // scenario ends here
    cursor = chosen.nextStepId;
  }

  function setIdealChoiceAt(depth: number, choiceId: string) {
    onChange(config, { idealPath: [...answers.idealPath.slice(0, depth), choiceId] });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Start step
        </label>
        <select
          value={config.startStepId}
          onChange={(e) => onChange({ ...config, startStepId: e.target.value }, { idealPath: [] })}
          className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        >
          {config.steps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.prompt || "(untitled step)"}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {config.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                Step
              </span>
              <button
                type="button"
                onClick={() => removeStep(step.id)}
                disabled={config.steps.length <= 1}
                className="p-1 text-[var(--danger)] disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              value={step.prompt}
              onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
              placeholder="Scenario / prompt text for this step"
              rows={2}
              className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px]"
            />
            <input
              value={step.imageUrl ?? ""}
              onChange={(e) => updateStep(step.id, { imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full h-8 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[11.5px]"
            />

            <div className="space-y-1.5 pt-1">
              {step.choices.map((choice) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <input
                    value={choice.text}
                    onChange={(e) => updateChoice(step.id, choice.id, { text: e.target.value })}
                    placeholder="Choice text"
                    className="flex-1 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                  />
                  <select
                    value={choice.nextStepId ?? ""}
                    onChange={(e) =>
                      updateChoice(step.id, choice.id, {
                        nextStepId: e.target.value || null,
                      })
                    }
                    className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                  >
                    <option value="">Ends scenario</option>
                    {config.steps
                      .filter((s) => s.id !== step.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          → {s.prompt || "(untitled step)"}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeChoice(step.id, choice.id)}
                    disabled={step.choices.length <= 1}
                    className="p-1 text-[var(--danger)] disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChoice(step.id)}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-[6px] border border-[var(--line)] text-[11px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface)]"
              >
                <Plus className="w-3 h-3" />
                Add choice
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addStep}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
      >
        <Plus className="w-3.5 h-3.5" />
        Add step
      </button>

      <div className="pt-2 border-t border-[var(--line-soft)]">
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-2">
          Ideal path — pick the recommended choice at each step
        </label>
        <div className="space-y-2">
          {walk.map((w, depth) => (
            <div key={w.step.id} className="flex items-center gap-2">
              <span className="text-[11.5px] text-[var(--ink-3)] w-14 flex-none">
                Step {depth + 1}
              </span>
              <select
                value={w.chosenChoiceId ?? ""}
                onChange={(e) => setIdealChoiceAt(depth, e.target.value)}
                className="flex-1 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px]"
              >
                <option value="">Pick the ideal choice…</option>
                {w.step.choices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.text || "(untitled choice)"}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {walk.length > 0 && walk[walk.length - 1].chosenChoiceId && (
            <p className="text-[11.5px] text-[var(--ink-3)] italic">
              Path complete — this choice ends the scenario.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}