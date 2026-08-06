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
} from "@/components/learning/types";
import { ResourceRenderer } from "@/components/learning/resources/ResourceRenderer";
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
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load session");
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
        response: payload,
      })) as SubmissionResult;
      setResults((prev) => ({ ...prev, [elementId]: result }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleComplete() {
    if (!data) return;
    setCompleting(true);
    try {
      await completeSession(data.session.id);
      setCompleted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not complete session");
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
                const doneCount = (r.interactiveElements || []).filter(
                  (el) => results[el.id]
                ).length;
                const total = r.interactiveElements?.length ?? 0;
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
                      {total > 0 && ` · ${doneCount}/${total} answered`}
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
                  <ResourceRenderer resource={activeResource} />

                  {(activeResource.interactiveElements || []).map((el) => (
                    <InteractionRenderer
                      key={el.id}
                      element={el}
                      result={results[el.id]}
                      submitting={submittingId === el.id}
                      onSubmit={(payload) => handleSubmit(el.id, payload)}
                    />
                  ))}

                  {(activeResource.interactiveElements || []).length === 0 && (
                    <p className="mt-4 text-[13px] text-[var(--ink-3)]">
                      No interactive checks on this part.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] p-8 text-center text-[13px] text-[var(--ink-3)]">
                No resources for this session.
              </div>
            )}

            {/* Complete session */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className={cn(
                  "inline-flex items-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-heading font-semibold",
                  "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]",
                  "disabled:opacity-70 disabled:pointer-events-none"
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