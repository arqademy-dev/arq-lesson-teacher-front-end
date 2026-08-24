"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStudentMe,
  getMyLearningPlanBreakdown,
  listStudentPayments,
  initiateStudentPayment,
  ApiError,
  type LearningPlanBreakdownPlan,
  type LearningPlanBreakdownTopic,
  type StudentPayment,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  PlayCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudentMe = {
  firstName?: string;
  lastName?: string;
  arqId?: string;
  academicLevel?: string | null;
  class?: { id: string; title: string; term?: string | null } | null;
  enrollmentDate?: string;
  [key: string]: unknown;
};

type PlanPaymentState = {
  status: "success" | "pending" | "none";
  payment: StudentPayment | null;
};

function isPastDate(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
}

function isTopicFullyDone(topic: LearningPlanBreakdownTopic) {
  return topic.todo.length === 0 && topic.done.length > 0;
}

export default function StudentLearningPlanPage() {
  const router = useRouter();
  const [me, setMe] = useState<StudentMe | null>(null);
  const [plans, setPlans] = useState<LearningPlanBreakdownPlan[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [initiating, setInitiating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [profile, breakdown, pays] = await Promise.all([
          getStudentMe().catch(() => null),
          getMyLearningPlanBreakdown(),
          listStudentPayments().catch(() => []),
        ]);
        if (profile) setMe(profile as StudentMe);
        setPlans(Array.isArray(breakdown) ? breakdown : []);
        setPayments(Array.isArray(pays) ? pays : []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load your plan"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activePlan = useMemo(
    () => plans.find((p) => p.status === "active") ?? plans[0] ?? null,
    [plans]
  );

  const otherPlans = useMemo(
    () => plans.filter((p) => p !== activePlan),
    [plans, activePlan]
  );

  const planPayment: PlanPaymentState | null = useMemo(() => {
    if (!activePlan) return null;
    const forPlan = payments.filter(
      (p) => p.learningPlanId === activePlan.planId
    );
    const success = forPlan.find((p) => p.status === "success");
    if (success) return { status: "success", payment: success };
    const pending = forPlan.find((p) => p.status === "pending");
    if (pending) return { status: "pending", payment: pending };
    return { status: "none", payment: null };
  }, [payments, activePlan]);

  // Infer current topic from real data (todo arrays)
  const currentTopicIndex = useMemo(() => {
    if (!activePlan) return -1;
    return activePlan.topics.findIndex((t) => t.todo.length > 0);
  }, [activePlan]);

  const currentTopic =
    currentTopicIndex >= 0 && activePlan
      ? activePlan.topics[currentTopicIndex]
      : null;

  const activeSession = currentTopic?.todo[0] ?? null;

  // Auto-expand the topic that has remaining work
  useEffect(() => {
    if (currentTopic) {
      setExpanded((prev) => new Set(prev).add(currentTopic.topicId));
    }
  }, [currentTopic]);

  function toggleTopic(topicId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  async function handleInitiatePayment() {
    if (!activePlan) return;
    setInitiating(true);
    setPaymentError(null);
    try {
      const res = await initiateStudentPayment(activePlan.planId);
      if (res.payment) {
        setPayments((prev) => [...prev, res.payment as StudentPayment]);
      }
    } catch (err) {
      setPaymentError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not start payment"
      );
    } finally {
      setInitiating(false);
    }
  }

  const fullName =
    me && (me.firstName || me.lastName)
      ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
      : null;
  const className = me?.class?.title ?? me?.academicLevel ?? null;

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">
          ARQADEMY · My learning plan
        </span>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Continue learning
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          {fullName ? `${fullName}'s plan` : "Your learning plan"}
        </h1>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[var(--ink-3)] text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your plan…
          </div>
        )}

        {error && (
          <div className="mt-8 space-y-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-[13px] text-[var(--danger)] font-semibold">
              {error}
            </p>
            <Link
              href="/students/login"
              className="inline-flex text-[12.5px] font-bold text-[var(--brand)]"
            >
              Go to student login →
            </Link>
          </div>
        )}

        {!loading && !error && (
          <>
            {!activePlan ? (
              <div className="mt-8 rounded-[var(--r-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
                <p className="text-[13px] text-[var(--ink-3)]">
                  No learning plan yet. Check with your educator.
                </p>
              </div>
            ) : planPayment && planPayment.status !== "success" ? (
              /* Payment gate */
              <section className="mt-6 rounded-[var(--r-card)] border border-[var(--warn)] bg-[var(--surface)] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[var(--warn)]" />
                  <p className="text-[13px] font-bold text-[var(--warn)]">
                    {planPayment.status === "pending"
                      ? "Payment pending approval"
                      : "Payment required"}
                  </p>
                </div>

                {planPayment.status === "pending" ? (
                  <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                    You&apos;ve submitted payment for this plan — an admin needs
                    to approve it before your sessions unlock. Check back soon.
                  </p>
                ) : (
                  <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                    This learning plan needs to be paid for before you can start
                    your sessions. Submit payment below — an admin will review
                    and approve it.
                  </p>
                )}

                {paymentError && (
                  <p className="text-[12px] font-semibold text-[var(--danger)]">
                    {paymentError}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {planPayment.status === "none" && (
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={initiating}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white border-2 border-[var(--brand-ink)] disabled:opacity-50"
                    >
                      {initiating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay now
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    href="/students/payments"
                    className="text-[11.5px] font-bold text-[var(--brand)] hover:underline"
                  >
                    View payment history →
                  </Link>
                </div>
              </section>
            ) : (
<section className="mt-6">
  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
    <div>
      <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
        Study plan
      </p>
      <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5">
        {activePlan.topics.length} weeks ·{" "}
        {activePlan.topics.filter((t) => isTopicFullyDone(t)).length} completed
      </p>
    </div>
    <span className="text-[11px] font-bold text-[var(--ink-3)] capitalize">
      {activePlan.status}
    </span>
  </div>

  {/* Progress bar */}
  {(() => {
    const totalSessions = activePlan.topics.reduce(
      (n, t) => n + t.done.length + t.todo.length,
      0
    );
    const doneSessions = activePlan.topics.reduce(
      (n, t) => n + t.done.length,
      0
    );
    const pct =
      totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;
    return (
      <div className="mb-5">
        <div className="flex justify-between text-[11px] font-bold text-[var(--ink-3)] mb-1.5">
          <span>
            Week {currentTopicIndex >= 0 ? currentTopicIndex + 1 : "—"} of{" "}
            {activePlan.topics.length}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  })()}

  {/* Week cards grid */}
  <div className="grid grid-cols-2 gap-3">
    {activePlan.topics.map((topic, idx) => {
      const total = topic.done.length + topic.todo.length;
      const doneCount = topic.done.length;
      const isCurrent = idx === currentTopicIndex;
      const isDone = isTopicFullyDone(topic);
      const isFuture = currentTopicIndex >= 0 && idx > currentTopicIndex;
      const isSelected = expanded.has(topic.topicId);

      return (
        <button
          key={topic.topicId}
          type="button"
          onClick={() => toggleTopic(topic.topicId)}
          className={cn(
            "relative rounded-[14px] border text-left p-4 transition min-h-[96px] flex flex-col justify-between",
            isDone &&
              "bg-[var(--brand)] border-[var(--brand)] text-white shadow-[var(--shadow-sm)]",
            isCurrent &&
              !isDone &&
              "bg-[var(--surface)] border-[var(--brand)] shadow-[var(--shadow-sm)]",
            isFuture &&
              "bg-[var(--surface)] border-[var(--line-soft)] opacity-70",
            !isDone &&
              !isCurrent &&
              !isFuture &&
              "bg-[var(--surface)] border-[var(--line)]",
            isSelected && !isDone && "ring-2 ring-[var(--brand)] ring-offset-1"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={cn(
                  "text-[10px] font-bold tracking-[0.14em] uppercase",
                  isDone ? "text-white/80" : "text-[var(--ink-3)]"
                )}
              >
                Week
              </p>
              <p
                className={cn(
                  "font-heading text-[22px] font-semibold leading-none mt-0.5",
                  isDone ? "text-white" : "text-[var(--ink)]"
                )}
              >
                {idx + 1}
              </p>
            </div>
            {isDone && (
              <span className="w-6 h-6 rounded-full bg-white/20 grid place-items-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
            )}
          </div>

          <div className="mt-3">
            <p
              className={cn(
                "text-[12px] font-bold truncate",
                isDone ? "text-white" : "text-[var(--ink)]"
              )}
            >
              {isDone
                ? "Completed"
                : isFuture
                  ? "Locked"
                  : `${doneCount}/${total} done`}
            </p>
            <p
              className={cn(
                "text-[10.5px] font-semibold mt-0.5 truncate",
                isDone ? "text-white/75" : "text-[var(--ink-3)]"
              )}
            >
              {topic.topicTitle.replace(/^Week\s*\d+:\s*/i, "")}
            </p>
          </div>
        </button>
      );
    })}
  </div>

  {/* Expanded week detail (days) */}
  {activePlan.topics.map((topic, idx) => {
    if (!expanded.has(topic.topicId)) return null;

    const isCurrent = idx === currentTopicIndex;
    const isFuture = currentTopicIndex >= 0 && idx > currentTopicIndex;
    const activeSession = isCurrent ? topic.todo[0] : null;
    const lockedAhead = isCurrent ? topic.todo.slice(1) : [];

    // All days in order: done first, then todo
    const allDays = [
      ...topic.done.map((s) => ({ ...s, _state: "done" as const })),
      ...topic.todo.map((s, i) => ({
        ...s,
        _state:
          isCurrent && i === 0
            ? ("now" as const)
            : ("locked" as const),
      })),
    ];

    return (
      <div
        key={`detail-${topic.topicId}`}
        className="mt-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-[var(--line-soft)] flex items-center justify-between gap-3">
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--brand)]">
              Week {idx + 1}
            </p>
            <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)] mt-0.5">
              {topic.topicTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toggleTopic(topic.topicId)}
            className="text-[11.5px] font-bold text-[var(--ink-3)] hover:text-[var(--brand)]"
          >
            Close
          </button>
        </div>

        <div className="p-3 space-y-2">
          {allDays.map((s) => {
            const isDone = s._state === "done";
            const isNow = s._state === "now";
            const isLocked = s._state === "locked";

            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-[12px] border px-4 py-3",
                  isNow
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--line-soft)] bg-[var(--surface)]"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Day badge */}
                  <span
                    className={cn(
                      "w-8 h-8 rounded-[9px] grid place-items-center text-[12px] font-bold flex-none",
                      isDone && "bg-[var(--ok)] text-white",
                      isNow && "bg-[var(--brand)] text-white",
                      isLocked && "bg-[var(--surface-3)] text-[var(--ink-4)]"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      s.sessionDayNumber
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[var(--ink)]">
                      Day {s.sessionDayNumber}
                    </p>
                    <p className="text-[11px] font-semibold text-[var(--ink-3)]">
                      {s.scheduledDate}
                    </p>
                  </div>

                  {/* Action */}
                  {isDone && (
                    <div className="flex items-center gap-2 flex-none">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ok-soft)] text-[var(--ok)]">
                        Done
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/students/session/${s.id}`)
                        }
                        className="text-[11px] font-bold text-[var(--brand)] hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  )}

                  {isNow && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/students/session/${s.id}`)
                      }
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[11.5px] font-bold bg-[var(--brand)] text-white flex-none"
                    >
                      Open
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ink-4)]">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  )}
                </div>

                {/* AI Feedback row — only for completed days for now */}
                {isDone && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--line-soft)]">
                    <Link
                      href={`/students/feedback/${s.id}`}
                      className="flex items-center justify-center h-9 rounded-[9px] text-[12px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] hover:opacity-90 transition"
                    >
                      View AI Feedback
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</section>
            )}

            {otherPlans.length > 0 && (
              <section className="mt-8">
                <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)] mb-3">
                  Past plans
                </p>
                <ul className="space-y-2">
                  {otherPlans.map((plan) => (
                    <li
                      key={plan.planId}
                      className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <span className="text-[12.5px] font-bold text-[var(--ink)] capitalize">
                        {plan.status}
                      </span>
                      <span className="text-[11px] text-[var(--ink-3)] font-semibold">
                        {plan.startDate}
                        {plan.endDate ? ` – ${plan.endDate}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-none",
        status === "completed" && "bg-[var(--ok-soft)] text-[var(--ok)]",
        status === "in_progress" &&
          "bg-[var(--brand-soft)] text-[var(--brand)]",
        status === "pending" && "bg-[var(--surface-3)] text-[var(--ink-3)]"
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}