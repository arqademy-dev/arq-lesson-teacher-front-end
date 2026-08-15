"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentDashboard,
  getStudentMe,
  ApiError,
} from "@/lib/api";
import type { StudentDashboardSummary } from "@/components/learning/types";
import {
  BookOpen,
  Loader2,
  LogOut,
  Target,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudentMe = {
  id?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  arqId?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
  educatorId?: string;
  role?: string;
  [key: string]: unknown;
};

export default function StudentDashboardPage() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [data, setData] = useState<StudentDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profile, dash] = await Promise.all([
          getStudentMe().catch(() => null),
          getStudentDashboard(),
        ]);
        if (profile) setMe(profile as StudentMe);
        setData(dash as StudentDashboardSummary);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const session = data?.currentSession;
  const topic = session?.topic;
  const progress = data?.progress;
  const performance = data?.performance;
  const payments = data?.payments;

  const fullName =
    me && (me.firstName || me.lastName)
      ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
      : null;

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <div className="flex items-center gap-2.5">
          <span className="font-heading font-semibold text-[13px] tracking-[0.155em] text-[var(--ink)]">
            ARQADEMY
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-3)]">
            Student
          </span>
        </div>
        <Link
          href="/students/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Link>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Dashboard
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          {fullName ? `Welcome, ${me?.firstName?.trim()}` : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Your profile, progress, and today&apos;s session.
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[var(--ink-3)] text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your dashboard…
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
            {/* Student profile card */}
            <section className="mt-8 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              
              {/* If no successful payment, primary CTA goes to payments */}
              {payments && !payments.hasSuccessfulPayment ? (
                <Link
                  href="/students/payments"
                  className={cn(
                    "mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold",
                    "bg-[var(--danger)] text-white hover:opacity-90 mx-2 w-auto"
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  Unlock with payment
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                // <Link
                //   href="/students/session"
                //   className={cn(
                //     "mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold",
                //     "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
                //   )}
                // >
                //   <BookOpen className="w-4 h-4" />
                //   {session?.isOverdue ? "Continue catch-up session" : "Go to today's session"}
                //   <ArrowRight className="w-4 h-4" />
                // </Link>
                ""
              )}

              <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-center gap-3">
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
                  <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] truncate">
                    {fullName || "Student"}
                  </h2>
                  <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5">
                    {[me?.arqId, me?.academicLevel].filter(Boolean).join(" · ") ||
                      "Learner profile"}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 grid gap-3 sm:grid-cols-2 text-[12.5px]">
                <InfoRow label="Email" value={me?.email} />
                <InfoRow label="Arq ID" value={me?.arqId} />
                <InfoRow label="Academic level" value={me?.academicLevel} />
                <InfoRow
                  label="Enrolled"
                  value={
                    me?.enrollmentDate
                      ? String(me.enrollmentDate)
                      : undefined
                  }
                />
              </div>

              {/* If profile shape is unexpected, still show raw for debugging */}
              {me && !me.firstName && !me.email && (
                <details className="px-5 pb-4">
                  <summary className="text-[11px] font-bold text-[var(--ink-4)] cursor-pointer">
                    Raw profile JSON
                  </summary>
                  <pre className="mt-2 text-[11px] text-[var(--ink-3)] overflow-auto max-h-40">
                    {JSON.stringify(me, null, 2)}
                  </pre>
                </details>
              )}
            </section>


            {/* Current session */}
            <section className="mt-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Current session
                  </p>
                  <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-1">
                    {topic?.title || "No active session"}
                  </h2>
                </div>
                {session?.isOverdue && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--warn-soft)] text-[var(--warn)]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Catch-up
                  </span>
                )}
              </div>

              <div className="px-5 py-4 space-y-3">
                {session && topic ? (
                  <>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[var(--ink-3)] font-semibold">
                      <span>Day {session.session.sessionDayNumber}</span>
                      <span>Scheduled {session.session.scheduledDate}</span>
                      <span>
                        {session.resources?.length ?? 0} resource
                        {(session.resources?.length ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    {topic.description && topic.description !== "string" && (
                      <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                        {topic.description}
                      </p>
                    )}
                    <Link
                      href="/students/session"
                      className={cn(
                        "mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold",
                        "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] transition-colors"
                      )}
                    >
                      <BookOpen className="w-4 h-4" />
                      {session.isOverdue
                        ? "Continue catch-up session"
                        : "Go to today's session"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <p className="text-[13px] text-[var(--ink-3)]">
                    You don&apos;t have an open session right now. Check with
                    your educator if you expected one.
                  </p>
                )}
              </div>
            </section>

            {/* Stats */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={TrendingUp}
                label="Progress"
                value={`${progress?.percentComplete ?? 0}%`}
                sub={`${progress?.completedTopics ?? 0} of ${progress?.totalTopics ?? 0} topics`}
              />
              <StatCard
                icon={Target}
                label="Accuracy"
                value={`${performance?.accuracyPercent ?? 0}%`}
                sub={`${performance?.correctSubmissions ?? 0}/${performance?.totalSubmissions ?? 0} correct`}
              />
              <StatCard
                icon={CreditCard}
                label="Payment"
                value={
                  payments?.hasSuccessfulPayment
                    ? "Active"
                    : payments?.hasPendingPayment
                      ? "Pending"
                      : "None"
                }
                sub={
                  payments?.hasSuccessfulPayment
                    ? "Plan unlocked"
                    : payments?.hasPendingPayment
                      ? "Awaiting approval"
                      : "No payment on file"
                }
                tone={
                  payments?.hasSuccessfulPayment
                    ? "ok"
                    : payments?.hasPendingPayment
                      ? "warn"
                      : "muted"
                }
              />
            </div>

            <div className="mt-5">
              <Link
                href="/students/report"
                className="text-[12.5px] font-bold text-[var(--brand)] hover:underline"
              >
                View full assessment report →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line-soft)] pb-2 last:border-0">
      <span className="text-[var(--ink-3)] font-semibold">{label}</span>
      <span className="font-bold text-[var(--ink)] text-right truncate max-w-[60%]">
        {value && String(value).trim() ? String(value) : "—"}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "ok" | "warn" | "muted";
}) {
  const valueColor =
    tone === "ok"
      ? "text-[var(--ok)]"
      : tone === "warn"
        ? "text-[var(--warn)]"
        : "text-[var(--ink)]";

  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-[8px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
          {label}
        </span>
      </div>
      <div className={cn("font-heading text-[22px] font-semibold", valueColor)}>
        {value}
      </div>
      <p className="mt-1 text-[11.5px] text-[var(--ink-3)] font-semibold">{sub}</p>
    </div>
  );
}