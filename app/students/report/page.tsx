"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStudentReport, getStudentMe, ApiError } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  Target,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AssessmentSummary = {
  totalSubmissions?: number;
  correctSubmissions?: number;
  accuracyPercent?: number;
  averageScore?: number;
  byInteractionType?: Record<
    string,
    { total?: number; correct?: number }
  >;
};

type PlanTopic = {
  topicTitle?: string;
  status?: string;
  totalSessions?: number;
  completedSessions?: number;
};

type PlanRow = {
  planId?: string;
  status?: string;
  startDate?: string;
  paymentStatus?: string;
  topics?: PlanTopic[];
};

type StudentReport = {
  student?: {
    id?: string;
    academicLevel?: string | null;
    enrollmentDate?: string;
  };
  learningPlans?: PlanRow[];
  assessmentSummary?: AssessmentSummary;
};

export default function StudentReportPage() {
  const [report, setReport] = useState<StudentReport | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, data] = await Promise.all([
          getStudentMe().catch(() => null),
          getStudentReport(),
        ]);
        if (me) {
          const m = me as { firstName?: string; lastName?: string };
          const n = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
          if (n) setName(n);
        }
        setReport(data as StudentReport);
        setRaw(data);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed to load report"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = report?.assessmentSummary;
  const plans = report?.learningPlans ?? [];

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
          Report
        </span>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Assessment
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          {name ? `${name.split(" ")[0]}'s report` : "My report"}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Progress across plans and how you have been scoring on interactions.
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading report…
          </div>
        )}

        {error && (
          <p className="mt-6 text-[13px] text-[var(--danger)] font-semibold">
            {error}
          </p>
        )}

        {!loading && !error && report && (
          <>
            {/* Profile strip */}
            {report.student && (
              <div className="mt-8 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)] flex flex-wrap gap-x-6 gap-y-2 text-[12.5px]">
                <span className="text-[var(--ink-3)] font-semibold">
                  Level{" "}
                  <b className="text-[var(--ink)]">
                    {report.student.academicLevel || "—"}
                  </b>
                </span>
                <span className="text-[var(--ink-3)] font-semibold">
                  Enrolled{" "}
                  <b className="text-[var(--ink)]">
                    {report.student.enrollmentDate || "—"}
                  </b>
                </span>
              </div>
            )}

            {/* Assessment summary cards */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <MiniStat
                icon={Target}
                label="Accuracy"
                value={`${summary?.accuracyPercent ?? 0}%`}
                sub={`${summary?.correctSubmissions ?? 0}/${summary?.totalSubmissions ?? 0} correct`}
              />
              <MiniStat
                icon={TrendingUp}
                label="Average score"
                value={`${summary?.averageScore ?? 0}`}
                sub="Per submission"
              />
              <MiniStat
                icon={BookOpen}
                label="Submissions"
                value={`${summary?.totalSubmissions ?? 0}`}
                sub="All interactions"
              />
            </div>

            {/* By interaction type */}
            {summary?.byInteractionType &&
              Object.keys(summary.byInteractionType).length > 0 && (
                <section className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[var(--line-soft)] font-heading text-[13px] font-semibold text-[var(--ink)]">
                    By interaction type
                  </div>
                  <ul>
                    {Object.entries(summary.byInteractionType).map(
                      ([type, stats]) => {
                        const total = stats.total ?? 0;
                        const correct = stats.correct ?? 0;
                        const pct =
                          total > 0 ? Math.round((correct / total) * 100) : 0;
                        return (
                          <li
                            key={type}
                            className="flex items-center gap-3 px-5 py-3 border-b border-[var(--line-soft)] last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-[var(--ink)] capitalize">
                                {type.replace(/_/g, " ")}
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden max-w-[200px]">
                                <i
                                  className="block h-full rounded-full bg-[var(--brand)]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right text-[12px] font-semibold text-[var(--ink-3)]">
                              {correct}/{total}
                              <span className="block text-[var(--ink)] font-bold">
                                {pct}%
                              </span>
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </section>
              )}

            {/* Learning plans */}
            <section className="mt-6">
              <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)] mb-3">
                Learning plans
              </h2>
              {plans.length === 0 ? (
                <p className="text-[13px] text-[var(--ink-3)]">
                  No learning plans on this report yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan, i) => (
                    <div
                      key={plan.planId ?? i}
                      className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-[var(--line-soft)] flex flex-wrap items-center gap-2 justify-between">
                        <div>
                          <span className="font-bold text-[13px] text-[var(--ink)]">
                            Plan {plan.planId ? plan.planId.slice(0, 8) : i + 1}
                          </span>
                          {plan.startDate && (
                            <span className="ml-2 text-[11px] text-[var(--ink-3)] font-semibold">
                              from {plan.startDate}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {plan.status && (
                            <Chip label={plan.status} tone="brand" />
                          )}
                          {plan.paymentStatus && (
                            <Chip
                              label={plan.paymentStatus}
                              tone={
                                plan.paymentStatus === "success"
                                  ? "ok"
                                  : plan.paymentStatus === "pending"
                                    ? "warn"
                                    : "muted"
                              }
                            />
                          )}
                        </div>
                      </div>
                      {(plan.topics ?? []).length === 0 ? (
                        <p className="px-5 py-4 text-[12.5px] text-[var(--ink-3)]">
                          No topics listed.
                        </p>
                      ) : (
                        <ul>
                          {(plan.topics ?? []).map((t, j) => {
                            const done = t.completedSessions ?? 0;
                            const total = t.totalSessions ?? 0;
                            return (
                              <li
                                key={j}
                                className="flex items-center gap-3 px-5 py-3 border-b border-[var(--line-soft)] last:border-0"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                                    {t.topicTitle || "Topic"}
                                  </div>
                                  <div className="text-[11px] text-[var(--ink-3)] font-semibold mt-0.5 capitalize">
                                    {t.status || "—"} · {done}/{total} sessions
                                  </div>
                                </div>
                                {total > 0 && (
                                  <div className="w-16 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden flex-none">
                                    <i
                                      className="block h-full rounded-full bg-[var(--brand)]"
                                      style={{
                                        width: `${Math.round(
                                          (done / total) * 100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {raw != null && (
              <details className="mt-8">
                <summary className="text-[12px] font-bold text-[var(--ink-3)] cursor-pointer">
                  Raw report JSON
                </summary>
                <pre className="mt-2 text-[11px] text-[var(--ink-3)] overflow-auto max-h-72 rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)]">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
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
      <div className="font-heading text-[22px] font-semibold text-[var(--ink)]">
        {value}
      </div>
      <p className="mt-1 text-[11.5px] text-[var(--ink-3)] font-semibold">{sub}</p>
    </div>
  );
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "brand" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize",
        tone === "ok" && "bg-[var(--ok-soft)] text-[var(--ok)]",
        tone === "warn" && "bg-[var(--warn-soft)] text-[var(--warn)]",
        tone === "brand" && "bg-[var(--brand-soft)] text-[var(--brand)]",
        tone === "muted" && "bg-[var(--surface-3)] text-[var(--ink-3)]"
      )}
    >
      {label}
    </span>
  );
}