"use client";

import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createInteractiveElement,
  updateInteractiveElement,
  type InteractiveElement,
  type InteractionType,
  type ResourceType,
} from "@/lib/api";

type Props = {
  resourceId: string;
  resourceType?: ResourceType;
  element?: InteractiveElement | null;
  onClose: () => void;
  onSaved: () => void;
};

/** Safe extract — never crashes on undefined */
function extractBlankKeys(promptText: string | undefined | null): string[] {
  if (!promptText || typeof promptText !== "string") return [];
  const matches = promptText.match(/\[(.*?)\]/g) ?? [];
  const keys = matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  return Array.from(new Set(keys));
}

type McState = {
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
};

type FbState = {
  prompt_text: string;
  /** key → list of dropdown choices */
  dropdown_options: Record<string, string[]>;
  /** key → correct choice */
  answers: Record<string, string>;
};

function defaultMc(): McState {
  return {
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    feedback: "",
  };
}

function defaultFb(): FbState {
  return {
    prompt_text: "",
    dropdown_options: {},
    answers: {},
  };
}

function loadMc(el: InteractiveElement): McState {
  const cfg = (el.configSchema ?? {}) as Record<string, unknown>;
  const ans = (el.correctAnswers ?? {}) as Record<string, unknown>;
  const options = Array.isArray(cfg.options)
    ? (cfg.options as string[]).concat(["", "", "", ""]).slice(0, 4)
    : ["", "", "", ""];
  return {
    question: String(cfg.prompt ?? cfg.question ?? ""),
    options,
    correctIndex: Number(ans.correctIndex ?? 0),
    feedback: String(cfg.feedback ?? ""),
  };
}

function loadFb(el: InteractiveElement): FbState {
  const cfg = (el.configSchema ?? {}) as Record<string, unknown>;
  const ans = (el.correctAnswers ?? {}) as Record<string, string>;
  const prompt_text = String(cfg.prompt_text ?? cfg.prompt ?? "");
  const dropdown_options =
    cfg.dropdown_options && typeof cfg.dropdown_options === "object"
      ? (cfg.dropdown_options as Record<string, string[]>)
      : {};
  return {
    prompt_text,
    dropdown_options,
    answers: ans && typeof ans === "object" ? { ...ans } : {},
  };
}

export function ProgrammeInteractiveEditor({
  resourceId,
  resourceType,
  element,
  onClose,
  onSaved,
}: Props) {
  const isVideo = resourceType === "video";

  const [interactionType, setInteractionType] = useState<
    "multiple_choice" | "fill_blank"
  >(
    element?.interactionType === "fill_blank" ? "fill_blank" : "multiple_choice"
  );

  const [timestamp, setTimestamp] = useState(
    element?.videoTimestampSeconds != null
      ? String(element.videoTimestampSeconds)
      : ""
  );
  const [pauseOnTrigger, setPauseOnTrigger] = useState(
    element?.pauseOnTrigger ?? true
  );

  const [mc, setMc] = useState<McState>(
    element?.interactionType === "multiple_choice" ? loadMc(element) : defaultMc()
  );
  const [fb, setFb] = useState<FbState>(
    element?.interactionType === "fill_blank" ? loadFb(element) : defaultFb()
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blankKeys = extractBlankKeys(fb.prompt_text);

  function onTemplateChange(prompt_text: string) {
    const keys = extractBlankKeys(prompt_text);
    const dropdown_options: Record<string, string[]> = {};
    const answers: Record<string, string> = {};
    for (const key of keys) {
      dropdown_options[key] = fb.dropdown_options[key] ?? [];
      answers[key] = fb.answers[key] ?? "";
    }
    setFb({ prompt_text, dropdown_options, answers });
  }

  function setOptionsForKey(key: string, raw: string) {
    const options = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const current = fb.answers[key];
    const answer =
      current && options.includes(current) ? current : "";
    setFb({
      ...fb,
      dropdown_options: { ...fb.dropdown_options, [key]: options },
      answers: { ...fb.answers, [key]: answer },
    });
  }

  async function save() {
    setError(null);

    let configSchema: Record<string, unknown>;
    let correctAnswers: Record<string, unknown>;
    let type: InteractionType;

    if (interactionType === "multiple_choice") {
      if (!mc.question.trim()) {
        setError("Question is required");
        return;
      }
      const options = mc.options.map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) {
        setError("Add at least 2 options");
        return;
      }
      if (mc.correctIndex < 0 || mc.correctIndex >= options.length) {
        setError("Mark a valid correct option");
        return;
      }
      type = "multiple_choice";
      configSchema = {
        prompt: mc.question.trim(),
        options,
        feedback: mc.feedback.trim() || undefined,
      };
      correctAnswers = { correctIndex: mc.correctIndex };

    } else {
    // fill_blank
    if (!fb.prompt_text.trim()) {
        setError("Template is required");
        return;
    }
    const keys = extractBlankKeys(fb.prompt_text);
    if (keys.length === 0) {
        setError("Add at least one [id] blank, e.g. … is a [figure].");
        return;
    }
    for (const key of keys) {
        // Prefer explicit correct answer; fall back to single choice if only one option
        const opts = fb.dropdown_options[key] ?? [];
        const answer = (fb.answers[key] ?? "").trim() || (opts.length === 1 ? opts[0] : "");
        if (!answer) {
        setError(`Enter the correct answer for [${key}]`);
        return;
        }
    }

    type = "fill_blank";

    // Only include dropdown_options keys that have at least one choice
    const dropdown_options: Record<string, string[]> = {};
    for (const key of keys) {
        const opts = (fb.dropdown_options[key] ?? []).filter(Boolean);
        if (opts.length > 0) dropdown_options[key] = opts;
    }

    const answers: Record<string, string> = {};
    for (const key of keys) {
        const opts = fb.dropdown_options[key] ?? [];
        answers[key] =
        (fb.answers[key] ?? "").trim() || (opts.length === 1 ? opts[0] : "");
    }

    configSchema = {
        prompt_text: fb.prompt_text.trim(),
        ...(Object.keys(dropdown_options).length > 0 ? { dropdown_options } : {}),
    };
    correctAnswers = answers;
    }

    const seconds = timestamp.trim() ? Number(timestamp) : undefined;
    if (timestamp.trim() && Number.isNaN(seconds)) {
      setError("Timestamp must be a number (seconds)");
      return;
    }

    setSaving(true);
    try {
      const body = {
        interactionType: type,
        configSchema,
        correctAnswers,
        videoTimestampSeconds: seconds,
        pauseOnTrigger: isVideo ? pauseOnTrigger : undefined,
      };

      if (element) {
        await updateInteractiveElement(element.id, body);
      } else {
        await createInteractiveElement(resourceId, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <p className="font-heading text-lg font-semibold">
            {element ? "Edit" : "Add"} interactive element
          </p>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--ink-3)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Type
            </label>
            <select
              value={interactionType}
              onChange={(e) => {
                const next = e.target.value as "multiple_choice" | "fill_blank";
                setInteractionType(next);
                setError(null);
                if (next === "multiple_choice") setMc(defaultMc());
                else setFb(defaultFb());
              }}
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="fill_blank">Fill in the blank</option>
            </select>
          </div>

          {/* Timestamp (useful for video) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                Timestamp (seconds)
              </label>
              <input
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="e.g. 105"
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
              />
            </div>
            {isVideo && (
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pauseOnTrigger}
                    onChange={(e) => setPauseOnTrigger(e.target.checked)}
                  />
                  Pause video on trigger
                </label>
              </div>
            )}
          </div>

          {/* Multiple choice */}
          {interactionType === "multiple_choice" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Question *
                </label>
                <textarea
                  value={mc.question}
                  onChange={(e) => setMc({ ...mc, question: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
                  placeholder="What is a metaphor?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Options *
                </label>
                <div className="space-y-2">
                  {mc.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mc-correct"
                        checked={mc.correctIndex === i}
                        onChange={() => setMc({ ...mc, correctIndex: i })}
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const options = [...mc.options];
                          options[i] = e.target.value;
                          setMc({ ...mc, options });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--ink-3)] mt-1">
                  Select the radio for the correct answer
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Feedback
                </label>
                <input
                  value={mc.feedback}
                  onChange={(e) => setMc({ ...mc, feedback: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {/* Fill blank — multi blank via [id] */}
          {interactionType === "fill_blank" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Template *
                </label>
                <p className="text-[11px] text-[var(--ink-3)] mb-2">
                  Wrap each blank in <code className="font-mono">[id]</code>, e.g.
                  <br />
                  <span className="font-mono text-[var(--ink)]">
                    &quot;Her voice is music&quot; is a [figure] because it does not use [word1] or [word2].
                  </span>
                </p>
                <textarea
                  value={fb.prompt_text}
                  onChange={(e) => onTemplateChange(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] resize-none font-mono text-sm"
                  placeholder='A [figure] compares without using [word1] or [word2].'
                />
              </div>

              {blankKeys.length === 0 ? (
                <p className="text-sm text-[var(--ink-3)] border border-dashed border-[var(--line)] rounded-[var(--r-card)] px-4 py-4 text-center">
                  Add at least one <code>[id]</code> blank in the template
                </p>
              ) : (
                <div className="space-y-4">
                {blankKeys.map((key) => {
                const options = fb.dropdown_options[key] ?? [];
                return (
                    <div
                    key={key}
                    className="border border-[var(--line)] rounded-[var(--r-card)] p-4 space-y-3"
                    >
                    <p className="text-xs font-bold font-mono text-[var(--brand)]">[{key}]</p>

                    {/* Optional choices — 0, 1, or many all OK */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-[var(--ink-3)] mb-1">
                        Choices (optional, comma-separated)
                        </label>
                        <input
                        value={options.join(", ")}
                        onChange={(e) => setOptionsForKey(key, e.target.value)}
                        placeholder="Leave empty for free text, or: metaphor, simile"
                        className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                        />
                    </div>

                    {/* Always allow typing the correct answer */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-[var(--ink-3)] mb-1">
                        Correct answer *
                        </label>
                        {options.length > 0 ? (
                        <select
                            value={fb.answers[key] ?? ""}
                            onChange={(e) =>
                            setFb({
                                ...fb,
                                answers: { ...fb.answers, [key]: e.target.value },
                            })
                            }
                            className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
                        >
                            <option value="">Select or type below…</option>
                            {options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                            ))}
                        </select>
                        ) : null}
                        <input
                        value={fb.answers[key] ?? ""}
                        onChange={(e) =>
                            setFb({
                            ...fb,
                            answers: { ...fb.answers, [key]: e.target.value },
                            })
                        }
                        placeholder="e.g. metaphor"
                        className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] mt-2"
                        />
                    </div>
                    </div>
                );
                })}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="px-5 text-sm font-semibold text-[var(--warn)]">{error}</p>
        )}

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--line)]">
          <button type="button" onClick={onClose} className="btn ghost small" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn teal small inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}