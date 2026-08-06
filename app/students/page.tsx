"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStudentDashboard, ApiError } from "@/lib/api";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDashboard()
      .then((d) => setData(d as StudentDashboardSummary))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  const session = data?.currentSession;
  const topic = session?.topic;
  const progress = data?.progress;
  const performance = data?.performance;
  const payments = data?.payments;

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
          Welcome back
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Pick up today&apos;s session, or review how you&apos;re doing.
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

        {!loading && !error && data && (
          <>
            {/* Current session card */}
            <section className="mt-8 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Current session
                  </p>
                  {topic ? (
                    <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-1">
                      {topic.title}
                    </h2>
                  ) : (
                    <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-1">
                      No active session
                    </h2>
                  )}
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

            {/* Stats row */}
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
          </>
        )}
      </main>
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