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
  CreditCard,
  AlertTriangle,
  ArrowRight,
  User,
  MessageCircle,
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
  const payments = data?.payments;

  const fullName =
    me && (me.firstName || me.lastName)
      ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
      : null;

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <div className="flex items-center gap-2.5">
          <span className="font-heading font-semibold text-[13px] tracking-[0.155em] text-[var(--ink)]">
            ARQADEMY
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-3)]">
            Student
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/students/profile"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <Link
            href="/students/login"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10 pb-28">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Dashboard
        </p>

        <div>
          <h1 className="font-heading text-[22px] text-[var(--ink)]">
            {fullName ? `Welcome, ${me?.firstName?.trim()}` : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
            Your plan, progress, and next step.
          </p>
        </div>

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
            <section className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
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

              <div className="px-5 py-5">
                {payments?.hasSuccessfulPayment ? (
                  <Link
                    href="/students/learning-plan"
                    className={cn(
                      "inline-flex items-center justify-center gap-3 h-14 px-8 rounded-[14px] w-full sm:w-auto",
                      "text-[15px] font-heading font-bold text-white",
                      "bg-[var(--brand)] hover:bg-[var(--brand-ink)]",
                      "shadow-lg hover:shadow-xl hover:scale-[1.015] active:scale-[0.99] transition-all"
                    )}
                  >
                    <BookOpen className="w-5 h-5" />
                    Continue learning
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : payments?.hasPendingPayment ? (
                  <div className="inline-flex items-center justify-center gap-3 h-14 px-8 rounded-[14px] w-full sm:w-auto text-[15px] font-bold bg-[var(--warn-soft)] text-[var(--warn)]">
                    <CreditCard className="w-5 h-5" />
                    Payment pending approval
                  </div>
                ) : (
                  <Link
                    href="/students/learning-plan"
                    className={cn(
                      "inline-flex items-center justify-center gap-3 h-14 px-8 rounded-[14px] w-full sm:w-auto",
                      "text-[15px] font-heading font-bold text-white",
                      "bg-[var(--danger)] hover:opacity-90",
                      "shadow-lg hover:shadow-xl hover:scale-[1.015] active:scale-[0.99] transition-all"
                    )}
                  >
                    <CreditCard className="w-5 h-5" />
                    Make payment to unlock
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Community — fixed, stays put through scroll */}
      <Link
        href="/students/community"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 h-12 px-5 rounded-full text-[13px] font-bold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)] shadow-lg hover:shadow-xl hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
      >
        <MessageCircle className="w-[18px] h-[18px]" />
        Community
      </Link>
    </div>
  );
}