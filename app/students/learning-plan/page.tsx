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
  type StudentPayment,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  X,
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

type DayState = "done" | "now" | "locked";

type PlanSession = {
  id: string;
  scheduledDate: string;
  sessionDayNumber: number;
  isCompleted: boolean;
  topicId: string;
  topicTitle: string;
  state: DayState;
};

type WeekGroup = {
  week: number;
  sessions: PlanSession[];
  days: { date: string; sessions: PlanSession[] }[];
  doneCount: number;
  isDone: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  firstDate: string;
  lastDate: string;
};

const DAY_MS = 86_400_000;

/**
 * The breakdown endpoint returns one entry per TOPIC, not per week. A "week"
 * is a calendar week counted from the plan's startDate (always a Monday), so
 * we group every session by which 7-day block its scheduledDate falls in.
 * This is why 13 topics over 3 weeks shows as 3 weeks, not 13.
 */
function buildWeeks(plan: LearningPlanBreakdownPlan): WeekGroup[] {
  const startMs = Date.parse(`${plan.startDate}T00:00:00Z`);

  // Flatten in topic (sequence) order first — the first unfinished session in
  // that order is the one the student is actually on, same as the backend's
  // getCurrentSession, which walks topics strictly in sequence.
  const flat = plan.topics.flatMap((t) =>
    [...t.done, ...t.todo].map((s) => ({
      id: s.id,
      scheduledDate: s.scheduledDate,
      sessionDayNumber: s.sessionDayNumber,
      isCompleted: s.isCompleted,
      topicId: t.topicId,
      topicTitle: t.topicTitle,
    }))
  );
  const nowId = flat.find((s) => !s.isCompleted)?.id ?? null;

  const byWeek = new Map<number, PlanSession[]>();
  for (const s of flat) {
    const week = Math.max(
      1,
      Math.floor((Date.parse(`${s.scheduledDate}T00:00:00Z`) - startMs) / DAY_MS / 7) + 1
    );
    const state: DayState = s.isCompleted ? "done" : s.id === nowId ? "now" : "locked";
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week)!.push({ ...s, state });
  }

  return Array.from(byWeek.keys())
    .sort((a, b) => a - b)
    .map((week) => {
      const sessions = byWeek
        .get(week)!
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)); // stable: keeps topic order within a date

      const dayMap = new Map<string, PlanSession[]>();
      for (const s of sessions) {
        if (!dayMap.has(s.scheduledDate)) dayMap.set(s.scheduledDate, []);
        dayMap.get(s.scheduledDate)!.push(s);
      }

      const doneCount = sessions.filter((s) => s.state === "done").length;
      const isDone = doneCount === sessions.length;
      const isCurrent = sessions.some((s) => s.state === "now");

      return {
        week,
        sessions,
        days: Array.from(dayMap.entries()).map(([date, list]) => ({ date, sessions: list })),
        doneCount,
        isDone,
        isCurrent,
        isFuture: !isDone && !isCurrent,
        firstDate: sessions[0].scheduledDate,
        lastDate: sessions[sessions.length - 1].scheduledDate,
      };
    });
}

function longDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function StudentLearningPlanPage() {
  const router = useRouter();
  const [me, setMe] = useState<StudentMe | null>(null);
  const [plans, setPlans] = useState<LearningPlanBreakdownPlan[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which week's popup is open (null = none).
  const [openWeekNo, setOpenWeekNo] = useState<number | null>(null);
  // Which completed session's action row (Review / AI Feedback) is open.
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "Failed to load your plan");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activePlan = useMemo(
    () => plans.find((p) => p.status === "active") ?? plans[0] ?? null,
    [plans]
  );

  const weeks = useMemo(() => (activePlan ? buildWeeks(activePlan) : []), [activePlan]);

  const currentWeekIdx = weeks.findIndex((w) => w.isCurrent);
  const completedWeeks = weeks.filter((w) => w.isDone).length;
  const totalSessions = weeks.reduce((n, w) => n + w.sessions.length, 0);
  const doneSessions = weeks.reduce((n, w) => n + w.doneCount, 0);
  const pct = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;

  const openWeek = weeks.find((w) => w.week === openWeekNo) ?? null;

  const planPayment: PlanPaymentState | null = useMemo(() => {
    if (!activePlan) return null;
    const forPlan = payments.filter((p) => p.learningPlanId === activePlan.planId);
    const success = forPlan.find((p) => p.status === "success");
    if (success) return { status: "success", payment: success };
    const pending = forPlan.find((p) => p.status === "pending");
    if (pending) return { status: "pending", payment: pending };
    return { status: "none", payment: null };
  }, [payments, activePlan]);

  function openWeekPopup(week: number) {
    setOpenWeekNo(week);
    setOpenActionsId(null);
  }

  function closeWeek() {
    setOpenWeekNo(null);
    setOpenActionsId(null);
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
            <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
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
                    You&apos;ve submitted payment for this plan — an admin needs to
                    approve it before your sessions unlock. Check back soon.
                  </p>
                ) : (
                  <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                    This learning plan needs to be paid for before you can start your
                    sessions. Submit payment below — an admin will review and approve
                    it.
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
              /* ── Real calendar weeks grid + popup ── */
              <section className="mt-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                      Study plan
                    </p>
                    <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5">
                      {weeks.length} week{weeks.length === 1 ? "" : "s"} ·{" "}
                      {activePlan.topics.length} topics · {completedWeeks} week
                      {completedWeeks === 1 ? "" : "s"} completed
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--ink-3)] capitalize">
                    {activePlan.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] font-bold text-[var(--ink-3)] mb-1.5">
                    <span>
                      Week {currentWeekIdx >= 0 ? weeks[currentWeekIdx].week : "—"} of{" "}
                      {weeks.length}
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

                {/* Week cards */}
                <div className="grid grid-cols-2 gap-3">
                  {weeks.map((w) => (
                    <button
                      key={w.week}
                      type="button"
                      onClick={() => openWeekPopup(w.week)}
                      className={cn(
                        "rounded-[14px] border text-left p-4 min-h-[100px] flex flex-col justify-between transition-colors",
                        w.isDone &&
                          "bg-[var(--brand)] border-[var(--brand)] text-white shadow-sm",
                        w.isCurrent &&
                          "bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] border-[var(--brand)] shadow-sm",
                        w.isFuture && "bg-[var(--surface)] border-[var(--line-soft)] opacity-70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div>
                          <p
                            className={cn(
                              "text-[10px] font-bold tracking-[0.14em] uppercase",
                              w.isDone ? "text-white/80" : "text-[var(--ink-3)]"
                            )}
                          >
                            Week
                          </p>
                          <p
                            className={cn(
                              "font-heading text-[22px] font-semibold leading-none mt-1",
                              w.isDone ? "text-white" : "text-[var(--ink)]"
                            )}
                          >
                            {w.week}
                          </p>
                        </div>
                        {w.isDone && (
                          <span className="w-6 h-6 rounded-full bg-white/20 grid place-items-center flex-none">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 w-full">
                        <p
                          className={cn(
                            "text-[12px] font-bold truncate",
                            w.isDone ? "text-white" : "text-[var(--ink)]"
                          )}
                        >
                          {w.isDone
                            ? "Completed"
                            : w.isFuture
                              ? "Locked"
                              : `${w.doneCount}/${w.sessions.length} done`}
                        </p>
                        <p
                          className={cn(
                            "text-[10.5px] font-semibold mt-0.5 truncate",
                            w.isDone ? "text-white/75" : "text-[var(--ink-3)]"
                          )}
                        >
                          {shortDate(w.firstDate)} – {shortDate(w.lastDate)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* ── Week detail POPUP ── */}
                {openWeek && (
                  <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                      onClick={closeWeek}
                      aria-label="Close"
                    />

                    <div className="relative z-10 w-full max-w-lg max-h-[88vh] sm:max-h-[85vh] mx-0 sm:mx-4 rounded-t-[20px] sm:rounded-[20px] bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col overflow-hidden">
                      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-[var(--line-soft)] flex-none">
                        <div className="min-w-0">
                          <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--brand)]">
                            Week {openWeek.week}
                          </p>
                          <h2 className="font-heading text-[17px] font-semibold text-[var(--ink)] mt-0.5">
                            {shortDate(openWeek.firstDate)} – {shortDate(openWeek.lastDate)}
                          </h2>
                          <p className="text-[11px] text-[var(--ink-3)] font-semibold mt-1">
                            {openWeek.doneCount}/{openWeek.sessions.length} topics done
                            {openWeek.isFuture && " · Locked until previous weeks are done"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={closeWeek}
                          className="w-11 h-11 rounded-full grid place-items-center bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex-none"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Days, each holding one or more topics */}
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                        {openWeek.days.map((day) => (
                          <div key={day.date}>
                            <p className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-[var(--ink-3)] mb-1.5 px-1">
                              {longDate(day.date)}
                            </p>
                            <div className="space-y-2">
                              {day.sessions.map((s) => {
                                const isDone = s.state === "done";
                                const isNow = s.state === "now";
                                const isLocked = s.state === "locked";
                                const actionsOpen = openActionsId === s.id;

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
                                        ) : isLocked ? (
                                          <Lock className="w-3.5 h-3.5" />
                                        ) : (
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        )}
                                      </span>

                                      <p className="min-w-0 flex-1 text-[13px] font-bold text-[var(--ink)] leading-snug">
                                        {s.topicTitle}
                                      </p>

                                      {isDone && (
                                        <div className="flex items-center gap-2 flex-none">
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ok-soft)] text-[var(--ok)]">
                                            Done
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setOpenActionsId((prev) =>
                                                prev === s.id ? null : s.id
                                              )
                                            }
                                            className="w-7 h-7 rounded-full grid place-items-center bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
                                            aria-label={actionsOpen ? "Hide actions" : "Show actions"}
                                            aria-expanded={actionsOpen}
                                          >
                                            <ChevronDown
                                              className={cn(
                                                "w-4 h-4 transition-transform",
                                                actionsOpen && "rotate-180"
                                              )}
                                            />
                                          </button>
                                        </div>
                                      )}

                                      {isNow && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            closeWeek();
                                            router.push(`/students/session/${s.id}`);
                                          }}
                                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[11.5px] font-bold bg-[var(--brand)] text-white flex-none"
                                        >
                                          Open
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {isLocked && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ink-4)] flex-none">
                                          Locked
                                        </span>
                                      )}
                                    </div>

                                    {isDone && actionsOpen && (
                                      <div className="mt-2.5 pt-2.5 border-t border-[var(--line-soft)] grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            closeWeek();
                                            router.push(`/students/session/${s.id}`);
                                          }}
                                          className="h-9 rounded-[9px] text-[12px] font-bold text-[var(--ink-2)] bg-[var(--surface-3)] hover:bg-[var(--surface-2)] transition"
                                        >
                                          Review
                                        </button>
                                        <Link
                                          href={`/students/feedback/${s.id}`}
                                          onClick={closeWeek}
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
                        ))}
                      </div>

                      <div className="flex-none px-4 py-3 border-t border-[var(--line-soft)]">
                        <button
                          type="button"
                          onClick={closeWeek}
                          className="w-full h-11 rounded-[10px] text-[13px] font-bold bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}