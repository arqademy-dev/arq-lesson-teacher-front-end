"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { BankQuestion } from "@/lib/api";

type Props = {
  question: BankQuestion;
  number: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function QuestionCard({ question, number, onEdit, onDelete }: Props) {
  const [revealed, setRevealed] = useState(false);
  const isMc = question.type === "multiple_choice";
  const isFb = question.type === "fill_blank";

  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-2)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="flex-none w-8 h-8 rounded-full grid place-items-center text-sm font-heading font-semibold bg-[var(--surface-3)] text-[var(--ink-3)]">
            {number}
          </span>
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isMc
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "bg-[var(--surface-3)] text-[var(--ink-2)]"
                }`}
              >
                {isMc ? "Multiple choice" : "Fill blank"}
              </span>
              {!question.isActive && (
                <span className="text-[10px] font-bold uppercase text-[var(--ink-3)]">
                  Archived
                </span>
              )}
            </div>
            <div className="font-semibold text-[var(--ink)] leading-snug whitespace-pre-wrap">
              {question.text}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-none">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="btn ghost small mr-1"
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revealed ? "Hide" : "Answer"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-[var(--r-ctl)] text-[var(--ink-3)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-[var(--r-ctl)] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
            aria-label="Archive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isMc && question.options && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option, i) => {
            const isCorrect =
              revealed && question.correctIndex != null && i === question.correctIndex;
            return (
              <div
                key={i}
                className={`px-4 py-3 rounded-[var(--r-card)] border text-sm font-medium ${
                  isCorrect
                    ? "bg-[var(--ok-soft)] border-[var(--ok)] text-[var(--ok)]"
                    : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink)]"
                }`}
              >
                <span className="font-bold mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </div>
            );
          })}
        </div>
      )}

      {isFb && revealed && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(question.acceptedAnswers ?? []).map((a, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok)]"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {revealed && question.feedback && (
        <div className="mt-5 text-xs text-[var(--ink-3)] border-t border-[var(--line)] pt-4">
          <strong className="text-[var(--ink-2)]">Feedback:</strong>{" "}
          {question.feedback}
        </div>
      )}
    </div>
  );
}