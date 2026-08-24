"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStudentMe, ApiError } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  FolderOpen,
  Loader2,
  TrendingUp,
  BookOpen,
  User,
  LogOut,
} from "lucide-react";

type StudentMe = {
  firstName?: string;
  lastName?: string;
  email?: string;
  arqId?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
  [key: string]: unknown;
};

export default function StudentProfilePage() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudentMe()
      .then((p) => setMe(p as StudentMe))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

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
          Profile
        </span>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-6 py-8">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Account
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          Your profile
        </h1>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <p className="mt-6 text-[13px] text-[var(--danger)] font-semibold">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Identity card */}
            <section className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] px-5 py-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-[12px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] flex-none">
                {fullName ? (
                  <span className="font-heading font-semibold text-[15px]">
                    {(me?.firstName?.[0] ?? "").toUpperCase()}
                    {(me?.lastName?.[0] ?? "").toUpperCase()}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-heading text-[15px] font-semibold text-[var(--ink)] truncate">
                  {fullName || "Student"}
                </p>
                <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5 truncate">
                  {[me?.email, me?.arqId].filter(Boolean).join(" · ") ||
                    "Learner"}
                </p>
                {(me?.academicLevel || me?.enrollmentDate) && (
                  <p className="text-[11px] text-[var(--ink-4)] font-semibold mt-0.5">
                    {[me?.academicLevel, me?.enrollmentDate]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </section>

            {/* Quick links */}
            <section className="mt-5 space-y-2">
              <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)] mb-2">
                Shortcuts
              </p>

              <ProfileLink
                href="/students/report"
                icon={TrendingUp}
                label="Progress & assessment"
                sub="Scores, accuracy, full report"
              />
              <ProfileLink
                href="/students/payments"
                icon={CreditCard}
                label="Payments"
                sub="History and plan status"
              />
              <ProfileLink
                href="/students/files"
                icon={FolderOpen}
                label="Uploaded work"
                sub="Files you’ve submitted"
              />
              <ProfileLink
                href="/students/learning-plan"
                icon={BookOpen}
                label="Learning plan"
                sub="Weeks, sessions, continue learning"
              />
            </section>

            <div className="mt-8">
              <Link
                href="/students/login"
                className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--ink-3)] hover:text-[var(--danger)]"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ProfileLink({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition-colors group"
    >
      <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] flex-none">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[var(--ink)]">{label}</p>
        <p className="text-[11px] text-[var(--ink-3)] font-semibold mt-0.5">
          {sub}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-[var(--ink-4)] group-hover:text-[var(--brand)] flex-none" />
    </Link>
  );
}