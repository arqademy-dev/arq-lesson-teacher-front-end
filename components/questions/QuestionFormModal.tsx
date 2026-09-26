"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type {
  BankQuestion,
  CreateBankQuestionPayload,
  QuestionType,
  CurriculumSubject,
  Topic,
} from "@/lib/api";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)]";
const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2";

type Props = {
  open: boolean;
  onClose: () => void;
  subjects: CurriculumSubject[];
  topics: Topic[];
  defaultSubjectId: string;
  defaultTopicId: string;
  question?: BankQuestion | null;
  saving?: boolean;
  onSave: (payload: {
    mode: "add" | "edit";
    id?: string;
    body: CreateBankQuestionPayload | (Partial<CreateBankQuestionPayload> & { topicId?: string; feedback?: string | null });
  }) => void;
};

export function QuestionFormModal({
  open,
  onClose,
  subjects,
  topics,
  defaultSubjectId,
  defaultTopicId,
  question,
  saving,
  onSave,
}: Props) {
  const isEdit = !!question;

  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [topicId, setTopicId] = useState(defaultTopicId);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([""]);
  const [feedback, setFeedback] = useState("");

  const topicsForSubject = topics.filter(
    (t) => !subjectId || t.subjectId === subjectId
  );

  useEffect(() => {
    if (!open) return;
    setSubjectId(defaultSubjectId);
    setTopicId(defaultTopicId);
    if (question) {
      setType(question.type);
      setText(question.text);
      setOptions(
        question.options?.length ? [...question.options] : ["", "", "", ""]
      );
      setCorrect(question.correctIndex ?? 0);
      setAcceptedAnswers(
        question.acceptedAnswers?.length
          ? [...question.acceptedAnswers]
          : [""]
      );
      setFeedback(question.feedback ?? "");
    } else {
      setType("multiple_choice");
      setText("");
      setOptions(["", "", "", ""]);
      setCorrect(0);
      setAcceptedAnswers([""]);
      setFeedback("");
    }
  }, [open, defaultSubjectId, defaultTopicId, question]);

  const filledOptions = options.filter((o) => o.trim());
  const filledAnswers = acceptedAnswers.filter((a) => a.trim());

  const canSave =
    text.trim().length > 0 &&
    !!topicId &&
    (type === "multiple_choice"
      ? filledOptions.length >= MIN_OPTIONS && !!options[correct]?.trim()
      : filledAnswers.length >= 1);

  function handleSave() {
    if (!canSave || !topicId) return;

    if (type === "multiple_choice") {
      const cleaned = options
        .map((o, i) => ({ text: o.trim(), isCorrect: i === correct }))
        .filter((o) => o.text);
      const correctIndex = cleaned.findIndex((o) => o.isCorrect);
      const body = {
        type: "multiple_choice" as const,
        topicId,
        text: text.trim(),
        options: cleaned.map((o) => o.text),
        correctIndex: correctIndex < 0 ? 0 : correctIndex,
        feedback: feedback.trim() || undefined,
      };
      onSave({ mode: isEdit ? "edit" : "add", id: question?.id, body });
      return;
    }

    const body = {
      type: "fill_blank" as const,
      topicId,
      text: text.trim(),
      acceptedAnswers: filledAnswers,
      feedback: feedback.trim() || undefined,
    };
    onSave({ mode: isEdit ? "edit" : "add", id: question?.id, body });
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit ? "Edit Question" : "Add Question"}
      footer={
        <>
          <button onClick={onClose} className="btn ghost small" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn teal small inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save changes" : "Save question"}
          </button>
        </>
      }
    >
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Type — locked on edit (API cannot change type) */}
        <div>
          <label className={labelClass}>Type</label>
          <div className="flex gap-2">
            {(
              [
                { id: "multiple_choice", label: "Multiple choice" },
                { id: "fill_blank", label: "Fill in the blank" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={isEdit}
                onClick={() => setType(t.id)}
                className={`px-4 py-2 rounded-[var(--r-ctl)] text-sm font-semibold border ${
                  type === t.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--line)] text-[var(--ink-3)]"
                } disabled:opacity-60`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {isEdit && (
            <p className="mt-1 text-[11px] text-[var(--ink-3)]">
              Type cannot be changed. Archive and create a new question instead.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Subject</label>
            <select
              className={fieldClass}
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                const first = topics.find((t) => t.subjectId === e.target.value);
                setTopicId(first?.id ?? "");
              }}
            >
              <option value="">All / pick topic</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? (s as { title?: string }).title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Topic *</label>
            <select
              className={fieldClass}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">Select topic…</option>
              {topicsForSubject.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Question {type === "fill_blank" && "(use ___ for the blank)"}
          </label>
          <textarea
            className={fieldClass}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === "fill_blank"
                ? 'e.g. "Her voice is music to his ears" is an example of a ___.'
                : "Type the question…"
            }
          />
        </div>

        {type === "multiple_choice" && (
          <div>
            <div className="flex justify-between mb-2">
              <label className={`${labelClass} mb-0`}>Options</label>
              <span className="text-[11px] text-[var(--ink-3)]">
                Select the correct answer
              </span>
            </div>
            <div className="space-y-3">
              {options.map((option, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    className="accent-[var(--brand)]"
                  />
                  <span className="w-5 font-bold text-[var(--ink-3)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    className={fieldClass}
                    value={option}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, j) => (j === i ? e.target.value : o))
                      )
                    }
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                  <button
                    type="button"
                    disabled={options.length <= MIN_OPTIONS}
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, j) => j !== i));
                      setCorrect((c) =>
                        i === c ? 0 : i < c ? c - 1 : c
                      );
                    }}
                    className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)] disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={() => setOptions((p) => [...p, ""])}
                className="btn ghost small mt-3"
              >
                <Plus className="w-4 h-4" /> Add option
              </button>
            )}
          </div>
        )}

        {type === "fill_blank" && (
          <div>
            <label className={labelClass}>Accepted answers *</label>
            <p className="text-[11px] text-[var(--ink-3)] mb-2">
              Any of these count as correct (case-insensitive). Add synonyms.
            </p>
            <div className="space-y-2">
              {acceptedAnswers.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={fieldClass}
                    value={a}
                    onChange={(e) =>
                      setAcceptedAnswers((prev) =>
                        prev.map((x, j) => (j === i ? e.target.value : x))
                      )
                    }
                    placeholder={`Answer ${i + 1}`}
                  />
                  <button
                    type="button"
                    disabled={acceptedAnswers.length <= 1}
                    onClick={() =>
                      setAcceptedAnswers((prev) =>
                        prev.filter((_, j) => j !== i)
                      )
                    }
                    className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)] disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {acceptedAnswers.length < 10 && (
              <button
                type="button"
                onClick={() => setAcceptedAnswers((p) => [...p, ""])}
                className="btn ghost small mt-3"
              >
                <Plus className="w-4 h-4" /> Add accepted answer
              </button>
            )}
          </div>
        )}

        <div>
          <label className={labelClass}>Feedback (optional)</label>
          <textarea
            className={fieldClass}
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Shown after the student answers"
          />
        </div>
      </div>
    </Modal>
  );
}