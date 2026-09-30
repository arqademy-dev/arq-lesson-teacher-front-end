"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentDashboard,
  getStudentMe,
  getMyLearningPlanBreakdown,
  listStudentPayments,
  studentLogout,
  ApiError,
  type LearningPlanBreakdownPlan,
  type StudentPayment,
} from "@/lib/api";
import {
  BookOpen,
  LogOut,
  CreditCard,
  ArrowRight,
  User,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Matches your real /api/students/me response — everything about the
// student's enrolment (programme, class, phone, etc.) lives under
// studentProfile, not flat on the top-level object.
type StudentMe = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  arqId?: string;
  studentProfile?: {
    id?: string;
    educatorId?: string | null;
    programId?: string | null;
    programmeTitle?: string | null; // added by the backend patch
    classId?: string | null;
    className?: string | null; // if you add a similar join for class
    phone?: string | null;
    enrollmentDate?: string;
    academicLevel?: string | null;
  };
  [key: string]: unknown;
};

type DashPayments = {
  hasSuccessfulPayment?: boolean;
  hasPendingPayment?: boolean;
};

export default function StudentDashboardPage() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [plans, setPlans] = useState<LearningPlanBreakdownPlan[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [dashPayments, setDashPayments] = useState<DashPayments | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profile, breakdown, pays, dash] = await Promise.all([
          getStudentMe().catch(() => null),
          getMyLearningPlanBreakdown().catch(() => []),
          listStudentPayments().catch(() => []),
          getStudentDashboard().catch(() => null),
        ]);

        if (profile) setMe(profile as StudentMe);
        setPlans(Array.isArray(breakdown) ? breakdown : []);
        setPayments(Array.isArray(pays) ? pays : []);

        const d = dash as { payments?: DashPayments } | null;
        if (d?.payments) setDashPayments(d.payments);
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

  async function handleLogout() {
    try {
      await studentLogout();
    } finally {
      window.location.href = "/students/login";
    }
  }

  const activePlan =
    plans.find((p) => p.status === "active") ?? plans[0] ?? null;

  const paymentState = (() => {
    if (!activePlan) return "none" as const;

    const forPlan = payments.filter((p) => p.learningPlanId === activePlan.planId);
    if (forPlan.some((p) => p.status === "success")) return "success" as const;
    if (forPlan.some((p) => p.status === "pending")) return "pending" as const;

    if (dashPayments?.hasSuccessfulPayment) return "success" as const;
    if (dashPayments?.hasPendingPayment) return "pending" as const;

    return "none" as const;
  })();

  const fullName =
    me && (me.firstName || me.lastName)
      ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim()
      : null;

  // CHANGED — reads the real nested shape: me.studentProfile.programmeTitle,
  // falling back to className / academicLevel if those exist too.
  const programmeOrClass =
    me?.studentProfile?.programmeTitle ||
    me?.studentProfile?.className ||
    me?.studentProfile?.academicLevel ||
    null;

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl grid place-items-center border border-3 bg-[var(--brand-soft)] text-[var(--brand)] flex-none">
            N
          </span>
          <div className="leading-none">
            <div className="font-heading font-semibold text-[13px] tracking-[0.155em] text-[var(--ink)]">
              NEXT CLASS
            </div>
            <div className="mt-0.5 text-[8.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-4)]">
              Powered by Arqademy
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/students/profile"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:text-[var(--brand)]"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:text-[var(--brand)]"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10 pb-28">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          CLASSROOM
        </p>

        {loading ? (
          <div className="h-7 w-56 rounded-md bg-[var(--surface-3)] animate-pulse" />
        ) : (
          <h1 className="font-heading text-[22px] text-[var(--ink)]">
            {fullName ? `Welcome, ${me?.firstName?.trim()}` : "Welcome back"}
          </h1>
        )}

        {loading ? (
          <div className="mt-2 h-4 w-40 rounded bg-[var(--surface-3)] animate-pulse" />
        ) : (
          <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
            {programmeOrClass
              ? `Registered · ${programmeOrClass}`
              : "Your plan, payment, and next step."}
          </p>
        )}

        {loading && <DashboardSkeleton />}

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
          <section className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            {/* No learning plan */}
            {!activePlan && (
              <div className="px-5 py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full grid place-items-center mx-auto bg-[var(--warn-soft)] text-[var(--warn)]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                  No learning plan yet
                </h2>
                <p className="text-[13px] text-[var(--ink-3)] max-w-sm mx-auto leading-relaxed">
                  An admin needs to create your learning plan for your
                  programme. Please contact admin or your educator.
                </p>
              </div>
            )}

            {/* Has plan */}
            {activePlan && (
              <>
                <div className="px-5 py-4 border-b border-[var(--line-soft)]">
                  <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Active plan
                  </p>
                  <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-1">
                    {programmeOrClass || "Your learning plan"}
                  </h2>
                  <p className="text-[12px] text-[var(--ink-3)] mt-1">
                    {activePlan.startDate}
                    {activePlan.endDate ? ` → ${activePlan.endDate}` : ""}
                    {" · "}
                    <span className="capitalize">{activePlan.status}</span>
                    {" · "}
                    {activePlan.topics?.length ?? 0} topics
                  </p>
                </div>

                <div className="px-5 py-5">
                  {/* Paid → continue */}
                  {paymentState === "success" && (
                    <Link
                      href="/students/learning-plan"
                      className={cn(
                        "inline-flex items-center justify-center gap-3 h-14 px-8 rounded-[14px] w-full sm:w-auto",
                        "text-[15px] font-heading font-bold text-white",
                        "bg-[var(--brand)] hover:bg-[var(--brand-ink)]",
                        "shadow-lg hover:shadow-xl transition-all"
                      )}
                    >
                      <BookOpen className="w-5 h-5" />
                      Continue learning
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}

                  {/* Pending approval */}
                  {paymentState === "pending" && (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center gap-3 h-12 px-6 rounded-[12px] w-full sm:w-auto text-[14px] font-bold bg-[var(--warn-soft)] text-[var(--warn)]">
                        <CreditCard className="w-5 h-5" />
                        Payment pending approval
                      </div>
                      <p className="text-[12.5px] text-[var(--ink-3)]">
                        Your payment is waiting for admin approval. Content
                        unlocks once it is approved.
                      </p>
                      <Link
                        href="/students/payments"
                        className="text-[12px] font-bold text-[var(--brand)]"
                      >
                        View payments →
                      </Link>
                    </div>
                  )}

                  {/* Need to pay */}
                  {paymentState === "none" && (
                    <div className="space-y-3">
                      <p className="text-[13px] text-[var(--ink-3)] leading-relaxed">
                        Your learning plan is ready. Complete payment to unlock
                        sessions and weekly quizzes.
                      </p>
                      <Link
                        href="/students/learning-plan"
                        className={cn(
                          "inline-flex items-center justify-center gap-3 h-14 px-8 rounded-[14px] w-full sm:w-auto",
                          "text-[15px] font-heading font-bold text-white",
                          "bg-[var(--danger)] hover:opacity-90",
                          "shadow-lg transition-all"
                        )}
                      >
                        <CreditCard className="w-5 h-5" />
                        Make payment to unlock
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <Link
        href="/students/community"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-12 px-5 rounded-full text-[13px] font-bold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)] shadow-lg hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
      >
        <MessageCircle className="w-[18px] h-[18px]" />
        Community
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-[var(--line-soft)] space-y-2">
        <div className="h-2.5 w-20 rounded bg-[var(--surface-3)]" />
        <div className="h-4 w-48 rounded bg-[var(--surface-3)]" />
        <div className="h-3 w-64 rounded bg-[var(--surface-3)]" />
      </div>
      <div className="px-5 py-5">
        <div className="h-14 w-full sm:w-64 rounded-[14px] bg-[var(--surface-3)]" />
      </div>
    </div>
  );
}