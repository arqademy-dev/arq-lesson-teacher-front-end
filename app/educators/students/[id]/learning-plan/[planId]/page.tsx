// app/educators/students/[id]/learning-plan/[planId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getEducatorMe,
  getEducatorStudent,
  getLearningPlan,
  updateLearningPlan,
  updateScheduledSession,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { ArrowLeft, Loader2, Check, X, Save } from "lucide-react";
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

const STATUSES = ["active", "paused", "completed", "cancelled"] as const;
type LearningPlanStatus = "active" | "paused" | "completed" | "cancelled";

type SessionRow = {
  id: string;
  scheduledDate: string;
  sessionDayNumber: number;
  isCompleted: boolean;
  educatorNotes?: string | null;
};

type TopicRow = {
  id: string;
  topicId: string;
  status: string;
  sequenceOrder: number;
  topic?: { title?: string };
  sessions: SessionRow[];
};

type PlanDetail = {
  id: string;
  studentId: string;
  status: LearningPlanStatus;
  sessionsPerWeek: number;
  preferredDays: string[];
  startDate: string;
  endDate?: string | null;
  requireCorrectAnswersToProgress: boolean;
  topics: TopicRow[];
};

export default function EditLearningPlanPage() {
  const params = useParams();
  const studentId = String(params.id || "");
  const planId = String(params.planId || "");

  const [educatorName, setEducatorName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [studentLabel, setStudentLabel] = useState("Student");

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // plan settings draft
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<LearningPlanStatus>("active");
  const [requireCorrect, setRequireCorrect] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // per-session state
  const [sessionDrafts, setSessionDrafts] = useState<Record<string, string>>(
    {}
  );
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, st, p] = await Promise.all([
        getEducatorMe().catch(() => null),
        getEducatorStudent(studentId).catch(() => null),
        getLearningPlan(planId) as Promise<PlanDetail>,
      ]);
      if (me) {
        setEducatorName(`${me.firstName} ${me.lastName}`.trim());
        setArqId(me.arqId);
      }
      if (st) {
        const s = st as Record<string, unknown>;
        setStudentLabel(
          `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
            String(s.id ?? studentId)
        );
      }
      setPlan(p);
      setSessionsPerWeek(p.sessionsPerWeek);
      setPreferredDays(p.preferredDays ?? []);
      setStartDate(p.startDate);
      setStatus(p.status as LearningPlanStatus);
      setRequireCorrect(p.requireCorrectAnswersToProgress);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Failed to load plan"
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  function toggleDay(day: string) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);
    try {
      const updated = await updateLearningPlan(planId, {
        sessionsPerWeek,
        preferredDays,
        startDate,
        status: status as LearningPlanStatus,
        requireCorrectAnswersToProgress: requireCorrect,
      });
      setPlan(updated as PlanDetail);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      setSettingsError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save"
      );
    } finally {
      setSavingSettings(false);
    }
  }

  function draftDateFor(session: SessionRow): string {
    return sessionDrafts[session.id] ?? session.scheduledDate;
  }

  function setDraftDate(sessionId: string, date: string) {
    setSessionDrafts((prev) => ({ ...prev, [sessionId]: date }));
  }

  function isDirty(session: SessionRow): boolean {
    const draft = sessionDrafts[session.id];
    return draft !== undefined && draft !== session.scheduledDate;
  }

  async function saveSessionDate(topicIdx: number, sessionIdx: number) {
    if (!plan) return;
    const session = plan.topics[topicIdx].sessions[sessionIdx];
    const newDate = draftDateFor(session);
    setSavingSessionId(session.id);
    setSessionError(null);
    try {
      const res = (await updateScheduledSession(session.id, {
        scheduledDate: newDate,
      })) as { session: SessionRow };
      applySessionUpdate(topicIdx, sessionIdx, res.session);
      setSessionDrafts((prev) => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });
    } catch (err) {
      setSessionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not reschedule session"
      );
    } finally {
      setSavingSessionId(null);
    }
  }

  async function toggleComplete(topicIdx: number, sessionIdx: number) {
    if (!plan) return;
    const session = plan.topics[topicIdx].sessions[sessionIdx];
    setSavingSessionId(session.id);
    setSessionError(null);
    try {
      const res = (await updateScheduledSession(session.id, {
        isCompleted: !session.isCompleted,
      })) as { session: SessionRow };
      applySessionUpdate(topicIdx, sessionIdx, res.session);
    } catch (err) {
      setSessionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not update session"
      );
    } finally {
      setSavingSessionId(null);
    }
  }

  function applySessionUpdate(
    topicIdx: number,
    sessionIdx: number,
    updated: SessionRow
  ) {
    setPlan((prev) => {
      if (!prev) return prev;
      const topics = [...prev.topics];
      const sessions = [...topics[topicIdx].sessions];
      sessions[sessionIdx] = { ...sessions[sessionIdx], ...updated };
      topics[topicIdx] = { ...topics[topicIdx], sessions };
      return { ...prev, topics };
    });
  }

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  const totalSessions =
    plan?.topics.reduce((n, t) => n + t.sessions.length, 0) ?? 0;
  const doneSessions =
    plan?.topics.reduce(
      (n, t) => n + t.sessions.filter((s) => s.isCompleted).length,
      0
    ) ?? 0;

  return (
    <EducatorShell
      title="Edit learning plan"
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
          Loading plan…
        </div>
      )}

      {error && (
        <p className="text-[13px] font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}

      {!loading && !error && plan && (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Sessions */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                  Schedule
                </p>
                <p className="text-[11.5px] text-[var(--ink-3)] mt-0.5">
                  {doneSessions}/{totalSessions} sessions completed
                </p>
              </div>
            </div>

            {sessionError && (
              <p className="px-4 py-2 text-[12px] font-semibold text-[var(--danger)] bg-[var(--danger-soft)]">
                {sessionError}
              </p>
            )}

            <div className="max-h-[600px] overflow-y-auto">
              {plan.topics
                .slice()
                .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                .map((topic) => {
                  const topicIdx = plan.topics.findIndex(
                    (t) => t.id === topic.id
                  );
                  return (
                    <div
                      key={topic.id}
                      className="border-b border-[var(--line-soft)] last:border-0"
                    >
                      <div className="px-4 py-2.5 bg-[var(--surface-2)] flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-bold text-[var(--ink)]">
                          {topic.topic?.title ?? "Topic"}
                        </span>
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] capitalize">
                          {topic.status}
                        </span>
                      </div>
                      <ul>
                        {topic.sessions
                          .slice()
                          .sort(
                            (a, b) => a.sessionDayNumber - b.sessionDayNumber
                          )
                          .map((session) => {
                            const sessionIdx = topic.sessions.findIndex(
                              (s) => s.id === session.id
                            );
                            const dirty = isDirty(session);
                            const saving = savingSessionId === session.id;
                            return (
                              <li
                                key={session.id}
                                className="px-4 py-2.5 flex items-center gap-3 border-t border-[var(--line-soft)] first:border-t-0 flex-wrap"
                              >
                                <span className="text-[11.5px] font-bold text-[var(--ink-3)] w-14 flex-none">
                                  Day {session.sessionDayNumber}
                                </span>

                                <input
                                  type="date"
                                  value={draftDateFor(session)}
                                  onChange={(e) =>
                                    setDraftDate(session.id, e.target.value)
                                  }
                                  className="h-9 px-2 rounded-[7px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
                                />

                                {dirty && (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      saveSessionDate(topicIdx, sessionIdx)
                                    }
                                    className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[7px] text-[11.5px] font-bold bg-[var(--brand)] text-white disabled:opacity-50"
                                  >
                                    {saving ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                    Save date
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    toggleComplete(topicIdx, sessionIdx)
                                  }
                                  className={cn(
                                    "ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] text-[11.5px] font-bold border-2 transition-colors disabled:opacity-50",
                                    session.isCompleted
                                      ? "bg-[var(--ok-soft)] border-[var(--ok)] text-[var(--ok)]"
                                      : "bg-[var(--surface-3)] border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--brand)]"
                                  )}
                                >
                                  {saving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : session.isCompleted ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                  {session.isCompleted
                                    ? "Completed"
                                    : "Not completed"}
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Plan settings */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5 space-y-5 h-fit">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">
              Plan settings
            </p>

            <label className="block text-[11px] font-bold text-[var(--ink-3)]">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LearningPlanStatus)}
                className="mt-1 w-full h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

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
            </div>

            <label className="block text-[11px] font-bold text-[var(--ink-3)]">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
              />
              <span className="block mt-1 text-[10.5px] text-[var(--ink-4)] font-normal">
                Changing this won&apos;t regenerate already-scheduled sessions.
              </span>
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
              </span>
            </label>

            {settingsError && (
              <p className="text-[12px] font-semibold text-[var(--danger)]">
                {settingsError}
              </p>
            )}
            {settingsSaved && (
              <p className="text-[12px] font-semibold text-[var(--ok)]">
                Saved.
              </p>
            )}

            <button
              type="button"
              disabled={savingSettings}
              onClick={saveSettings}
              className="w-full h-11 rounded-[10px] text-[13px] font-heading font-semibold bg-[var(--brand)] text-white border-2 border-[var(--brand-ink)] hover:bg-[var(--brand-ink)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save plan settings"
              )}
            </button>
          </section>
        </div>
      )}
    </EducatorShell>
  );
}