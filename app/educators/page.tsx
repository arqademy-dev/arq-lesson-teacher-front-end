"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getEducatorMe,
  getEducatorDashboard,
  educatorLogout,
  ApiError,
  type EducatorProfile,
  educatorIsApproved,
  educatorApprovalStatus,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  Loader2,
  Clock,
  ShieldOff,
  Users,
  CalendarDays,
  CreditCard,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EducatorDashboard = {
  students?: { total?: number };
  learningPlans?: { total?: number; active?: number };
  payments?: {
    pending?: number;
    successful?: number;
    totalCollectedNaira?: number;
  };
  todaysActivity?: {
    totalSessionsScheduled?: number;
    completed?: number;
    remaining?: number;
  };
};

export default function EducatorHomePage() {
  const [me, setMe] = useState<EducatorProfile | null>(null);
  const [dash, setDash] = useState<EducatorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getEducatorMe();
        setMe(profile);

        if (educatorIsApproved(profile)) {
          try {
            const d = await getEducatorDashboard();
            setDash(d as EducatorDashboard);
          } catch {
            /* optional */
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  if (loading) {
    return (
      <EducatorShell title="Loading" locked onLogout={handleLogout}>
        <div className="flex items-center gap-2 py-16 justify-center text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your account…
        </div>
      </EducatorShell>
    );
  }

  if (error || !me) {
    return (
      <EducatorShell title="Sign in required" locked onLogout={handleLogout}>
        <div className="max-w-md mx-auto py-12 text-center space-y-3">
          <p className="text-[13px] text-[var(--danger)] font-semibold">
            {error || "Could not load profile"}
          </p>
          <Link
            href="/educators/login"
            className="inline-flex text-[12.5px] font-bold text-[var(--brand)]"
          >
            Go to login →
          </Link>
        </div>
      </EducatorShell>
    );
  }

  const status = educatorApprovalStatus(me);
  const locked = !educatorIsApproved(me);
  const fullName = `${me.firstName} ${me.lastName}`.trim();

  if (status === "pending") {
    return (
      <EducatorShell
        title="Account pending"
        subtitle="Access"
        userName={fullName}
        arqId={me.arqId}
        locked
        onLogout={handleLogout}
      >
        <div className="max-w-lg mx-auto py-10 text-center">
          <div className="w-14 h-14 rounded-[14px] grid place-items-center mx-auto mb-5 bg-[var(--warn-soft)] text-[var(--warn)]">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="font-heading text-[20px] text-[var(--ink)]">
            Waiting for admin approval
          </h2>
          <p className="mt-3 text-[14px] text-[var(--ink-2)] leading-relaxed">
            Hi {me.firstName}. Your educator account is registered
            {me.arqId ? (
              <>
                {" "}
                (<span className="font-bold text-[var(--ink)]">{me.arqId}</span>)
              </>
            ) : null}
            , but an admin must approve it before you can enroll students or
            build learning plans.
          </p>
          <p className="mt-4 text-[12.5px] text-[var(--ink-3)] font-semibold">
            The sidebar stays locked until you are approved.
          </p>
        </div>
      </EducatorShell>
    );
  }

  if (status === "suspended" || status === "closed") {
    return (
      <EducatorShell
        title={`Account ${status}`}
        subtitle="Access"
        userName={fullName}
        arqId={me.arqId}
        locked
        onLogout={handleLogout}
      >
        <div className="max-w-lg mx-auto py-10 text-center">
          <div className="w-14 h-14 rounded-[14px] grid place-items-center mx-auto mb-5 bg-[var(--danger-soft)] text-[var(--danger)]">
            <ShieldOff className="w-7 h-7" />
          </div>
          <h2 className="font-heading text-[20px] text-[var(--ink)]">
            Account {status}
          </h2>
          <p className="mt-3 text-[14px] text-[var(--ink-2)] leading-relaxed">
            This educator account cannot access the portal. Contact ARQADEMY HQ.
          </p>
        </div>
      </EducatorShell>
    );
  }

  const studentsTotal = dash?.students?.total ?? 0;
  const plansTotal = dash?.learningPlans?.total ?? 0;
  const plansActive = dash?.learningPlans?.active ?? 0;
  const payPending = dash?.payments?.pending ?? 0;
  const paySuccess = dash?.payments?.successful ?? 0;
  const collected = dash?.payments?.totalCollectedNaira ?? 0;
  const todayTotal = dash?.todaysActivity?.totalSessionsScheduled ?? 0;
  const todayDone = dash?.todaysActivity?.completed ?? 0;
  const todayLeft = dash?.todaysActivity?.remaining ?? 0;

  return (
    <EducatorShell
      title="Today"
      subtitle="Classroom"
      userName={fullName}
      arqId={me.arqId}
      locked={locked}
      onLogout={handleLogout}
    >
      <p className="text-[13px] text-[var(--ink-3)] mb-6">
        Welcome back, {me.firstName}. Here is your classroom snapshot.
      </p>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric
          icon={Users}
          label="Students"
          value={String(studentsTotal)}
          foot="Enrolled with you"
          href="/educators/students"
        />
        <Metric
          icon={CalendarDays}
          label="Learning plans"
          value={String(plansActive)}
          foot={`${plansTotal} total · ${plansActive} active`}
          href="/educators/learning-plans"
        />
        <Metric
          icon={CreditCard}
          label="Collected"
          value={`₦${collected.toLocaleString()}`}
          foot={`${paySuccess} paid · ${payPending} pending`}
        />
        <Metric
          icon={Activity}
          label="Today"
          value={`${todayDone}/${todayTotal}`}
          foot={
            todayLeft > 0
              ? `${todayLeft} session${todayLeft === 1 ? "" : "s"} left`
              : todayTotal === 0
                ? "No sessions scheduled"
                : "All sessions done"
          }
          tone={todayLeft > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Today strip */}
      <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
            Today&apos;s sessions
          </h2>
          <span className="text-[11.5px] font-bold text-[var(--ink-3)]">
            {todayDone} completed · {todayLeft} remaining
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
          <i
            className="block h-full rounded-full bg-[var(--brand)] transition-all"
            style={{
              width: `${
                todayTotal > 0
                  ? Math.round((todayDone / todayTotal) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
        {todayTotal === 0 && (
          <p className="mt-3 text-[12.5px] text-[var(--ink-3)]">
            No student sessions on the calendar for today.
          </p>
        )}
      </section>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/educators/students"
          icon={Users}
          title="My students"
          desc="Enroll and open profiles"
        />
        <QuickLink
          href="/educators/learning-plans"
          icon={CalendarDays}
          title="Learning plans"
          desc="Schedules and topics"
        />
        <QuickLink
          href="/educators/reports"
          icon={FileText}
          title="Reports"
          desc="Assessment summaries"
        />
      </div>
    </EducatorShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  foot,
  href,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  foot: string;
  href?: string;
  tone?: "default" | "ok" | "warn";
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-[8px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "font-heading text-[22px] font-semibold tabular-nums",
          tone === "ok" && "text-[var(--ok)]",
          tone === "warn" && "text-[var(--warn)]",
          tone === "default" && "text-[var(--ink)]"
        )}
      >
        {value}
      </div>
      <p className="mt-1 text-[11.5px] text-[var(--ink-3)] font-semibold">
        {foot}
      </p>
    </>
  );

  const className =
    "rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] block hover:border-[var(--brand)] transition";

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition"
    >
      <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
        {title}
      </h2>
      <p className="mt-1.5 text-[12.5px] text-[var(--ink-3)]">{desc}</p>
    </Link>
  );
}