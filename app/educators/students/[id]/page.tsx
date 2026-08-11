"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  getEducatorStudent,
  getEducatorStudentReport,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  CalendarDays,
  Target,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudentInfo = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  arqId?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
  educatorId?: string;
  userId?: string;
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

type AssessmentSummary = {
  totalSubmissions?: number;
  correctSubmissions?: number;
  accuracyPercent?: number;
  averageScore?: number;
  byInteractionType?: Record<string, { total?: number; correct?: number }>;
};

type Report = {
  student?: StudentInfo;
  learningPlans?: PlanRow[];
  assessmentSummary?: AssessmentSummary;
};

export default function EducatorStudentDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [educatorName, setEducatorName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setEducatorName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }

        const [stuRes, reportRes] = await Promise.all([
          getEducatorStudent(id).catch((e) => null),
          getEducatorStudentReport(id).catch((e) => null),
        ]);

        // API may return flat student or { student: {...} }
        const raw = stuRes as Record<string, unknown> | null;
        const stu =
          (raw?.student as StudentInfo | undefined) ||
          (raw as StudentInfo | null);
        setStudent(stu);

        setReport((reportRes as Report) || null);

        if (!stu && !reportRes) {
          setError("Could not load this student.");
        }
      } catch (err) {
        setError(
          err instanceof ApiError
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  const display = student || report?.student;
  const fullName =
    display && (display.firstName || display.lastName)
      ? `${display.firstName ?? ""} ${display.lastName ?? ""}`.trim()
      : "Student";

  const plans = report?.learningPlans ?? [];
  const summary = report?.assessmentSummary;

  return (
    <EducatorShell
      title={fullName}
      subtitle="Classroom"
      userName={educatorName}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <Link
        href="/educators/students"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        All students
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading student…
        </div>
      )}

      {error && (
        <p className="text-[13px] font-semibold text-[var(--danger)] mb-4">
          {error}
        </p>
      )}

      {!loading && display && (
        <div className="space-y-5 max-w-3xl">
          {/* Profile */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-[var(--line-soft)]">
              <div className="w-11 h-11 rounded-[11px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] font-heading font-semibold text-[14px] flex-none">
                {(display.firstName?.[0] ?? "?").toUpperCase()}
                {(display.lastName?.[0] ?? "").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                  {fullName}
                </h2>
                <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5">
                  {[display.email, display.arqId].filter(Boolean).join(" · ") ||
                    "Learner"}
                </p>
              </div>
              <Link
                href={`/educators/students/${id}/learning-plan`}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                View learning plan
              </Link>
            </div>
            <div className="px-5 py-4 grid gap-3 sm:grid-cols-2 text-[12.5px]">
              <InfoRow label="Academic level" value={display.academicLevel} />
              <InfoRow label="Enrolled" value={display.enrollmentDate} />
              <InfoRow label="Email" value={display.email} />
              <InfoRow
                label="Student id"
                value={display.id ? display.id.slice(0, 8) + "…" : undefined}
              />
            </div>
          </section>

          {/* Assessment summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Target}
              label="Accuracy"
              value={`${summary?.accuracyPercent ?? 0}%`}
              sub={`${summary?.correctSubmissions ?? 0}/${summary?.totalSubmissions ?? 0} correct`}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg score"
              value={`${summary?.averageScore ?? 0}`}
              sub="Per submission"
            />
            <StatCard
              icon={BookOpen}
              label="Submissions"
              value={`${summary?.totalSubmissions ?? 0}`}
              sub="All interactions"
            />
          </div>

          {/* By interaction type */}
          {summary?.byInteractionType &&
            Object.keys(summary.byInteractionType).length > 0 && (
              <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
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
                            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden max-w-[180px]">
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

          {/* Learning plans from report */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)]">
                Learning plans
              </h2>
              <Link
                href={`/educators/students/${id}/learning-plan`}
                className="text-[12.5px] font-bold text-[var(--brand)]"
              >
                Open plans →
              </Link>
            </div>

            {plans.length === 0 ? (
              <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-8 text-center">
                <p className="text-[13px] text-[var(--ink-3)]">
                  No learning plan on this report yet.
                </p>
                <Link
                  href={`/educators/students/${id}/learning-plan`}
                  className="mt-3 inline-flex text-[12.5px] font-bold text-[var(--brand)]"
                >
                  View / assign plan →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan, i) => (
                  <article
                    key={plan.planId ?? i}
                    className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-[var(--line-soft)] flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <span className="font-bold text-[13px] text-[var(--ink)]">
                          Plan{" "}
                          {plan.planId
                            ? plan.planId.slice(0, 8)
                            : i + 1}
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
                            label={`Pay · ${plan.paymentStatus}`}
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
                          const pct =
                            total > 0
                              ? Math.round((done / total) * 100)
                              : 0;
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
                                <div className="w-16 flex-none">
                                  <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                                    <i
                                      className="block h-full rounded-full bg-[var(--brand)]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] font-bold text-[var(--ink-3)] text-right mt-0.5">
                                    {pct}%
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </EducatorShell>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line-soft)] pb-2">
      <span className="text-[var(--ink-3)] font-semibold">{label}</span>
      <span className="font-bold text-[var(--ink)] text-right truncate max-w-[60%]">
        {value && String(value).trim() ? String(value) : "—"}
      </span>
    </div>
  );
}

function StatCard({
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