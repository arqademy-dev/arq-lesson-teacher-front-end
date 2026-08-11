"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  listEducatorStudents,
  getEducatorStudentReport,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentInfo = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
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

type ReportPayload = {
  student?: StudentInfo;
  learningPlans?: PlanRow[];
  assessmentSummary?: AssessmentSummary;
  error?: string;
};

type Row = {
  student: StudentInfo;
  report: ReportPayload;
};

export default function EducatorReportsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }

        const studentsRaw = await listEducatorStudents();
        const students = Array.isArray(studentsRaw)
          ? (studentsRaw as StudentInfo[])
          : ((studentsRaw as { students?: StudentInfo[] })?.students ?? []);

        const reports = await Promise.all(
          students.map(async (s) => {
            const sid = String(s.id);
            const report = (await getEducatorStudentReport(sid).catch((e) => ({
              error: e instanceof Error ? e.message : String(e),
            }))) as ReportPayload;
            return { student: { ...s, id: sid }, report };
          })
        );

        setRows(reports);
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
  }, []);

  const overview = useMemo(() => {
    let submissions = 0;
    let correct = 0;
    let withData = 0;
    for (const r of rows) {
      const a = r.report?.assessmentSummary;
      if (!a) continue;
      submissions += a.totalSubmissions ?? 0;
      correct += a.correctSubmissions ?? 0;
      if ((a.totalSubmissions ?? 0) > 0) withData += 1;
    }
    const accuracy =
      submissions > 0 ? Math.round((correct / submissions) * 100) : 0;
    return { submissions, correct, accuracy, withData, students: rows.length };
  }, [rows]);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  return (
    <EducatorShell
      title="Reports"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <p className="text-[13px] text-[var(--ink-3)] mb-5">
        Assessment and plan progress for each of your students.
      </p>

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-4 mb-6 max-w-3xl">
          <MiniStat label="Students" value={String(overview.students)} />
          <MiniStat label="Active on checks" value={String(overview.withData)} />
          <MiniStat label="Submissions" value={String(overview.submissions)} />
          <MiniStat label="Class accuracy" value={`${overview.accuracy}%`} />
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading reports…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-[13px] text-[var(--ink-3)]">No students yet.</p>
      )}

      {!loading && !error && (
        <div className="space-y-4 max-w-3xl">
          {rows.map(({ student, report }) => {
            const fullName =
              `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
              student.id;
            const summary = report?.assessmentSummary;
            const plans = report?.learningPlans ?? [];
            const open = expanded === student.id;
            const accuracy = summary?.accuracyPercent ?? 0;

            return (
              <section
                key={student.id}
                className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
              >
                {/* Header row */}
                <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-[10px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] font-heading font-semibold text-[12px] flex-none">
                    {(student.firstName?.[0] ?? "?").toUpperCase()}
                    {(student.lastName?.[0] ?? "").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/educators/students/${student.id}`}
                      className="font-bold text-[13px] text-[var(--ink)] hover:text-[var(--brand)]"
                    >
                      {fullName}
                    </Link>
                    <div className="text-[11px] text-[var(--ink-3)] font-semibold mt-0.5">
                      {[student.academicLevel, student.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">
                        Accuracy
                      </div>
                      <div
                        className={cn(
                          "font-heading text-[18px] font-semibold tabular-nums",
                          accuracy >= 60
                            ? "text-[var(--ok)]"
                            : accuracy > 0
                              ? "text-[var(--warn)]"
                              : "text-[var(--ink-3)]"
                        )}
                      >
                        {accuracy}%
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">
                        Checks
                      </div>
                      <div className="font-heading text-[18px] font-semibold text-[var(--ink)] tabular-nums">
                        {summary?.correctSubmissions ?? 0}/
                        {summary?.totalSubmissions ?? 0}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(open ? null : student.id)
                      }
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-[8px] text-[12px] font-bold border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                    >
                      {open ? "Hide" : "Details"}
                      <ChevronRight
                        className={cn(
                          "w-3.5 h-3.5 transition",
                          open && "rotate-90"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {open && (
                  <div className="border-t border-[var(--line-soft)] px-5 py-4 space-y-5 bg-[var(--surface-2)]/40">
                    {report?.error && (
                      <p className="text-[12.5px] text-[var(--danger)] font-semibold">
                        {report.error}
                      </p>
                    )}

                    {/* Assessment */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-[var(--brand)]" />
                        <h3 className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                          Assessment
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 mb-3">
                        <SmallStat
                          label="Submissions"
                          value={String(summary?.totalSubmissions ?? 0)}
                        />
                        <SmallStat
                          label="Correct"
                          value={String(summary?.correctSubmissions ?? 0)}
                        />
                        <SmallStat
                          label="Avg score"
                          value={String(summary?.averageScore ?? 0)}
                        />
                      </div>

                      {summary?.byInteractionType &&
                        Object.keys(summary.byInteractionType).length > 0 && (
                          <ul className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
                            {Object.entries(summary.byInteractionType).map(
                              ([type, stats]) => {
                                const total = stats.total ?? 0;
                                const correct = stats.correct ?? 0;
                                const pct =
                                  total > 0
                                    ? Math.round((correct / total) * 100)
                                    : 0;
                                return (
                                  <li
                                    key={type}
                                    className="flex items-center gap-3 px-3.5 py-2.5 border-b border-[var(--line-soft)] last:border-0"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[12.5px] font-bold text-[var(--ink)] capitalize">
                                        {type.replace(/_/g, " ")}
                                      </div>
                                      <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden max-w-[160px]">
                                        <i
                                          className="block h-full rounded-full bg-[var(--brand)]"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="text-[12px] font-semibold text-[var(--ink-3)] tabular-nums">
                                      {correct}/{total}{" "}
                                      <span className="text-[var(--ink)]">
                                        · {pct}%
                                      </span>
                                    </div>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        )}

                      {(summary?.totalSubmissions ?? 0) === 0 && (
                        <p className="text-[12.5px] text-[var(--ink-3)]">
                          No submissions yet.
                        </p>
                      )}
                    </div>

                    {/* Plans */}
                    <div>
                      <h3 className="font-heading text-[13px] font-semibold text-[var(--ink)] mb-3">
                        Learning plans
                      </h3>
                      {plans.length === 0 ? (
                        <p className="text-[12.5px] text-[var(--ink-3)]">
                          No plans on this report.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {plans.map((plan, i) => (
                            <div
                              key={plan.planId ?? i}
                              className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden"
                            >
                              <div className="px-3.5 py-2.5 border-b border-[var(--line-soft)] flex flex-wrap items-center gap-2 justify-between">
                                <span className="text-[12.5px] font-bold text-[var(--ink)]">
                                  Plan{" "}
                                  {plan.planId
                                    ? plan.planId.slice(0, 8)
                                    : i + 1}
                                  {plan.startDate
                                    ? ` · ${plan.startDate}`
                                    : ""}
                                </span>
                                <div className="flex gap-1.5">
                                  {plan.status && (
                                    <Chip label={plan.status} tone="brand" />
                                  )}
                                  {plan.paymentStatus && (
                                    <Chip
                                      label={plan.paymentStatus.replace(
                                        /_/g,
                                        " "
                                      )}
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
                                      className="flex items-center gap-3 px-3.5 py-2 border-b border-[var(--line-soft)] last:border-0"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[12.5px] font-bold text-[var(--ink)] truncate">
                                          {t.topicTitle || "Topic"}
                                        </div>
                                        <div className="text-[11px] text-[var(--ink-3)] font-semibold">
                                          {done}/{total} sessions
                                        </div>
                                      </div>
                                      <div className="w-14 flex-none">
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
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/educators/students/${student.id}`}
                      className="inline-flex text-[12.5px] font-bold text-[var(--brand)]"
                    >
                      Open full student profile →
                    </Link>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </EducatorShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-[20px] font-semibold text-[var(--ink)] mt-1 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-[16px] font-semibold text-[var(--ink)] mt-0.5 tabular-nums">
        {value}
      </div>
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