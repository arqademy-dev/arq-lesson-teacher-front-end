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
  // Assumption: backend embeds the class object on the student profile
  // now that classId exists. Falls back to academicLevel if not present —
  // confirm the real shape and tighten this once known.
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

  // The topic actually in progress starts expanded, so its next session
  // is visible immediately — no click needed to see what's next.
  useEffect(() => {
    if (!activePlan) return;
    const inProgress = activePlan.topics.find((t) => t.status === "in_progress");
    if (inProgress) {
      setExpanded((prev) => new Set(prev).add(inProgress.topicId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan]);

  function toggleTopic(topic: LearningPlanBreakdownTopic) {
    if (topic.status === "pending") return; // locked — nothing to reveal yet
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topic.topicId)) next.delete(topic.topicId);
      else next.add(topic.topicId);
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
            {/* Class / student card */}
            <section className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] px-5 py-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-[11px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] flex-none">
                {fullName ? (
                  <span className="font-heading font-semibold text-[14px]">
                    {(me?.firstName?.[0] ?? "").toUpperCase()}
                    {(me?.lastName?.[0] ?? "").toUpperCase()}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-heading text-[14px] font-semibold text-[var(--ink)] truncate">
                  {fullName || "Student"}
                </p>
                <p className="text-[11.5px] text-[var(--ink-3)] font-semibold mt-0.5">
                  {[className, me?.arqId].filter(Boolean).join(" · ") ||
                    "Learner profile"}
                </p>
              </div>
            </section>

            {!activePlan ? (
              <div className="mt-8 rounded-[var(--r-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
                <p className="text-[13px] text-[var(--ink-3)]">
                  No learning plan yet. Check with your educator.
                </p>
              </div>
            ) : planPayment && planPayment.status !== "success" ? (
              /* ---- Payment gate — nothing below is reachable until paid ---- */
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
                    You&apos;ve submitted payment for this plan — an admin
                    needs to approve it before your sessions unlock. Check
                    back soon.
                  </p>
                ) : (
                  <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                    This learning plan needs to be paid for before you can
                    start your sessions. Submit payment below — an admin will
                    review and approve it.
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
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Topics
                  </p>
                  <span className="text-[11px] font-bold text-[var(--ink-3)] capitalize">
                    Plan status: {activePlan.status}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {activePlan.topics.map((topic, idx) => {
                    const total = topic.done.length + topic.todo.length;
                    const isOpen = expanded.has(topic.topicId);
                    const nextDate = topic.todo[0]?.scheduledDate;
                    const activeSession =
                      topic.status === "in_progress" ? topic.todo[0] : null;
                    const lockedAhead =
                      topic.status === "in_progress" ? topic.todo.slice(1) : [];

                    return (
                      <li
                        key={topic.topicId}
                        className={cn(
                          "rounded-[var(--r-card)] border bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden",
                          topic.status === "in_progress"
                            ? "border-[var(--brand)]"
                            : "border-[var(--line)]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          disabled={topic.status === "pending"}
                          className={cn(
                            "w-full text-left px-4 py-3.5 flex items-center gap-3",
                            topic.status === "pending"
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-[var(--surface-2)]"
                          )}
                        >
                          <span className="w-6 h-6 rounded-full grid place-items-center text-[10.5px] font-bold flex-none bg-[var(--surface-3)] text-[var(--ink-3)]">
                            {idx + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-bold text-[var(--ink)] truncate">
                              {topic.topicTitle}
                            </span>
                            <span className="block text-[11px] text-[var(--ink-3)] font-semibold mt-0.5">
                              {topic.done.length}/{total} sessions
                              {topic.status === "pending" &&
                                nextDate &&
                                ` · starts ${nextDate}`}
                            </span>
                          </span>

                          <StatusPill status={topic.status} />

                          {topic.status === "pending" ? (
                            <Lock className="w-4 h-4 text-[var(--ink-4)] flex-none" />
                          ) : (
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 flex-none text-[var(--ink-4)] transition-transform",
                                isOpen && "rotate-90"
                              )}
                            />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-[var(--line-soft)] space-y-1.5">
                            {/* Completed sessions — done, viewable */}
                            {topic.done.length > 0 && (
                              <ul className="space-y-1.5 mt-2">
                                {topic.done.map((s) => (
                                  <li
                                    key={s.id}
                                    className="flex items-center gap-2 text-[12px] text-[var(--ink-3)] font-semibold"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] flex-none" />
                                    Day {s.sessionDayNumber} · {s.scheduledDate}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* The one session actually reachable right now */}
                            {activeSession && (
                              <div className="mt-2 rounded-[10px] border-2 border-[var(--brand)] bg-[var(--brand-soft)] px-3.5 py-3 flex items-center gap-3">
                                <PlayCircle className="w-5 h-5 text-[var(--brand)] flex-none" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12.5px] font-bold text-[var(--brand)]">
                                    Day {activeSession.sessionDayNumber} ·{" "}
                                    {activeSession.scheduledDate}
                                  </p>
                                  <p className="text-[11px] font-semibold text-[var(--brand)] opacity-80">
                                    {isPastDate(activeSession.scheduledDate)
                                      ? "Overdue — catch up now"
                                      : "Ready to start"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => router.push("/students/session")}
                                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[11.5px] font-bold bg-[var(--brand)] text-white flex-none"
                                >
                                  Open
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Later sessions in this topic — not reachable yet */}
                            {lockedAhead.length > 0 && (
                              <ul className="space-y-1.5 mt-2">
                                {lockedAhead.map((s) => (
                                  <li
                                    key={s.id}
                                    className="flex items-center gap-2 text-[12px] text-[var(--ink-4)] font-semibold opacity-70"
                                  >
                                    <Lock className="w-3.5 h-3.5 flex-none" />
                                    Day {s.sessionDayNumber} · {s.scheduledDate}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
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