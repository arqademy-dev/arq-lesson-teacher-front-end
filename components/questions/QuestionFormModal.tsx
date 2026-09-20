"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Question, Subject } from "@/lib/question-bank";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)]";

const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2";

type Props = {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  /** Where the form starts: the current topic when adding, the question's own topic when editing */
  defaultSubjectId: string;
  defaultTopicId: string;
  /** Pass a question to edit it; leave undefined to add a new one */
  question?: Question;
  onSave: (subjectId: string, topicId: string, question: Question) => void;
};

export function QuestionFormModal({
  open,
  onClose,
  subjects,
  defaultSubjectId,
  defaultTopicId,
  question,
  onSave,
}: Props) {
  const isEdit = !!question;

  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [topicId, setTopicId] = useState(defaultTopicId);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("");

  // Fill the form every time the modal opens: blank for add, existing values for edit
  useEffect(() => {
    if (!open) return;
    setSubjectId(defaultSubjectId);
    setTopicId(defaultTopicId);
    setText(question?.text ?? "");
    setOptions(question ? [...question.options] : ["", "", "", ""]);
    setCorrect(question?.correct ?? 0);
    setFeedback(question?.feedback ?? "");
  }, [open, defaultSubjectId, defaultTopicId, question]);

  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  const filledCount = options.filter((o) => o.trim()).length;
  const canSave =
    text.trim().length > 0 && filledCount >= MIN_OPTIONS && !!options[correct]?.trim();

  const onSubjectChange = (id: string) => {
    const next = subjects.find((s) => s.id === id);
    setSubjectId(id);
    setTopicId(next?.topics[0]?.id ?? "");
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrect((c) => (index === c ? 0 : index < c ? c - 1 : c));
  };

  const handleSave = () => {
    if (!canSave) return;

    // Drop blank options but keep track of which one is correct
    const cleaned = options
      .map((o, i) => ({ text: o.trim(), isCorrect: i === correct }))
      .filter((o) => o.text);

    onSave(subject.id, topicId, {
      id: question?.id ?? `q-${Date.now()}`, // keep the id when editing
      text: text.trim(),
      options: cleaned.map((o) => o.text),
      correct: cleaned.findIndex((o) => o.isCorrect),
      feedback: feedback.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Question" : "Add New Question"}
      footer={
        <>
          <button onClick={onClose} className="btn ghost small">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave} className="btn teal small">
            {isEdit ? "Save Changes" : "Save Question"}
          </button>
        </>
      }
    >
      <div className="p-6 space-y-8">
        {/* Where it lives */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Subject</label>
              <select
                value={subject.id}
                onChange={(e) => onSubjectChange(e.target.value)}
                className={fieldClass}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className={fieldClass}
              >
                {subject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isEdit && (
            <p className="mt-3 text-[11px] text-[var(--ink-3)]">
              Choose a different subject or topic to move this question there.
            </p>
          )}
        </div>

        {/* Question text */}
        <div>
          <label className={labelClass}>Question</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Type the question here…"
            className={fieldClass}
          />
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`${labelClass} mb-0`}>Options</label>
            <span className="text-[11px] text-[var(--ink-3)]">
              Select the radio button next to the correct answer
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
                  aria-label={`Mark option ${String.fromCharCode(65 + i)} as correct`}
                  className="w-4 h-4 flex-none accent-[var(--brand)]"
                />
                <span className="w-5 flex-none font-bold text-[var(--ink-3)]">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  value={option}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label="Remove option"
                  className="flex-none p-2 rounded-[var(--r-ctl)] text-[var(--ink-3)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-3)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {options.length < MAX_OPTIONS && (
            <button type="button" onClick={addOption} className="btn ghost small mt-4">
              <Plus className="w-4 h-4" />
              Add option
            </button>
          )}
        </div>

        {/* Feedback */}
        <div>
          <label className={labelClass}>Feedback / Explanation</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Shown to the student after they answer (optional)"
            className={fieldClass}
          />
        </div>
      </div>
    </Modal>
  );
}