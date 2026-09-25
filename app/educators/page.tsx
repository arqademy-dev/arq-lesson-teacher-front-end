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
  UserPlus,
  Headphones,
} from "lucide-react";

type EducatorDashboard = {
  students?: { total?: number };
  payments?: {
    pending?: number;
    successful?: number;
    totalCollectedNaira?: number;
  };
  commission?: {
    totalEarnedNaira?: number;
    pendingNaira?: number;
  };
  programmes?: {
    active?: number;
    total?: number;
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
            , but an admin must approve it before you can enroll students.
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
  const commissionEarned = dash?.commission?.totalEarnedNaira ?? 0;
  const commissionPending = dash?.commission?.pendingNaira ?? 0;
  const activeProgrammes =
    dash?.programmes?.active ?? dash?.programmes?.total ?? 0;

  return (
    <EducatorShell
      title="STAFF ROOM"
      subtitle="Educator Workspace"
      userName={fullName}
      arqId={me.arqId}
      locked={locked}
      onLogout={handleLogout}
    >
      <p className="text-[13px] text-[var(--ink-3)] mb-6">
        Welcome back, {me.firstName}.
      </p>

      {/* Small metric cards */}
      <div className="grid gap-3 grid-cols-3 mb-6">
        <SmallMetric
          label="Students"
          value={String(studentsTotal)}
          foot="Enrolled"
        />
        <SmallMetric
          label="Commission"
          value={`₦${commissionEarned.toLocaleString()}`}
          foot={
            commissionPending > 0
              ? `₦${commissionPending.toLocaleString()} pending`
              : "20% of paid plans"
          }
        />
        <SmallMetric
          label="Active programmes"
          value={String(activeProgrammes)}
          foot="With your students"
        />
      </div>

      {/* Large action links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/educators/students"
          icon={Users}
          title="My students"
          desc="View learners and progress"
        />
        <QuickLink
          href="/educators/students/new"
          icon={UserPlus}
          title="Add new student"
          desc="Enroll into a published programme"
        />
        <QuickLink
          href="/educators/contact-hq"
          icon={Headphones}
          title="Contact HQ"
          desc="Reach ARQADEMY support"
        />
      </div>
    </EducatorShell>
  );
}

function SmallMetric({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-3 py-3 md:px-4 md:py-3.5 shadow-[var(--shadow-sm)] min-w-0">
      <div className="text-[9px] md:text-[9.5px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] truncate">
        {label}
      </div>
      <div className="font-heading text-[16px] md:text-[18px] font-semibold tabular-nums text-[var(--ink)] mt-1 truncate">
        {value}
      </div>
      <p className="mt-0.5 text-[10px] md:text-[11px] text-[var(--ink-3)] font-semibold truncate">
        {foot}
      </p>
    </div>
  );
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