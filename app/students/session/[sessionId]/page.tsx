"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getCurrentSession,
  getStudentSession,
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
  const params = useParams();

  // Support both /students/session and /students/session/[sessionId]
  const sessionIdParam = useMemo(() => {
    const raw = params?.sessionId ?? params?.slug;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw.length > 0) return raw[0];
    return null;
  }, [params]);

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

    const fetcher = sessionIdParam
      ? () => getStudentSession(sessionIdParam)
      : () => getCurrentSession();

    fetcher()
      .then((d) => {
        const session = d as CurrentSessionResponse;
        setData(session);

        const sorted = [...(session.resources || [])].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        setActiveResourceId(sorted[0]?.id ?? null);

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
        if (err instanceof ApiError && err.status === 402) {
          setError("Payment required before this session is available.");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load session"
        );
      })
      .finally(() => setLoading(false));
  }, [sessionIdParam]);

  useEffect(() => {
    load();
  }, [load]);

  const resources = useMemo(() => {
    if (!data) return [] as Resource[];
    return [...data.resources].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const activeResource =
    resources.find((r) => r.id === activeResourceId) ?? resources[0] ?? null;

  const activeHandledInternally = activeResource
    ? resourceHasVideoCheckpoints(activeResource)
    : false;

  const allElementIds = useMemo(() => {
    if (!data) return [] as string[];
    return data.resources.flatMap((r) =>
      (r.interactiveElements ?? []).map((el) => el.id)
    );
  }, [data]);

  const requireCorrect = data?.requireCorrectAnswersToProgress !== false;

  const isReviewMode = Boolean(
    data?.session?.isCompleted === true ||
      (sessionIdParam && data?.session?.isCompleted)
  );

  const canComplete = useMemo(() => {
    if (!data || isReviewMode) return false;
    if (allElementIds.length === 0) return true;
    if (requireCorrect) {
      return allElementIds.every((id) => results[id]?.isCorrect === true);
    }
    return true;
  }, [data, allElementIds, results, requireCorrect, isReviewMode]);

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
    if (!data || !canComplete || isReviewMode) return;
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
        <div className="max-w-lg mx-auto py-16 text-center space-y-3 px-4">
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
              href="/students/learning-plan"
              className="text-[12.5px] font-bold text-[var(--ink-3)]"
            >
              Back to learning plan
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (completed) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-16 text-center px-4">
          <CheckCircle2 className="w-12 h-12 text-[var(--ok)] mx-auto mb-4" />
          <h1 className="font-heading text-[22px] text-[var(--ink)]">
            Session complete
          </h1>
          <p className="mt-2 text-[13px] text-[var(--ink-3)]">
            Well done. The next scheduled day is unlocked.
          </p>
          <Link
            href="/students/learning-plan"
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-[var(--r-ctl)] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
          >
            Back to learning plan
          </Link>
        </div>
      </Shell>
    );
  }

  const { session, topic, isOverdue } = data;

  return (
    <Shell isReview={isReviewMode}>
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5 sm:mb-6">
          <div className="min-w-0">
            <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-1">
              Day {session.sessionDayNumber}
              {isReviewMode && (
                <span className="ml-2 text-[var(--ink-3)]">· Review</span>
              )}
              {!isReviewMode && isOverdue && (
                <span className="ml-2 text-[var(--warn)]">· Catch-up</span>
              )}
            </p>
            <h1 className="font-heading text-[19px] sm:text-[22px] text-[var(--ink)] leading-tight">
              {topic.title}
            </h1>
          </div>

          {!isReviewMode && isOverdue && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--warn-soft)] text-[var(--warn)] text-[12px] font-bold flex-none">
              <AlertTriangle className="w-4 h-4" />
              Finish this before new sessions unlock
            </div>
          )}

          {isReviewMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--ok-soft)] text-[var(--ok)] text-[12px] font-bold flex-none">
              <CheckCircle2 className="w-4 h-4" />
              Completed session
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
          {/* Resource list — desktop only, sticky while the stage scrolls */}
          <aside className="hidden lg:block rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] h-fit lg:sticky lg:top-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                {isReviewMode ? "Parts" : "Today's parts"}
              </p>
            </div>
            <div className="p-2 max-h-[calc(100vh-140px)] overflow-y-auto">
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
          <div className="min-w-0 space-y-4">
            {/* Resource nav — mobile only, horizontal scroll strip */}
            {resources.length > 0 && (
              <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
                <div className="flex gap-2 w-max pb-1">
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
                          "flex-none px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border-2 transition-colors",
                          active
                            ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                            : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-2)]"
                        )}
                      >
                        {idx + 1}. {r.title}
                        {total > 0 && ` · ${doneCount}/${total}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeResource ? (
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--line-soft)] flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--ink-3)] bg-[var(--surface-3)] px-2 py-0.5 rounded flex-none">
                    {activeResource.resourceType}
                  </span>
                  <span className="text-[12.5px] font-bold text-[var(--ink)] truncate">
                    {activeResource.title}
                  </span>
                </div>

                <div className="px-4 sm:px-5 py-4 sm:py-5">
                  <ResourceRenderer
                    resource={activeResource}
                    requireCorrectAnswersToProgress={requireCorrect}
                    results={results}
                    priorAnswers={priorAnswers}
                    submittingId={submittingId}
                    onSubmitElement={handleSubmit}
                  />

                  {!activeHandledInternally && (
                    <>
                      {(activeResource.interactiveElements || []).map((el) => {
                        const result = results[el.id];
                        const allowRetry =
                          !isReviewMode &&
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

            {/* Complete / Review footer */}
            {isReviewMode ? (
              <div className="pt-4 text-center space-y-2">
                <p className="text-[13px] text-[var(--ink-3)] font-semibold">
                  You are reviewing a completed session.
                </p>
                <Link
                  href="/students/learning-plan"
                  className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--brand)]"
                >
                  ← Back to learning plan
                </Link>
              </div>
            ) : (
              <div className="sticky bottom-3 lg:static z-30">
                <div
                  className={cn(
                    "rounded-[14px] px-4 py-3 flex flex-col items-stretch sm:items-end gap-2",
                    "border border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md shadow-lg",
                    "lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none lg:px-0 lg:py-0"
                  )}
                >
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={completing || !canComplete}
                    className={cn(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-heading font-semibold",
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
                  {!canComplete &&
                    requireCorrect &&
                    allElementIds.length > 0 && (
                      <p className="text-[12px] text-[var(--warn)] font-semibold text-right max-w-sm">
                        Answer every check correctly before you can finish
                        this session ({answeredCorrect}/{allElementIds.length}
                        ).
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </Shell>
  );
}

function Shell({
  children,
  isReview = false,
}: {
  children: React.ReactNode;
  isReview?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <Link
          href="/students/learning-plan"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Learning plan
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">
          ARQADEMY · {isReview ? "Review" : "Session"}
        </span>
      </header>
      {children}
    </div>
  );
}