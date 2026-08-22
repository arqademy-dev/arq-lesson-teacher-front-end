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
            {/* Student card */}
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
              /* Topics — every topic can expand */
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
                    const isCurrent = idx === currentTopicIndex;
                    const isFuture =
                      currentTopicIndex >= 0 && idx > currentTopicIndex;

                    const displayStatus = isTopicFullyDone(topic)
                      ? "completed"
                      : isCurrent
                        ? "in_progress"
                        : "pending";

                    // Sessions after the first one in the current topic are locked
                    const lockedAhead = isCurrent ? topic.todo.slice(1) : [];

                    return (
                      <li
                        key={topic.topicId}
                        className={cn(
                          "rounded-[var(--r-card)] border bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden",
                          isCurrent
                            ? "border-[var(--brand)]"
                            : "border-[var(--line)]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTopic(topic.topicId)}
                          className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[var(--surface-2)]"
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
                              {isFuture &&
                                topic.todo[0] &&
                                ` · starts ${topic.todo[0].scheduledDate}`}
                            </span>
                          </span>

                          <StatusPill status={displayStatus} />

                          <ChevronRight
                            className={cn(
                              "w-4 h-4 flex-none text-[var(--ink-4)] transition-transform",
                              isOpen && "rotate-90"
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-[var(--line-soft)] space-y-2">
                            {/* Completed sessions */}
                            {topic.done.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-4)] mb-1.5">
                                  Completed
                                </p>
                                {topic.done.map((s) => (
                                  <div
                                    key={s.id}
                                    className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface-2)] px-3.5 py-2.5 flex items-center gap-3"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-[var(--ok)] flex-none" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12.5px] font-bold text-[var(--ink)]">
                                        Day {s.sessionDayNumber}
                                      </p>
                                      <p className="text-[11px] font-semibold text-[var(--ink-3)]">
                                        {s.scheduledDate}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(`/students/session/${s.id}`)
                                      }
                                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[7px] text-[11px] font-bold bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] flex-none"
                                    >
                                      Review
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Current reachable session */}
                            {isCurrent && activeSession && (
                              <div className="mt-2">
                                {topic.done.length > 0 && (
                                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-4)] mb-1.5">
                                    Now
                                  </p>
                                )}
                                <div className="rounded-[10px] border-2 border-[var(--brand)] bg-[var(--brand-soft)] px-3.5 py-3 flex items-center gap-3">
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
                                    onClick={() =>
                                      router.push(
                                        `/students/session/${activeSession.id}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[11.5px] font-bold bg-[var(--brand)] text-white flex-none"
                                  >
                                    Open
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Locked sessions (rest of current topic OR whole future topic) */}
                            {(isCurrent
                              ? lockedAhead
                              : isFuture
                                ? topic.todo
                                : []
                            ).length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-4)] mb-1.5">
                                  {isFuture ? "Upcoming" : "Coming up"}
                                </p>
                                {(isCurrent ? lockedAhead : topic.todo).map(
                                  (s) => (
                                    <div
                                      key={s.id}
                                      className="rounded-[10px] border border-[var(--line-soft)] px-3.5 py-2.5 flex items-center gap-3 opacity-70"
                                    >
                                      <Lock className="w-3.5 h-3.5 text-[var(--ink-4)] flex-none" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[12.5px] font-bold text-[var(--ink-3)]">
                                          Day {s.sessionDayNumber}
                                        </p>
                                        <p className="text-[11px] font-semibold text-[var(--ink-4)]">
                                          {s.scheduledDate}
                                        </p>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--ink-4)] flex-none">
                                        Locked
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
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