"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCurrentSession,
  completeSession,
  submitInteraction,
  ApiError,
} from "@/lib/api";
import type {
  CurrentSessionResponse,
  Resource,
  SubmissionResult,
  InteractionAnswer,
  SessionSubmission,
} from "@/components/learning/types";
import {
  ResourceRenderer,
  resourceHasVideoCheckpoints,
} from "@/components/learning/resources/ResourceRenderer";
import { InteractionRenderer } from "@/components/learning/interactions/InteractionRenderer";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentSessionPage() {
  const [data, setData] = useState<CurrentSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

  const [results, setResults] = useState<Record<string, SubmissionResult>>({});
  const [priorAnswers, setPriorAnswers] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getCurrentSession()
      .then((d) => {
        const session = d as CurrentSessionResponse;
        setData(session);

        const sorted = [...(session.resources || [])].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        setActiveResourceId(sorted[0]?.id ?? null);

        // Restore latest submission per element (refresh-safe)
        const resMap: Record<string, SubmissionResult> = {};
        const ansMap: Record<string, Record<string, unknown>> = {};
        for (const s of (session.submissions ?? []) as SessionSubmission[]) {
          resMap[s.interactiveElementId] = {
            isCorrect: s.isCorrect,
            scoreAwarded: s.scoreAwarded,
          };
          if (s.studentResponse) {
            ansMap[s.interactiveElementId] = s.studentResponse;
          }
        }
        setResults(resMap);
        setPriorAnswers(ansMap);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load session"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resources = useMemo(() => {
    if (!data) return [] as Resource[];
    return [...data.resources].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const activeResource =
    resources.find((r) => r.id === activeResourceId) ?? resources[0] ?? null;

  // Video resources with timestamped checkpoints render their own elements
  // as popups inside ResourceRenderer — skip the separate list below for those.
  const activeHandledInternally = activeResource
    ? resourceHasVideoCheckpoints(activeResource)
    : false;

  const allElementIds = useMemo(() => {
    if (!data) return [] as string[];
    return data.resources.flatMap((r) =>
      (r.interactiveElements ?? []).map((el) => el.id)
    );
  }, [data]);

  /** Server default is true — treat missing as true */
  const requireCorrect = data?.requireCorrectAnswersToProgress !== false;

  const canComplete = useMemo(() => {
    if (!data) return false;
    if (allElementIds.length === 0) return true;
    if (requireCorrect) {
      return allElementIds.every((id) => results[id]?.isCorrect === true);
    }
    return true;
  }, [data, allElementIds, results, requireCorrect]);

  const answeredCorrect = allElementIds.filter(
    (id) => results[id]?.isCorrect === true
  ).length;

  async function handleSubmit(
    elementId: string,
    payload: InteractionAnswer
  ) {
    if (!data) return;
    setSubmittingId(elementId);
    try {
      const result = (await submitInteraction({
        interactiveElementId: elementId,
        scheduledSessionId: data.session.id,
        response: payload as Record<string, unknown>,
      })) as SubmissionResult;

      setResults((prev) => ({ ...prev, [elementId]: result }));
      setPriorAnswers((prev) => ({
        ...prev,
        [elementId]: payload as Record<string, unknown>,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleComplete() {
    if (!data || !canComplete) return;
    setCompleting(true);
    try {
      await completeSession(data.session.id);
      setCompleted(true);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Could not complete session. Check that every answer is correct if required."
      );
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading session…
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-16 text-center space-y-3">
          <p className="text-[13px] text-[var(--danger)] font-semibold">
            {error || "No active session."}
          </p>
          <button
            type="button"
            onClick={load}
            className="text-[12.5px] font-bold text-[var(--brand)]"
          >
            Try again
          </button>
          <div>
            <Link
              href="/students/login"
              className="text-[12.5px] font-bold text-[var(--ink-3)]"
            >
              Back to login
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (completed) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--ok)] mx-auto mb-4" />
          <h1 className="font-heading text-[22px] text-[var(--ink)]">
            Session complete
          </h1>
          <p className="mt-2 text-[13px] text-[var(--ink-3)]">
            Well done. The next scheduled day is unlocked.
          </p>
          <Link
            href="/students"
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
          >
            Back to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const { session, topic, isOverdue } = data;

  return (
    <Shell>
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Session header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-1">
              Day {session.sessionDayNumber}
              {isOverdue && (
                <span className="ml-2 text-[var(--warn)]">· Catch-up</span>
              )}
            </p>
            <h1 className="font-heading text-[22px] text-[var(--ink)]">
              {topic.title}
            </h1>
            {topic.description && topic.description !== "string" && (
              <p className="mt-1.5 text-[13px] text-[var(--ink-3)] max-w-[52ch]">
                {topic.description}
              </p>
            )}
            <p className="mt-2 text-[11.5px] text-[var(--ink-4)] font-semibold">
              Scheduled · {session.scheduledDate}
              {requireCorrect && allElementIds.length > 0 && (
                <span className="ml-2">
                  · Checks {answeredCorrect}/{allElementIds.length} correct
                </span>
              )}
            </p>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--warn-soft)] text-[var(--warn)] text-[12px] font-bold">
              <AlertTriangle className="w-4 h-4" />
              Finish this before new sessions unlock
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          {/* Resource list */}
          <aside className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] h-fit overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                Today&apos;s parts
              </p>
            </div>
            <div className="p-2">
              {resources.map((r, idx) => {
                const active = r.id === activeResource?.id;
                const els = r.interactiveElements || [];
                const doneCount = els.filter(
                  (el) => results[el.id]?.isCorrect === true
                ).length;
                const total = els.length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveResourceId(r.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-[9px] mb-1 transition",
                      active
                        ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "hover:bg-[var(--surface-2)] text-[var(--ink-2)]"
                    )}
                  >
                    <div className="text-[12.5px] font-bold leading-snug">
                      {idx + 1}. {r.title}
                    </div>
                    <div className="text-[11px] mt-0.5 opacity-80 font-semibold">
                      {r.resourceType}
                      {total > 0 && ` · ${doneCount}/${total} correct`}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Stage */}
          <div className="space-y-4">
            {activeResource ? (
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-3)] bg-[var(--surface-3)] px-2 py-0.5 rounded">
                    {activeResource.resourceType}
                  </span>
                  <span className="text-[12.5px] font-bold text-[var(--ink)]">
                    {activeResource.title}
                  </span>
                </div>

                <div className="px-5 py-5">
                  <ResourceRenderer
                    resource={activeResource}
                    requireCorrectAnswersToProgress={requireCorrect}
                    results={results}
                    priorAnswers={priorAnswers}
                    submittingId={submittingId}
                    onSubmitElement={handleSubmit}
                  />

                  {/*
                    Video resources with timestamped checkpoints render their
                    elements as popups inside ResourceRenderer above — don't
                    render them again here. Every other resource type (article,
                    pdf, quiz, plain video, etc.) still lists its checks below.
                  */}
                  {!activeHandledInternally && (
                    <>
                      {(activeResource.interactiveElements || []).map((el) => {
                        const result = results[el.id];
                        const allowRetry =
                          requireCorrect &&
                          result != null &&
                          result.isCorrect === false;

                        return (
                          <div key={el.id} className="mt-2">
                            {el.videoTimestampSeconds != null && (
                              <p className="text-[11px] font-bold text-[var(--brand)] mb-1">
                                Checkpoint @ {el.videoTimestampSeconds}s
                              </p>
                            )}
                            <InteractionRenderer
                              element={el}
                              result={result}
                              initialAnswer={priorAnswers[el.id] ?? null}
                              allowRetry={allowRetry}
                              submitting={submittingId === el.id}
                              onSubmit={(payload) =>
                                handleSubmit(el.id, payload)
                              }
                            />
                          </div>
                        );
                      })}
                      {(activeResource.interactiveElements || []).length ===
                        0 && (
                        <p className="mt-4 text-[13px] text-[var(--ink-3)]">
                          No interactive checks on this part.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] p-8 text-center text-[13px] text-[var(--ink-3)]">
                No resources for this session.
              </div>
            )}

            {/* Complete session */}
            <div className="pt-2 flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing || !canComplete}
                className={cn(
                  "inline-flex items-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-heading font-semibold",
                  canComplete
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
                    : "bg-[var(--surface-3)] text-[var(--ink-4)] cursor-not-allowed",
                  "disabled:opacity-70"
                )}
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark session complete
                  </>
                )}
              </button>
              {!canComplete && requireCorrect && allElementIds.length > 0 && (
                <p className="text-[12px] text-[var(--warn)] font-semibold text-right max-w-sm">
                  Answer every check correctly before you can finish this
                  session ({answeredCorrect}/{allElementIds.length}).
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
          ARQADEMY · Session
        </span>
      </header>
      {children}
    </div>
  );
}