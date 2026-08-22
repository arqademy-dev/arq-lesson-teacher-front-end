"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getEducatorMe,
  getEducatorStudent,
  createLearningPlan,
  listCurriculumSubjects,
  listCurriculumClasses,
  listCurriculumTopics,
  listLearningPlansForStudent,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type TopicRow = {
  id: string;
  title: string;
  expectedDurationDays?: number;
  classId: string;
  classTitle: string;
  subjectTitle: string;
};

/* ---------- duplicate-plan gate helpers ---------- */

type SessionRow = { id: string; isCompleted?: boolean };
type PlanTopicRow = { sessions?: SessionRow[] };
type ExistingPlan = {
  id: string;
  status?: string;
  startDate?: string;
  createdAt?: string;
  topics?: PlanTopicRow[];
};

function allSessionsComplete(plan: ExistingPlan): boolean {
  const topics = plan.topics ?? [];
  if (topics.length === 0) return false; // schedule not generated yet — be safe
  return topics.every((t) =>
    (t.sessions ?? []).every((s) => s.isCompleted === true)
  );
}

/** A plan blocks a new one unless it's explicitly done/cancelled or every session is checked off. */
function planBlocksNewPlan(plan: ExistingPlan): boolean {
  if (plan.status === "completed" || plan.status === "cancelled") return false;
  return !allSessionsComplete(plan);
}

export default function AssignLearningPlanPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = String(params.id || "");

  const [educatorName, setEducatorName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [studentLabel, setStudentLabel] = useState("Student");

  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [classes, setClasses] = useState<Record<string, unknown>[]>([]);
  const [topicsForSelection, setTopicsForSelection] = useState<TopicRow[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [picked, setPicked] = useState<Record<string, TopicRow>>({});

  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [preferredDays, setPreferredDays] = useState<string[]>([
    "monday",
    "wednesday",
    "friday",
  ]);
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [requireCorrect, setRequireCorrect] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successJson, setSuccessJson] = useState<unknown>(null);

  // duplicate-plan gate state
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [blockingPlan, setBlockingPlan] = useState<ExistingPlan | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setEducatorName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }
        const st = (await getEducatorStudent(studentId).catch(() => null)) as
          | Record<string, unknown>
          | null;
        if (st) {
          setStudentLabel(
            `${st.firstName ?? ""} ${st.lastName ?? ""}`.trim() ||
              String(st.id ?? studentId)
          );
        }

        // Subjects and classes are both flat/independent now — load together.
        const [subs, cls] = await Promise.all([
          listCurriculumSubjects(),
          listCurriculumClasses(),
        ]);
        setSubjects(
          Array.isArray(subs) ? (subs as Record<string, unknown>[]) : []
        );
        setClasses(
          Array.isArray(cls) ? (cls as Record<string, unknown>[]) : []
        );

        // duplicate-plan gate: does this student already have a blocking plan?
        const existing = await listLearningPlansForStudent(studentId).catch(
          () => []
        );
        const plans = Array.isArray(existing)
          ? (existing as ExistingPlan[])
          : [];
        const blocking = plans
          .filter(planBlocksNewPlan)
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? b.startDate ?? 0).getTime() -
              new Date(a.createdAt ?? a.startDate ?? 0).getTime()
          )[0];
        setBlockingPlan(blocking ?? null);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed to load"
        );
      } finally {
        setLoading(false);
        setCheckingExisting(false);
      }
    })();
  }, [studentId]);

  // Subject AND class → topics. Both are required now (a topic is uniquely
  // identified by the subjectId + classId combination), so nothing loads
  // until both are picked.
  const loadTopics = useCallback(async () => {
    if (!subjectId || !classId) {
      setTopicsForSelection([]);
      return;
    }
    setLoadingTopics(true);
    try {
      const t = await listCurriculumTopics({ subjectId, classId });
      const list = Array.isArray(t) ? (t as Record<string, unknown>[]) : [];
      const subjectTitle = String(
        subjects.find((s) => String(s.id) === subjectId)?.title ?? ""
      );
      const classTitle = String(
        classes.find((c) => String(c.id) === classId)?.title ?? ""
      );
      setTopicsForSelection(
        list.map((row) => ({
          id: String(row.id),
          title: String(row.title ?? "Topic"),
          expectedDurationDays: Number(row.expectedDurationDays ?? 1),
          classId,
          classTitle,
          subjectTitle,
        }))
      );
    } catch (err) {
      setTopicsForSelection([]);
      setError(err instanceof Error ? err.message : "Could not load topics");
    } finally {
      setLoadingTopics(false);
    }
  }, [subjectId, classId, subjects, classes]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const pickedList = useMemo(() => Object.values(picked), [picked]);

  function toggleTopic(t: TopicRow) {
    setPicked((prev) => {
      const next = { ...prev };
      if (next[t.id]) delete next[t.id];
      else next[t.id] = t;
      return next;
    });
  }

  function toggleDay(day: string) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function onCreate() {
    if (pickedList.length === 0) {
      setError("Select at least one topic for this student.");
      return;
    }
    if (preferredDays.length === 0) {
      setError("Pick at least one preferred day.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const plan = await createLearningPlan({
        studentId,
        sessionsPerWeek,
        preferredDays,
        startDate,
        requireCorrectAnswersToProgress: requireCorrect,
        topics: pickedList.map((t) => ({ topicId: t.id })),
      });
      setSuccessJson(plan);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not create plan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  const selectedSubjectTitle = String(
    subjects.find((s) => String(s.id) === subjectId)?.title ?? ""
  );
  const selectedClassTitle = String(
    classes.find((c) => String(c.id) === classId)?.title ?? ""
  );

  // ---- Blocked: student already has an in-progress plan ----
  if (!loading && !checkingExisting && blockingPlan) {
    return (
      <EducatorShell
        title="Assign learning plan"
        subtitle="Classroom"
        userName={educatorName}
        arqId={arqId}
        onLogout={handleLogout}
      >
        <Link
          href={`/educators/students/${studentId}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          {studentLabel}
        </Link>

        <div className="max-w-xl rounded-[var(--r-card)] border border-[var(--warn)] bg-[var(--surface)] p-6 space-y-4">
          <p className="text-[13px] font-bold text-[var(--warn)]">
            {studentLabel} already has a learning plan in progress
          </p>
          <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
            You can&apos;t start a new plan until every session on the
            current one is marked complete (or the plan is cancelled). Edit
            the existing plan instead — reschedule sessions or mark them
            complete/incomplete.
          </p>
          <div className="text-[12px] text-[var(--ink-3)] font-semibold">
            Status:{" "}
            <span className="capitalize">
              {blockingPlan.status ?? "active"}
            </span>
            {blockingPlan.startDate ? ` · started ${blockingPlan.startDate}` : ""}
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/educators/students/${studentId}/learning-plan/${blockingPlan.id}`
              )
            }
            className="inline-flex h-10 px-4 items-center rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white border-2 border-[var(--brand-ink)]"
          >
            Open existing plan
          </button>
        </div>
      </EducatorShell>
    );
  }

  return (
    <EducatorShell
      title="Assign learning plan"
      subtitle="Classroom"
      userName={educatorName}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <Link
        href={`/educators/students/${studentId}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {studentLabel}
      </Link>

      {(loading || checkingExisting) && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading curriculum…
        </div>
      )}

      {error && (
        <p className="mb-4 text-[13px] font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}

      {successJson ? (
        <div className="rounded-[var(--r-card)] border border-[var(--ok)] bg-[var(--surface)] p-5 space-y-3 max-w-2xl">
          <p className="text-[13px] font-bold text-[var(--ok)]">
            Learning plan created. Session calendar was generated.
          </p>
          <p className="text-[12.5px] text-[var(--ink-3)]">
            Next: student generates payment → admin approves → daily sessions
            unlock.
          </p>
          <pre className="text-[11px] text-[var(--ink-3)] overflow-auto max-h-64 rounded-[10px] border border-[var(--line)] p-3 bg-[var(--surface-2)]">
            {JSON.stringify(successJson, null, 2)}
          </pre>
          <Link
            href={`/educators/students/${studentId}`}
            className="inline-flex h-10 px-4 items-center rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white"
          >
            Back to student
          </Link>
        </div>
      ) : (
        !loading &&
        !checkingExisting && (
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Subject + class + topics */}
            <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line-soft)]">
                <p className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                  Select subject, class & topics
                </p>
                <p className="text-[11.5px] text-[var(--ink-3)] mt-0.5">
                  Subject and class are independent — pick both to load their
                  topics. Change either anytime to add topics from a
                  different combination into the same plan.
                </p>
              </div>

              <div className="p-4 grid gap-3 sm:grid-cols-2 border-b border-[var(--line-soft)]">
                <label className="text-[11px] font-bold text-[var(--ink-3)] block">
                  Subject
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="mt-1 w-full h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] text-[var(--ink)]"
                  >
                    <option value="">Select subject…</option>
                    {subjects.map((s) => (
                      <option key={String(s.id)} value={String(s.id)}>
                        {String(s.title)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-[11px] font-bold text-[var(--ink-3)] block">
                  Class
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="mt-1 w-full h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] text-[var(--ink)]"
                  >
                    <option value="">Select class…</option>
                    {classes.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {String(c.title)}
                        {c.term ? ` · ${c.term}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {subjectId && classId && (
                <div className="px-4 py-2 bg-[var(--brand-soft)] text-[12px] font-bold text-[var(--brand)]">
                  Topics in {selectedSubjectTitle || "this subject"} ·{" "}
                  {selectedClassTitle || "this class"}
                  {loadingTopics && " · loading…"}
                </div>
              )}

              <ul className="max-h-[380px] overflow-y-auto">
                {(!subjectId || !classId) && (
                  <li className="px-4 py-10 text-center text-[13px] text-[var(--ink-3)]">
                    Select a subject and a class to see their topics.
                  </li>
                )}
                {subjectId &&
                  classId &&
                  !loadingTopics &&
                  topicsForSelection.length === 0 && (
                    <li className="px-4 py-10 text-center text-[13px] text-[var(--ink-3)]">
                      No topics for this subject and class yet.
                    </li>
                  )}
                {topicsForSelection.map((t) => {
                  const on = !!picked[t.id];
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => toggleTopic(t)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[var(--line-soft)] hover:bg-[var(--surface-2)]",
                          on && "bg-[var(--brand-soft)]"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 w-5 h-5 rounded-[6px] border grid place-items-center flex-none",
                            on
                              ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                              : "border-[var(--line)]"
                          )}
                        >
                          {on && <Check className="w-3 h-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-[var(--ink)]">
                            {t.title}
                          </span>
                          <span className="block text-[11px] text-[var(--ink-3)] font-semibold mt-0.5">
                            {t.expectedDurationDays ?? 1} day(s) default
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Plan settings */}
            <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5 space-y-5 h-fit">
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-2">
                  Selected ({pickedList.length})
                </p>
                {pickedList.length === 0 ? (
                  <p className="text-[12.5px] text-[var(--ink-4)]">
                    No topics selected
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {pickedList.map((t, i) => (
                      <li key={t.id} className="text-[12.5px]">
                        <span className="font-bold text-[var(--ink)]">
                          {i + 1}. {t.title}
                        </span>
                        <span className="block text-[11px] text-[var(--ink-3)]">
                          {t.subjectTitle} · {t.classTitle}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="block text-[11px] font-bold text-[var(--ink-3)]">
                Sessions per week
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                  className="mt-1 w-full h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                />
              </label>

              <div>
                <p className="text-[11px] font-bold text-[var(--ink-3)] mb-2">
                  Preferred days
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const on = preferredDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(d)}
                        className={cn(
                          "h-9 px-3 rounded-[8px] text-[11px] font-bold capitalize border-2 transition-colors flex items-center gap-1.5",
                          on
                            ? "bg-[var(--brand)] border-[var(--brand)] text-white shadow-sm"
                            : "bg-[var(--surface-3)] border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--brand)]"
                        )}
                      >
                        {on && <Check className="w-3 h-3" />}
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10.5px] text-[var(--ink-4)]">
                  {preferredDays.length} day
                  {preferredDays.length === 1 ? "" : "s"} selected
                </p>
              </div>

              <label className="block text-[11px] font-bold text-[var(--ink-3)]">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                />
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireCorrect}
                  onChange={(e) => setRequireCorrect(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-[13px] font-bold text-[var(--ink)]">
                    Require correct answers to progress
                  </span>
                  <span className="block text-[11.5px] text-[var(--ink-3)] mt-0.5">
                    Every interactive check must be correct before the student
                    can complete a session day.
                  </span>
                </span>
              </label>

              <button
                type="button"
                disabled={saving || pickedList.length === 0}
                onClick={onCreate}
                className="w-full h-11 rounded-[10px] text-[13px] font-heading font-semibold bg-[var(--brand)] text-white border-2 border-[var(--brand-ink)] hover:bg-[var(--brand-ink)] disabled:opacity-50 disabled:border-transparent flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create learning plan"
                )}
              </button>
            </section>
          </div>
        )
      )}
    </EducatorShell>
  );
}