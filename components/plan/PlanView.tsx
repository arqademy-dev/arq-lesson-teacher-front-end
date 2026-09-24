"use client";

import { RotateCcw } from "lucide-react";
import type {
  ProgrammeLearningPlan,
  ProgrammeTopic,
  WeeklyQuizSummary,
} from "@/lib/api";

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

type Props = {
  plan: ProgrammeLearningPlan;
  quizzes: WeeklyQuizSummary[];
  topics: ProgrammeTopic[];
  paymentId?: string;
  amountNaira?: number;
  onReset: () => void;
};

export function PlanView({
  plan,
  quizzes,
  topics,
  paymentId,
  amountNaira,
  onReset,
}: Props) {
  const quizDayLabel =
    plan.quizDay === "saturday"
      ? "Saturday"
      : plan.quizDay === "friday"
      ? "Friday"
      : plan.quizDay ?? "—";

  return (
    <div className="space-y-8">
      <section className="card border border-[var(--line)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="eyebrow text-[var(--brand)]">Active plan</div>
            <h3 className="font-heading text-xl font-semibold mt-1">
              Learning plan
            </h3>
            <p className="text-xs text-[var(--ink-3)] mt-1">
              {plan.startDate}
              {plan.endDate ? ` → ${plan.endDate}` : ""}
              {plan.status ? ` • ${plan.status}` : ""}
            </p>
          </div>
          <button onClick={onReset} className="btn ghost small">
            <RotateCcw className="w-4 h-4" />
            Set up another
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Chip label="Duration" value={`${plan.weeks ?? "—"} weeks`} />
          <Chip label="Topics" value={String(topics.length || "—")} />
          <Chip label="Quiz day" value={quizDayLabel} />
          <Chip
            label="Quiz size"
            value={
              plan.quizSize != null ? `${plan.quizSize} questions` : "—"
            }
          />
        </div>

        {(paymentId || amountNaira != null) && (
          <div className="mt-4 text-sm text-[var(--ink-3)]">
            Payment:{" "}
            <span className="font-semibold text-[var(--warn)]">
              ₦{Number(amountNaira ?? 0).toLocaleString()} pending
            </span>
            {paymentId && (
              <span className="text-[11px] ml-2 font-mono">{paymentId}</span>
            )}
          </div>
        )}
      </section>

      {/* Programme topic sequence */}
      {topics.length > 0 && (
        <section className="card border border-[var(--line)] p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">
            Programme sequence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topics.map((t, i) => (
              <div key={t.topicId} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold bg-[var(--surface-3)] text-[var(--ink-3)]">
                  {t.sequenceOrder ?? i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">
                    {t.subjectTitle ?? "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly quizzes (question bank) */}
      <section className="card border border-[var(--line)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--surface-3)]">
          <h3 className="font-heading text-lg font-semibold">Weekly quizzes</h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Questions drawn from the bank for topics taught that week
          </p>
        </div>

        {quizzes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[var(--ink-3)]">
            No quizzes loaded yet.
          </p>
        ) : (
          <ul>
            {quizzes.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--line-soft)] last:border-0"
              >
                <div>
                  <div className="font-semibold">Week {q.weekNumber}</div>
                  <div className="text-xs text-[var(--ink-3)]">
                    {q.scheduledDate} • {q.totalQuestions}/{q.requestedSize}{" "}
                    questions
                    {q.score != null ? ` • score ${q.score}` : ""}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                    q.status === "submitted"
                      ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                      : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                  }`}
                >
                  {q.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}