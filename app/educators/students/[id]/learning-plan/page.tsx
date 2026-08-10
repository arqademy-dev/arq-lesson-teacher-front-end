"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getEducatorMe,
  getEducatorStudent,
  createLearningPlan,
  listCurriculumSubjects,
  listCurriculumClasses,
  listCurriculumTopics,
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

export default function AssignLearningPlanPage() {
  const params = useParams();
  const studentId = String(params.id || "");

  const [educatorName, setEducatorName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [studentLabel, setStudentLabel] = useState("Student");

  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [classes, setClasses] = useState<Record<string, unknown>[]>([]);
  const [topicsInClass, setTopicsInClass] = useState<TopicRow[]>([]);
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
        const subs = await listCurriculumSubjects();
        setSubjects(
          Array.isArray(subs) ? (subs as Record<string, unknown>[]) : []
        );
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
      }
    })();
  }, [studentId]);

  // Subject → classes
  useEffect(() => {
    if (!subjectId) {
      setClasses([]);
      setClassId("");
      setTopicsInClass([]);
      return;
    }
    listCurriculumClasses(subjectId)
      .then((c) => {
        setClasses(Array.isArray(c) ? (c as Record<string, unknown>[]) : []);
        setClassId("");
        setTopicsInClass([]);
      })
      .catch((err) => {
        setClasses([]);
        setError(
          err instanceof Error ? err.message : "Could not load classes"
        );
      });
  }, [subjectId]);

  // Class → topics for that class
  const loadClassTopics = useCallback(async () => {
    if (!classId || !subjectId) {
      setTopicsInClass([]);
      return;
    }
    setLoadingTopics(true);
    try {
      const t = await listCurriculumTopics(classId);
      const list = Array.isArray(t) ? (t as Record<string, unknown>[]) : [];
      const subjectTitle = String(
        subjects.find((s) => String(s.id) === subjectId)?.title ?? ""
      );
      const classTitle = String(
        classes.find((c) => String(c.id) === classId)?.title ?? ""
      );
      setTopicsInClass(
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
      setTopicsInClass([]);
      setError(err instanceof Error ? err.message : "Could not load topics");
    } finally {
      setLoadingTopics(false);
    }
  }, [classId, subjectId, subjects, classes]);

  useEffect(() => {
    loadClassTopics();
  }, [loadClassTopics]);

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

  const selectedClassTitle = String(
    classes.find((c) => String(c.id) === classId)?.title ?? ""
  );

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

      {loading && (
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
        !loading && (
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Class + topics */}
            <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line-soft)]">
                <p className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                  Select class & topics
                </p>
                <p className="text-[11.5px] text-[var(--ink-3)] mt-0.5">
                  Choose a class to load its topics. Change class anytime to add
                  topics from another class into the same plan.
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
                    disabled={!subjectId}
                    className="mt-1 w-full h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] text-[var(--ink)] disabled:opacity-50"
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

              {classId && (
                <div className="px-4 py-2 bg-[var(--brand-soft)] text-[12px] font-bold text-[var(--brand)]">
                  Topics in {selectedClassTitle || "this class"}
                  {loadingTopics && " · loading…"}
                </div>
              )}

              <ul className="max-h-[380px] overflow-y-auto">
                {!classId && (
                  <li className="px-4 py-10 text-center text-[13px] text-[var(--ink-3)]">
                    Select a class to see its topics.
                  </li>
                )}
                {classId && !loadingTopics && topicsInClass.length === 0 && (
                  <li className="px-4 py-10 text-center text-[13px] text-[var(--ink-3)]">
                    No topics in this class yet.
                  </li>
                )}
                {topicsInClass.map((t) => {
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
                        onClick={() => toggleDay(d)}
                        className={cn(
                          "h-8 px-2.5 rounded-[8px] text-[11px] font-bold capitalize",
                          on
                            ? "bg-[var(--brand)] text-white"
                            : "bg-[var(--surface-3)] text-[var(--ink-2)]"
                        )}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
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
                className="w-full h-11 rounded-[10px] text-[13px] font-heading font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] disabled:opacity-50 flex items-center justify-center gap-2"
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