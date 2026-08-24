"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStudentSession, ApiError } from "@/lib/api";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function StudentFeedbackPage() {
  const params = useParams();
  const sessionId = typeof params?.sessionId === "string" ? params.sessionId : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);

  // Placeholder — replace with real AI feedback endpoint when ready
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session");
      setLoading(false);
      return;
    }

    getStudentSession(sessionId)
      .then((data: any) => {
        setTopicTitle(data?.topic?.title ?? null);
        setDayNumber(data?.session?.sessionDayNumber ?? null);
        // TODO: call your AI analysis endpoint, e.g.:
        // const ai = await getSessionFeedback(sessionId);
        // setFeedback(ai.summary);
        setFeedback(
          "AI feedback will appear here once the analysis endpoint is wired. For now this page confirms the session loaded correctly."
        );
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load feedback"
        );
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <Link
          href="/students/learning-plan"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Learning plan
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">
          AI Feedback
        </span>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--brand)]" />
          <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)]">
            Analysis
          </p>
        </div>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          {topicTitle
            ? `${topicTitle}${dayNumber != null ? ` · Day ${dayNumber}` : ""}`
            : "Session feedback"}
        </h1>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading analysis…
          </div>
        )}

        {error && (
          <p className="mt-6 text-[13px] text-[var(--danger)] font-semibold">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="mt-6 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-[13px] text-[var(--ink-2)] leading-relaxed whitespace-pre-wrap">
              {feedback}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}