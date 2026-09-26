"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getCurrentSession,
  getStudentSession,
  completeSession,
  submitInteraction,
  uploadSessionSummary,
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
  Upload,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SummarySection = { header: string; body: string };

function normalizeFillBlankAnswer(
  interactionType: string | undefined,
  payload: InteractionAnswer
): InteractionAnswer {
  if (interactionType !== "fill_blank" || !payload || typeof payload !== "object") {
    return payload;
  }
  const keys = Object.keys(payload as Record<string, unknown>);
  if (keys.length !== 1) return payload;
  const value = String((payload as Record<string, unknown>)[keys[0]] ?? "");
  return {
    ...(payload as Record<string, unknown>),
    answerText: value,
  } as InteractionAnswer;
}

export default function StudentSessionPage() {
  const params = useParams();

  const sessionIdParam = useMemo(() => {
    const raw =
      params?.sessionId ??
      (Array.isArray(params?.slug) ? params.slug[0] : params?.slug);
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
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

  // Daily summary upload (required on learning days)
  const [summaryUploaded, setSummaryUploaded] = useState(false);
  const [summaryFileName, setSummaryFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

        // Backend may flag existing summary
        const sess = session.session as {
          summaryUploaded?: boolean;
          summaryFileUrl?: string | null;
          summaryFileName?: string | null;
        };
        if (sess.summaryUploaded || sess.summaryFileUrl) {
          setSummaryUploaded(true);
          setSummaryFileName(sess.summaryFileName ?? "Summary uploaded");
        } else {
          setSummaryUploaded(false);
          setSummaryFileName(null);
        }
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
        setError(err instanceof Error ? err.message : "Failed to load session");
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
    data?.session &&
      ((data.session as { isCompleted?: boolean }).isCompleted === true ||
        (sessionIdParam &&
          (data.session as { isCompleted?: boolean }).isCompleted))
  );

  /** Learning day always requires summary file; quiz days never hit this page */
  const summaryRequired = !isReviewMode;

  const interactionsOk = useMemo(() => {
    if (allElementIds.length === 0) return true;
    if (!requireCorrect) {
      // answered at least once each if you prefer: return allElementIds.every(id => results[id]);
      return true;
    }
    return allElementIds.every((id) => results[id]?.isCorrect === true);
  }, [allElementIds, results, requireCorrect]);

  const canComplete = useMemo(() => {
    if (!data || isReviewMode) return false;
    if (!interactionsOk) return false;
    if (summaryRequired && !summaryUploaded) return false;
    return true;
  }, [data, isReviewMode, interactionsOk, summaryRequired, summaryUploaded]);

  const answeredCorrect = allElementIds.filter(
    (id) => results[id]?.isCorrect === true
  ).length;

  const summaryFormat: SummarySection[] = useMemo(() => {
    const raw = (data?.topic as { summaryFormat?: SummarySection[] | null })
      ?.summaryFormat;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  async function handleSubmit(elementId: string, payload: InteractionAnswer) {
    if (!data) return;
    const el = data.resources
      .flatMap((r) => r.interactiveElements ?? [])
      .find((e) => e.id === elementId);
    const normalized = normalizeFillBlankAnswer(el?.interactionType, payload);

    setSubmittingId(elementId);
    try {
      const result = (await submitInteraction({
        interactiveElementId: elementId,
        scheduledSessionId: data.session.id,
        response: normalized as Record<string, unknown>,
      })) as SubmissionResult;

      setResults((prev) => ({ ...prev, [elementId]: result }));
      setPriorAnswers((prev) => ({
        ...prev,
        [elementId]: normalized as Record<string, unknown>,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleSummaryFile(file: File | null) {
    if (!file || !data || isReviewMode) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadSessionSummary(data.session.id, file);
      setSummaryUploaded(true);
      setSummaryFileName(file.name);
    } catch (err) {
      setUploadError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed"
      );
      setSummaryUploaded(false);
    } finally {
      setUploading(false);
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
          : "Could not complete session. Finish checks and upload your summary."
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
            Day complete
          </h1>
          <p className="mt-2 text-[13px] text-[var(--ink-3)]">
            Summary saved. The next learning day unlocks when due.
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

          {!isReviewMode && isOverdue && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--warn-soft)] text-[var(--warn)] text-[12px] font-bold flex-none">
              <AlertTriangle className="w-4 h-4" />
              Finish this before new sessions unlock
            </div>
          )}
          {isReviewMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--ok-soft)] text-[var(--ok)] text-[12px] font-bold flex-none">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
          <aside className="hidden lg:block rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] h-fit lg:sticky lg:top-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                Today&apos;s parts
              </p>
            </div>
            <div className="p-2 max-h-[calc(100vh-140px)] overflow-y-auto">
              {resources.map((r, idx) => {
                const active = r.id === activeResource?.id;
                const els = r.interactiveElements || [];
                const doneCount = els.filter(
                  (el) => results[el.id]?.isCorrect === true
                ).length;
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
                      {els.length > 0 && ` · ${doneCount}/${els.length}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {resources.length > 0 && (
              <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
                <div className="flex gap-2 w-max pb-1">
                  {resources.map((r, idx) => {
                    const active = r.id === activeResource?.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActiveResourceId(r.id)}
                        className={cn(
                          "flex-none px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border-2",
                          active
                            ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                            : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-2)]"
                        )}
                      >
                        {idx + 1}. {r.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeResource ? (
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--line-soft)] flex items-center gap-2 min-w-0">
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
                  {!activeHandledInternally &&
                    (activeResource.interactiveElements || []).map((el) => {
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
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] p-8 text-center text-[13px] text-[var(--ink-3)]">
                No resources for this session.
              </div>
            )}

            {/* Summary guide (topic.summaryFormat) */}
            {summaryFormat.length > 0 && (
              <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[var(--brand)]" />
                  <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)]">
                    Summary guide
                  </h2>
                </div>
                <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
                  Use this outline when writing today&apos;s summary note.
                </p>
                <ul className="space-y-3">
                  {summaryFormat.map((sec, i) => (
                    <li
                      key={i}
                      className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3"
                    >
                      <div className="text-[13px] font-bold text-[var(--ink)]">
                        {sec.header}
                      </div>
                      {sec.body && (
                        <p className="mt-1 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                          {sec.body}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Required daily file upload — not on review; quiz days use quiz UI */}
            {!isReviewMode && (
              <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-[var(--brand)]" />
                  <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)]">
                    Upload summary note
                  </h2>
                  <span className="text-[10px] font-bold uppercase text-[var(--warn)]">
                    Required
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
                  Every learning day needs a summary file before you can
                  complete the day. Quiz days are separate and do not use this
                  upload.
                </p>

                {summaryUploaded ? (
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ok)]">
                    <CheckCircle2 className="w-4 h-4" />
                    {summaryFileName || "Summary uploaded"}
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 h-11 px-4 rounded-[10px] text-[13px] font-bold border border-[var(--line)] bg-[var(--surface-2)] cursor-pointer hover:border-[var(--brand)]">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? "Uploading…" : "Choose file"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploading}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={(e) =>
                        handleSummaryFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
                {uploadError && (
                  <p className="mt-2 text-[12px] font-semibold text-[var(--danger)]">
                    {uploadError}
                  </p>
                )}
              </section>
            )}

            {isReviewMode ? (
              <div className="pt-2 text-center">
                <Link
                  href="/students/learning-plan"
                  className="text-[12.5px] font-bold text-[var(--brand)]"
                >
                  ← Back to learning plan
                </Link>
              </div>
            ) : (
              <div className="sticky bottom-3 lg:static z-30">
                <div className="rounded-[14px] px-4 py-3 flex flex-col items-stretch sm:items-end gap-2 border border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md shadow-lg lg:border-0 lg:bg-transparent lg:shadow-none lg:px-0">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={completing || !canComplete}
                    className={cn(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-heading font-semibold",
                      canComplete
                        ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
                        : "bg-[var(--surface-3)] text-[var(--ink-4)] cursor-not-allowed"
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
                        Complete day
                      </>
                    )}
                  </button>
                  {!canComplete && (
                    <p className="text-[12px] text-[var(--warn)] font-semibold text-right max-w-sm">
                      {!interactionsOk && requireCorrect
                        ? `Answer every check correctly (${answeredCorrect}/${allElementIds.length}). `
                        : ""}
                      {summaryRequired && !summaryUploaded
                        ? "Upload your summary note."
                        : ""}
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