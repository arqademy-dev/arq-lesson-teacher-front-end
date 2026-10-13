"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  ProgrammeLearningPlan,
  ProgrammeTopic,
  WeeklyQuizSummary,
  UpdateProgrammePlanPayload,
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

const STATUS_OPTIONS = ["active", "paused", "completed", "cancelled"] as const;

type Props = {
  plan: ProgrammeLearningPlan;
  quizzes: WeeklyQuizSummary[];
  topics: ProgrammeTopic[];
  paymentId?: string;
  amountNaira?: number;
  paymentStatus?: string;
  onUpdate: (patch: UpdateProgrammePlanPayload) => Promise<void>;
};

export function PlanView({
  plan,
  quizzes,
  topics,
  paymentId,
  amountNaira,
  paymentStatus,
  onUpdate,
}: Props) {
  const [savingField, setSavingField] = useState<"require" | "status" | null>(null);

  const quizDayLabel =
    plan.quizDay === "saturday"
      ? "Saturday"
      : plan.quizDay === "friday"
      ? "Friday"
      : plan.quizDay ?? "—";

  async function toggleRequireCorrect() {
    setSavingField("require");
    try {
      await onUpdate({ requireCorrectAnswersToProgress: !plan.requireCorrectAnswersToProgress });
    } finally {
      setSavingField(null);
    }
  }

  async function changeStatus(status: (typeof STATUS_OPTIONS)[number]) {
    if (status === plan.status) return;
    setSavingField("status");
    try {
      await onUpdate({ status });
    } finally {
      setSavingField(null);
    }
  }

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
            </p>
          </div>

          {/* NEW — editable status, replaces the old "Set up another" reset
              (which only cleared local state and never changed anything server-side) */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[var(--ink-3)] uppercase">Status</label>
            <select
              value={plan.status}
              onChange={(e) => changeStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
              disabled={savingField === "status"}
              className="px-3 py-2 rounded-[var(--r-ctl)] border border-[var(--line)] bg-[var(--surface)] text-xs font-bold capitalize disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {savingField === "status" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--ink-3)]" />}
          </div>
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
          <Chip
            label="Quiz time"
            value={
              plan.quizDurationMinutes != null
                ? `${plan.quizDurationMinutes} min`
                : "Untimed"
            }
          />
        </div>

        {/* NEW — editable, was hardcoded true at creation and never shown again after */}
        <div className="mt-5 pt-5 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={toggleRequireCorrect}
            disabled={savingField === "require"}
            className={`w-full sm:w-auto px-5 py-3 rounded-[var(--r-card)] border text-left font-semibold text-sm flex items-center gap-3 disabled:opacity-60 ${
              plan.requireCorrectAnswersToProgress
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
            }`}
          >
            {savingField === "require" ? (
              <Loader2 className="w-4 h-4 animate-spin flex-none" />
            ) : (
              <span
                className="inline-block w-9 h-5 rounded-full relative flex-none"
                style={{ background: plan.requireCorrectAnswersToProgress ? "var(--brand)" : "var(--surface-3)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: plan.requireCorrectAnswersToProgress ? "18px" : "2px" }}
                />
              </span>
            )}
            {plan.requireCorrectAnswersToProgress
              ? "Must answer correctly to progress — tap to turn off"
              : "Can progress regardless of correctness — tap to require correct answers"}
          </button>
        </div>

        {(paymentId || amountNaira != null) && (
          <div className="mt-4 text-sm text-[var(--ink-3)]">
            Payment:{" "}
            <span
              className={`font-semibold ${
                paymentStatus === "success" ? "text-[var(--ok)]" : "text-[var(--warn)]"
              }`}
            >
              ₦{Number(amountNaira ?? 0).toLocaleString()} {paymentStatus ?? "pending"}
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