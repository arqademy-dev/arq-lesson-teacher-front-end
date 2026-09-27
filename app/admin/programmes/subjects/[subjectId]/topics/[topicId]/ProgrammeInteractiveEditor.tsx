"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
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

type EditorType = "multiple_choice" | "fill_blank" | "file_upload";

type McState = {
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
};

type FbState = {
  prompt_text: string;
  /** Comma- or newline-separated accepted answers */
  acceptedRaw: string;
};

type FuState = {
  prompt_text: string;
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
  return { prompt_text: "", acceptedRaw: "" };
}

function defaultFu(): FuState {
  return { prompt_text: "Upload today’s summary note" };
}

function loadMc(el: InteractiveElement): McState {
  const cfg = (el.configSchema ?? {}) as Record<string, unknown>;
  const ans = (el.correctAnswers ?? {}) as Record<string, unknown>;
  const options = Array.isArray(cfg.options)
    ? (cfg.options as string[]).concat(["", "", "", ""]).slice(0, 4)
    : ["", "", "", ""];
  const correctIndex =
    typeof ans.selectedIndex === "number"
      ? ans.selectedIndex
      : Number(ans.correctIndex ?? 0);
  return {
    question: String(cfg.prompt ?? cfg.question ?? cfg.prompt_text ?? ""),
    options,
    correctIndex,
    feedback: String(cfg.feedback ?? ""),
  };
}

function loadFb(el: InteractiveElement): FbState {
  const cfg = (el.configSchema ?? {}) as Record<string, unknown>;
  const ans = (el.correctAnswers ?? {}) as Record<string, unknown>;
  const prompt_text = String(cfg.prompt_text ?? cfg.prompt ?? "");
  let accepted: string[] = [];
  if (Array.isArray(ans.acceptedAnswers)) {
    accepted = ans.acceptedAnswers.map(String);
  } else if (typeof ans.answer === "string") {
    accepted = [ans.answer];
  }
  return {
    prompt_text,
    acceptedRaw: accepted.join(", "),
  };
}

function loadFu(el: InteractiveElement): FuState {
  const cfg = (el.configSchema ?? {}) as Record<string, unknown>;
  return {
    prompt_text: String(
      cfg.prompt_text ?? cfg.prompt ?? "Upload today’s summary note"
    ),
  };
}

function parseAccepted(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProgrammeInteractiveEditor({
  resourceId,
  resourceType,
  element,
  onClose,
  onSaved,
}: Props) {
  const isVideo = resourceType === "video";

  const initialType = ((): EditorType => {
    if (element?.interactionType === "fill_blank") return "fill_blank";
    if (element?.interactionType === "file_upload") return "file_upload";
    return "multiple_choice";
  })();

  const [interactionType, setInteractionType] =
    useState<EditorType>(initialType);
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
  const [fu, setFu] = useState<FuState>(
    element?.interactionType === "file_upload" ? loadFu(element) : defaultFu()
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        question: mc.question.trim(),
        options,
        feedback: mc.feedback.trim() || undefined,
      };
      // selectedIndex matches student payload; correctIndex kept for older readers
      correctAnswers = {
        selectedIndex: mc.correctIndex,
        correctIndex: mc.correctIndex,
      };
    } else if (interactionType === "fill_blank") {
      if (!fb.prompt_text.trim()) {
        setError("Prompt is required");
        return;
      }
      const acceptedAnswers = parseAccepted(fb.acceptedRaw);
      if (acceptedAnswers.length < 1) {
        setError("Add at least one accepted answer");
        return;
      }
      type = "fill_blank";
      configSchema = {
        prompt_text: fb.prompt_text.trim(),
      };
      correctAnswers = { acceptedAnswers };
    } else {
      // file_upload — end-of-day summary; leave timestamp empty
      type = "file_upload";
      configSchema = {
        prompt_text:
          fu.prompt_text.trim() || "Upload today’s summary note",
      };
      correctAnswers = {};
    }

    const seconds =
      interactionType === "file_upload"
        ? undefined
        : timestamp.trim()
          ? Number(timestamp)
          : undefined;

    if (
      interactionType !== "file_upload" &&
      timestamp.trim() &&
      Number.isNaN(seconds)
    ) {
      setError("Timestamp must be a number (seconds)");
      return;
    }

    setSaving(true);
    try {
      const body = {
        interactionType: type,
        configSchema,
        correctAnswers,
        videoTimestampSeconds: seconds || undefined,
        pauseOnTrigger:
          isVideo && interactionType !== "file_upload"
            ? pauseOnTrigger
            : false,
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
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--ink-3)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Type
            </label>
            <select
              value={interactionType}
              disabled={!!element}
              onChange={(e) => {
                const next = e.target.value as EditorType;
                setInteractionType(next);
                setError(null);
                if (next === "multiple_choice") setMc(defaultMc());
                if (next === "fill_blank") setFb(defaultFb());
                if (next === "file_upload") {
                  setFu(defaultFu());
                  setTimestamp("");
                }
              }}
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] disabled:opacity-60"
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="fill_blank">Fill in the blank</option>
              <option value="file_upload">File upload (day summary)</option>
            </select>
            {element && (
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                Type can’t be changed on edit — delete and recreate if needed.
              </p>
            )}
          </div>

          {interactionType !== "file_upload" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Timestamp (seconds)
                </label>
                <input
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="e.g. 105 — empty = not mid-video"
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
          )}

          {interactionType === "file_upload" && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                Students upload a file (after R2 presign). No mid-video
                timestamp. Use one per learning day so “complete day” can
                require a file.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Instructions
                </label>
                <input
                  value={fu.prompt_text}
                  onChange={(e) =>
                    setFu({ ...fu, prompt_text: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                  placeholder="Upload today’s summary note"
                />
              </div>
            </div>
          )}

          {interactionType === "multiple_choice" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Question *
                </label>
                <textarea
                  value={mc.question}
                  onChange={(e) =>
                    setMc({ ...mc, question: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
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
                        onChange={() =>
                          setMc({ ...mc, correctIndex: i })
                        }
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
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Feedback
                </label>
                <input
                  value={mc.feedback}
                  onChange={(e) =>
                    setMc({ ...mc, feedback: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                />
              </div>
            </div>
          )}

          {interactionType === "fill_blank" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Prompt *
                </label>
                <p className="text-[11px] text-[var(--ink-3)] mb-2">
                  One blank. Use <code>___</code> in the sentence if you like.
                  Student types a single answer.
                </p>
                <textarea
                  value={fb.prompt_text}
                  onChange={(e) =>
                    setFb({ ...fb, prompt_text: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
                  placeholder='e.g. "Her voice is music to his ears" is an example of a ___.'
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                  Accepted answers *
                </label>
                <p className="text-[11px] text-[var(--ink-3)] mb-2">
                  Comma-separated. Matching is case-insensitive after trim.
                </p>
                <input
                  value={fb.acceptedRaw}
                  onChange={(e) =>
                    setFb({ ...fb, acceptedRaw: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                  placeholder="metaphor, a metaphor"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="px-5 text-sm font-semibold text-[var(--warn)]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="btn ghost small"
            disabled={saving}
          >
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