"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listProgrammeTopics,
  type Programme,
  type ProgrammeTopic,
  type CreateProgrammePlanPayload,
} from "@/lib/api";

const WEEK_OPTIONS = [3, 4, 5, 6, 8, 10, 12];
const QUIZ_SIZES = [10, 25, 50, 100];

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)] font-semibold";
const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2";

/** Next Monday on or after today (UTC date string YYYY-MM-DD). */
function nextMondayYmd(from = new Date()): string {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const day = d.getUTCDay(); // 0 Sun .. 1 Mon
  const add = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

function isMondayYmd(ymd: string): boolean {
  const d = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 1;
}

type Props = {
  studentId: string;
  programmes: Programme[];
  onSave: (payload: CreateProgrammePlanPayload) => Promise<void>;
};

export function PlanSetup({ programmes, onSave }: Props) {
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? "");
  const [topics, setTopics] = useState<ProgrammeTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [weeks, setWeeks] = useState(5);
  const [quizDay, setQuizDay] = useState<"friday" | "saturday">("friday");
  const [quizSize, setQuizSize] = useState(50);
  const [startDate, setStartDate] = useState(nextMondayYmd());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!programmeId) {
      setTopics([]);
      return;
    }
    let cancelled = false;
    setLoadingTopics(true);
    listProgrammeTopics(programmeId)
      .then((data) => {
        if (!cancelled) setTopics(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setTopics([]);
          toast.error("Failed to load programme topics");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });
    return () => {
      cancelled = true;
    };
  }, [programmeId]);

  // Keep selection valid when programmes list loads
  useEffect(() => {
    if (!programmeId && programmes.length > 0) {
      setProgrammeId(programmes[0].id);
    }
  }, [programmes, programmeId]);

  const learningPerWeek = quizDay === "friday" ? 4 : 5;
  const learningDays = weeks * learningPerWeek;
  const perDay =
    topics.length === 0 ? "0" : (topics.length / Math.max(learningDays, 1)).toFixed(1);

  const selectedProgramme = useMemo(
    () => programmes.find((p) => p.id === programmeId),
    [programmes, programmeId]
  );

  async function handleSave() {
    if (!programmeId) {
      toast.error("Select a programme");
      return;
    }
    if (topics.length === 0) {
      toast.error("Programme has no topics");
      return;
    }
    if (!isMondayYmd(startDate)) {
      toast.error("Start date must be a Monday");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        programmeId,
        weeks,
        quizDay,
        quizSize,
        startDate,
        requireCorrectAnswersToProgress: true,
      });
    } finally {
      setSaving(false);
    }
  }

  if (programmes.length === 0) {
    return (
      <div className="card border border-[var(--line)] p-8 text-center text-[var(--ink-3)]">
        No published programmes yet. Publish a programme before creating a plan.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Programme */}
      <section className="card border border-[var(--line)] p-6">
        <div className="eyebrow text-[var(--brand)] mb-2">No plan yet</div>
        <label className={labelClass}>Programme</label>
        <select
          value={programmeId}
          onChange={(e) => setProgrammeId(e.target.value)}
          className={fieldClass}
        >
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.topicCount != null ? ` (${p.topicCount} topics)` : ""}
            </option>
          ))}
        </select>

        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold">
              {selectedProgramme?.title ?? "Programme"} model
            </h3>
            <span className="text-xs font-semibold text-[var(--ink-3)]">
              {loadingTopics ? "…" : `${topics.length} topics`}
            </span>
          </div>

          {loadingTopics ? (
            <div className="text-sm text-[var(--ink-3)]">Loading topics…</div>
          ) : topics.length === 0 ? (
            <div className="text-sm text-[var(--ink-3)]">
              This programme has no topics yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 max-h-64 overflow-auto pr-2">
              {topics.map((t, i) => (
                <div key={t.topicId} className="flex items-center gap-3 text-sm">
                  <span className="flex-none w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold bg-[var(--surface-3)] text-[var(--ink-3)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[var(--ink)]">{t.title}</div>
                    <div className="text-[11px] text-[var(--ink-3)] truncate">
                      {t.subjectTitle ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Settings */}
      <section className="card border border-[var(--line)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Weeks</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className={fieldClass}
            >
              {WEEK_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} weeks
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Quiz day (end of week)</label>
            <select
              value={quizDay}
              onChange={(e) =>
                setQuizDay(e.target.value as "friday" | "saturday")
              }
              className={fieldClass}
            >
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Quiz size</label>
            <select
              value={quizSize}
              onChange={(e) => setQuizSize(Number(e.target.value))}
              className={fieldClass}
            >
              {QUIZ_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Start date (Monday)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldClass}
            />
            {!isMondayYmd(startDate) && (
              <p className="text-xs text-[var(--warn)] mt-1">
                Must be a Monday (backend requirement)
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
          <p className="text-xs text-[var(--ink-3)] leading-relaxed">
            {topics.length} topics over {learningDays} learning days (~{perDay}{" "}
            per day) + {weeks} weekly quizzes from the question bank
          </p>
          <button
            onClick={handleSave}
            disabled={saving || topics.length === 0}
            className="btn teal inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarCheck className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save plan for student"}
          </button>
        </div>
      </section>
    </div>
  );
}