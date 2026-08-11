"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  listEducatorStudents,
  listLearningPlansForStudent,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
};

type PlanRow = {
  id: string;
  studentId?: string;
  sessionsPerWeek?: number;
  preferredDays?: string[];
  startDate?: string;
  endDate?: string | null;
  status?: string;
  requireCorrectAnswersToProgress?: boolean;
  createdAt?: string;
};

type Group = {
  student: StudentRow;
  plans: PlanRow[];
};

export default function EducatorLearningPlansPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");

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
          ? (studentsRaw as StudentRow[])
          : ((studentsRaw as { students?: StudentRow[] })?.students ?? []);

        const perStudent = await Promise.all(
          students.map(async (s) => {
            const sid = String(s.id);
            const plansRes = await listLearningPlansForStudent(sid).catch(
              () => []
            );
            const plans = Array.isArray(plansRes)
              ? (plansRes as PlanRow[])
              : [];
            return { student: { ...s, id: sid }, plans };
          })
        );

        setGroups(perStudent);
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

  const stats = useMemo(() => {
    const totalPlans = groups.reduce((n, g) => n + g.plans.length, 0);
    const withPlans = groups.filter((g) => g.plans.length > 0).length;
    const without = groups.length - withPlans;
    return { totalPlans, withPlans, without, students: groups.length };
  }, [groups]);

  const visible = useMemo(() => {
    if (filter === "with") return groups.filter((g) => g.plans.length > 0);
    if (filter === "without") return groups.filter((g) => g.plans.length === 0);
    return groups;
  }, [groups, filter]);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  return (
    <EducatorShell
      title="Learning plans"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <p className="text-[13px] text-[var(--ink-3)] mb-5">
        Plans for each of your students. Open a student to view detail or assign
        a plan.
      </p>

      {/* Summary */}
      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-3 mb-5 max-w-2xl">
          <MiniStat label="Students" value={String(stats.students)} />
          <MiniStat label="With a plan" value={String(stats.withPlans)} />
          <MiniStat label="Total plans" value={String(stats.totalPlans)} />
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-wrap gap-1 p-1 rounded-[9px] bg-[var(--surface-3)] w-fit mb-5">
          {(
            [
              ["all", "All"],
              ["with", "Has plan"],
              ["without", "No plan"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "px-3.5 py-1.5 rounded-[7px] text-[12px] font-bold transition",
                filter === key
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--ink-3)] hover:text-[var(--ink)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading plans…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-12 text-center max-w-lg">
          <CalendarDays className="w-10 h-10 text-[var(--ink-4)] mx-auto mb-3" />
          <p className="text-[13px] text-[var(--ink-3)]">
            Nothing in this filter.
          </p>
          <Link
            href="/educators/students"
            className="mt-3 inline-flex text-[12.5px] font-bold text-[var(--brand)]"
          >
            Go to students →
          </Link>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4 max-w-3xl">
          {visible.map(({ student, plans }) => {
            const fullName =
              `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
              student.id;
            return (
              <section
                key={student.id}
                className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
              >
                {/* Student header */}
                <div className="px-5 py-3.5 border-b border-[var(--line-soft)] flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] font-heading font-semibold text-[12px] flex-none">
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
                  <Link
                    href={`/educators/students/${student.id}/learning-plan`}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand)]"
                  >
                    {plans.length === 0 ? "Assign plan" : "View plans"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Plans */}
                {plans.length === 0 ? (
                  <p className="px-5 py-6 text-[12.5px] text-[var(--ink-3)] text-center">
                    No learning plan yet.
                  </p>
                ) : (
                  <ul>
                    {plans.map((plan) => {
                      const status = String(plan.status ?? "—");
                      return (
                        <li
                          key={plan.id}
                          className="px-5 py-3.5 border-b border-[var(--line-soft)] last:border-0 flex flex-wrap items-start gap-3 justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[13px] text-[var(--ink)]">
                                Plan {plan.id.slice(0, 8)}
                              </span>
                              <StatusChip status={status} />
                              {plan.requireCorrectAnswersToProgress ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--brand-soft)] text-[var(--brand)]">
                                  Correct required
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--ink-3)]">
                                  Free progress
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 text-[11.5px] text-[var(--ink-3)] font-semibold space-y-0.5">
                              <div>
                                {plan.sessionsPerWeek ?? "—"} sessions / week
                                {plan.startDate
                                  ? ` · from ${plan.startDate}`
                                  : ""}
                              </div>
                              {plan.preferredDays &&
                                plan.preferredDays.length > 0 && (
                                  <div className="capitalize">
                                    {plan.preferredDays.join(" · ")}
                                  </div>
                                )}
                            </div>
                          </div>
                          <Link
                            href={`/educators/students/${student.id}/learning-plan`}
                            className="text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
                          >
                            Open →
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
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
      <div className="font-heading text-[22px] font-semibold text-[var(--ink)] mt-1">
        {value}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-[10.5px] font-bold px-2 py-0.5 rounded-full capitalize",
        status === "active" && "bg-[var(--ok-soft)] text-[var(--ok)]",
        status === "paused" && "bg-[var(--warn-soft)] text-[var(--warn)]",
        status === "completed" && "bg-[var(--brand-soft)] text-[var(--brand)]",
        status === "cancelled" && "bg-[var(--surface-3)] text-[var(--ink-3)]",
        !["active", "paused", "completed", "cancelled"].includes(status) &&
          "bg-[var(--surface-3)] text-[var(--ink-3)]"
      )}
    >
      {status}
    </span>
  );
}