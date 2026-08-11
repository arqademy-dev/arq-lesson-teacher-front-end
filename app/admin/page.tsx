"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  getAdminDashboard,
  listPendingEducators,
  ApiError,
} from "@/lib/api";
import {
  Loader2,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminDashboard = {
  educators?: {
    total?: number;
    pendingApproval?: number;
    approved?: number;
  };
  students?: { total?: number };
  curriculum?: {
    subjects?: number;
    classes?: number;
    topics?: number;
    resources?: number;
  };
  payments?: {
    totalRevenueNaira?: number;
    pending?: number;
    successful?: number;
    failed?: number;
  };
  todaysActivity?: {
    totalSessionsScheduled?: number;
    completed?: number;
    remaining?: number;
  };
};

export default function AdminDashboardPage() {
  const [pending, setPending] = useState(0);
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, d] = await Promise.all([
          listPendingEducators().catch(() => []),
          getAdminDashboard().catch(() => null),
        ]);
        const pendingList = Array.isArray(p) ? p : [];
        setPending(pendingList.length);
        setDash(d as AdminDashboard | null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function logout() {
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="HQ" onLogout={logout}>
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Dashboard" subtitle="HQ" onLogout={logout}>
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
        <Link
          href="/admin/login"
          className="text-[12.5px] font-bold text-[var(--brand)]"
        >
          Go to login →
        </Link>
      </AdminShell>
    );
  }

  const edu = dash?.educators;
  const stu = dash?.students;
  const cur = dash?.curriculum;
  const pay = dash?.payments;
  const today = dash?.todaysActivity;

  const pendingCount = edu?.pendingApproval ?? pending;
  const todayTotal = today?.totalSessionsScheduled ?? 0;
  const todayDone = today?.completed ?? 0;
  const todayLeft = today?.remaining ?? 0;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="HQ"
      pendingCount={pendingCount}
      onLogout={logout}
    >
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric
          icon={Users}
          label="Educators"
          value={String(edu?.total ?? 0)}
          foot={`${edu?.approved ?? 0} approved · ${pendingCount} pending`}
          href="/admin/educators"
          hot={pendingCount > 0}
        />
        <Metric
          icon={GraduationCap}
          label="Students"
          value={String(stu?.total ?? 0)}
          foot="Across the system"
        />
        <Metric
          icon={CreditCard}
          label="Revenue"
          value={`₦${Number(pay?.totalRevenueNaira ?? 0).toLocaleString()}`}
          foot={`${pay?.successful ?? 0} paid · ${pay?.pending ?? 0} pending`}
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

      {/* Today progress */}
      <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
            Today&apos;s system activity
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
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Curriculum */}
        <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line-soft)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--brand)]" />
              <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
                Curriculum
              </h2>
            </div>
            <Link
              href="/admin/curriculum"
              className="text-[12px] font-bold text-[var(--brand)]"
            >
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-0">
            <Cell label="Subjects" value={cur?.subjects ?? 0} />
            <Cell label="Classes" value={cur?.classes ?? 0} />
            <Cell label="Topics" value={cur?.topics ?? 0} />
            <Cell label="Resources" value={cur?.resources ?? 0} />
          </div>
        </section>

        {/* Payments breakdown */}
        <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line-soft)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--brand)]" />
              <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
                Payments
              </h2>
            </div>
            <Link
              href="/admin/payments"
              className="text-[12px] font-bold text-[var(--brand)]"
            >
              Review →
            </Link>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--ink-3)] font-semibold">
                Total revenue
              </span>
              <span className="font-heading font-semibold text-[var(--ink)] tabular-nums">
                ₦{Number(pay?.totalRevenueNaira ?? 0).toLocaleString()}
              </span>
            </div>
            <PayRow
              label="Successful"
              value={pay?.successful ?? 0}
              tone="ok"
            />
            <PayRow label="Pending" value={pay?.pending ?? 0} tone="warn" />
            <PayRow label="Failed" value={pay?.failed ?? 0} tone="danger" />
          </div>
        </section>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/admin/educators"
          icon={Users}
          title="Educators"
          desc={
            pendingCount > 0
              ? `${pendingCount} awaiting approval`
              : "All educators approved"
          }
          hot={pendingCount > 0}
        />
        <QuickLink
          href="/admin/curriculum"
          icon={BookOpen}
          title="Curriculum"
          desc={`${cur?.topics ?? 0} topics · ${cur?.resources ?? 0} resources`}
        />
        <QuickLink
          href="/admin/payments"
          icon={CreditCard}
          title="Payments"
          desc={`₦${Number(pay?.totalRevenueNaira ?? 0).toLocaleString()} collected`}
        />
      </div>
    </AdminShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  foot,
  href,
  hot,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  foot: string;
  href?: string;
  hot?: boolean;
  tone?: "default" | "ok" | "warn";
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-[8px] grid place-items-center",
            hot
              ? "bg-[var(--warn-soft)] text-[var(--warn)]"
              : "bg-[var(--brand-soft)] text-[var(--brand)]"
          )}
        >
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

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4 border-b border-r border-[var(--line-soft)] last:border-r-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-[22px] font-semibold text-[var(--ink)] mt-1 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function PayRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger";
}) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-[var(--ink-3)] font-semibold">{label}</span>
      <span
        className={cn(
          "font-bold tabular-nums",
          tone === "ok" && "text-[var(--ok)]",
          tone === "warn" && "text-[var(--warn)]",
          tone === "danger" && "text-[var(--danger)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
  hot,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  hot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-[9px] grid place-items-center mb-3",
          hot
            ? "bg-[var(--warn-soft)] text-[var(--warn)]"
            : "bg-[var(--brand-soft)] text-[var(--brand)]"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
        {title}
      </h2>
      <p className="mt-1.5 text-[12.5px] text-[var(--ink-3)]">{desc}</p>
    </Link>
  );
}