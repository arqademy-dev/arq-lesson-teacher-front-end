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
import { Loader2, Clock, ShieldOff, Users } from "lucide-react";

export default function EducatorHomePage() {
  const [me, setMe] = useState<EducatorProfile | null>(null);
  const [dash, setDash] = useState<unknown>(null);
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
              setDash(d);
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

  // ---- PENDING ----
  if (me.accountApproval === "pending") {
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

  // ---- BLOCKED ----
  if (
    me.accountApproval === "suspended" ||
    me.accountApproval === "closed"
  ) {
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
            Account {me.accountApproval}
          </h2>
          <p className="mt-3 text-[14px] text-[var(--ink-2)] leading-relaxed">
            This educator account cannot access the portal. Contact ARQADEMY HQ.
          </p>
        </div>
      </EducatorShell>
    );
  }

  // ---- APPROVED ----
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
        Welcome back, {me.firstName}. Your account is approved.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/educators/students"
          className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition"
        >
          <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] mb-3">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
            My students
          </h2>
          <p className="mt-1.5 text-[12.5px] text-[var(--ink-3)]">
            Enroll and manage learners.
          </p>
        </Link>
      </div>

      {dash != null && (
        <pre className="mt-8 text-[11px] text-[var(--ink-3)] overflow-auto max-h-48 rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)]">
          {JSON.stringify(dash, null, 2)}
        </pre>
      )}
    </EducatorShell>
  );
}