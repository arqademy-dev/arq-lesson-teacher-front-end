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
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  User,
  FolderOpen,
  FileText,
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
          Your plan, progress, and next step.
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
            {/* Primary CTA — always go through the learning plan */}
            <section className="mt-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Next step
                  </p>
                  <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-1">
                    {topic?.title || "Your learning plan"}
                  </h2>
                </div>
                {session?.isOverdue && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--warn-soft)] text-[var(--warn)]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Catch-up needed
                  </span>
                )}
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Payment-aware primary button */}
                {payments?.hasSuccessfulPayment ? (
                  <Link
                    href="/students/learning-plan"
                    className={cn(
                      "mt-1 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold",
                      "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] transition-colors"
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    Continue learning
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : payments?.hasPendingPayment ? (
                  <div className="mt-1 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold bg-[var(--warn-soft)] text-[var(--warn)]">
                    <CreditCard className="w-4 h-4" />
                    Payment pending approval
                  </div>
                ) : (
                  <Link
                    href="/students/learning-plan"
                    className={cn(
                      "mt-1 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold",
                      "bg-[var(--danger)] text-white hover:opacity-90 transition-opacity"
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    Make payment to unlock
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </section>

            {/* Two cards only: Progress (→ report) + Payment (→ payments)
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Link
                href="/students/report"
                className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-[8px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Progress
                  </span>
                </div>
                <div className="font-heading text-[22px] font-semibold text-[var(--ink)]">
                  {progress?.percentComplete ?? 0}%
                </div>
                <p className="mt-1 text-[11.5px] text-[var(--ink-3)] font-semibold">
                  {progress?.completedTopics ?? 0} of{" "}
                  {progress?.totalTopics ?? 0} topics
                </p>
                <p className="mt-2 text-[11.5px] font-bold text-[var(--brand)] group-hover:underline">
                  View full assessment report →
                </p>
              </Link>

              <Link
                href="/students/payments"
                className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-[8px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Payment
                  </span>
                </div>
                <div
                  className={cn(
                    "font-heading text-[22px] font-semibold",
                    payments?.hasSuccessfulPayment
                      ? "text-[var(--ok)]"
                      : payments?.hasPendingPayment
                        ? "text-[var(--warn)]"
                        : "text-[var(--ink)]"
                  )}
                >
                  {payments?.hasSuccessfulPayment
                    ? "Active"
                    : payments?.hasPendingPayment
                      ? "Pending"
                      : "None"}
                </div>
                <p className="mt-1 text-[11.5px] text-[var(--ink-3)] font-semibold">
                  {payments?.hasSuccessfulPayment
                    ? "Plan unlocked"
                    : payments?.hasPendingPayment
                      ? "Awaiting approval"
                      : "No payment on file"}
                </p>
                <p className="mt-2 text-[11.5px] font-bold text-[var(--brand)] group-hover:underline">
                  View payments →
                </p>
              </Link>
            </div> */}

            {/* Light files entry — only useful for students who actually upload */}
            {/* <div className="mt-5">
              <Link
                href="/students/files"
                className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
              >
                <FolderOpen className="w-4 h-4" />
                My uploaded work
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div> */}
          </>
        )}
      </main>
    </div>
  );
}