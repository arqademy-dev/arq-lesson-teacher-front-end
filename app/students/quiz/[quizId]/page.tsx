"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMyWeeklyQuiz,
  saveWeeklyQuizAnswer,
  submitWeeklyQuiz,
  ApiError,
  type WeeklyQuizDetail,
  type WeeklyQuizQuestion,
} from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
  AlertTriangle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Answer = { selectedIndex?: number; answerText?: string };

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function WeeklyQuizPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;

  const [quiz, setQuiz] = useState<WeeklyQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // CHANGED — if the backend hasn't sent expiresAt yet (the duration/timer
  // patch is optional, see DIFFS-quiz-images-duration.md), estimate it
  // client-side from durationMinutes the moment the quiz loads, so the
  // countdown still shows instead of silently staying blank.
  const [localExpiresAt, setLocalExpiresAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMyWeeklyQuiz(quizId)
      .then((q) => {
        setQuiz(q);
        const seeded: Record<string, Answer> = {};
        const seededSaved: Record<string, boolean> = {};
        for (const question of q.questions) {
          if (question.myAnswer?.selectedIndex != null) {
            seeded[question.id] = { selectedIndex: question.myAnswer.selectedIndex };
            seededSaved[question.id] = true;
          } else if (question.myAnswer?.answerText) {
            seeded[question.id] = { answerText: question.myAnswer.answerText };
            seededSaved[question.id] = true;
          }
        }
        setAnswers(seeded);
        setSavedIds(seededSaved);

        if (q.status !== "submitted" && !q.expiresAt && q.durationMinutes) {
          setLocalExpiresAt(new Date(Date.now() + q.durationMinutes * 60_000).toISOString());
        } else {
          setLocalExpiresAt(null);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        if (err instanceof ApiError && err.status === 402) {
          setError("Payment required before this quiz is available.");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  useEffect(() => {
    load();
  }, [load]);

  const isSubmitted = quiz?.status === "submitted";
  const effectiveExpiresAt = quiz?.expiresAt ?? localExpiresAt;

  // CHANGED — handleSubmit kept in a ref so the countdown's interval always
  // calls the LATEST version, never a stale closure from an earlier render.
  const handleSubmit = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!quiz || submitting || isSubmitted) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submitWeeklyQuiz(quiz.id);
        setQuiz(result);
      } catch (err) {
        if (!opts?.silent) {
          setSubmitError(err instanceof Error ? err.message : "Could not submit quiz");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, submitting, isSubmitted]
  );
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const [msLeft, setMsLeft] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    autoSubmittedRef.current = false;
    if (!effectiveExpiresAt || isSubmitted) {
      setMsLeft(null);
      return;
    }
    const target = new Date(effectiveExpiresAt).getTime();
    const tick = () => {
      const left = target - Date.now();
      setMsLeft(left);
      if (left <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmitRef.current({ silent: true }); // no confirmation — time's up
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [effectiveExpiresAt, isSubmitted]);

  async function selectMultipleChoice(question: WeeklyQuizQuestion, index: number) {
    if (isSubmitted) return;
    const qid = question.id;
    setAnswers((prev) => ({ ...prev, [qid]: { selectedIndex: index } }));
    setSavedIds((prev) => ({ ...prev, [qid]: false }));
    setSavingId(qid);
    try {
      await saveWeeklyQuizAnswer(quiz!.id, qid, { selectedIndex: index });
      setSavedIds((prev) => ({ ...prev, [qid]: true }));
    } catch {
      setSavedIds((prev) => ({ ...prev, [qid]: false }));
    } finally {
      setSavingId((prev) => (prev === qid ? null : prev));
    }
  }

  function typeFillBlank(question: WeeklyQuizQuestion, text: string) {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: { answerText: text } }));
    setSavedIds((prev) => ({ ...prev, [question.id]: false }));
  }

  async function blurFillBlank(question: WeeklyQuizQuestion) {
    if (isSubmitted) return;
    const qid = question.id;
    const text = answers[qid]?.answerText ?? "";
    if (!text.trim()) return;
    setSavingId(qid);
    try {
      await saveWeeklyQuizAnswer(quiz!.id, qid, { answerText: text });
      setSavedIds((prev) => ({ ...prev, [qid]: true }));
    } catch {
      setSavedIds((prev) => ({ ...prev, [qid]: false }));
    } finally {
      setSavingId((prev) => (prev === qid ? null : prev));
    }
  }

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter((q) => {
      const a = answers[q.id];
      return a?.selectedIndex != null || !!a?.answerText?.trim();
    }).length;
  }, [quiz, answers]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading quiz…
        </div>
      </Shell>
    );
  }

  if (error || !quiz) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-16 text-center space-y-3 px-4">
          <p className="text-[13px] text-[var(--danger)] font-semibold">
            {error || "Quiz not found."}
          </p>
          <button type="button" onClick={load} className="text-[12.5px] font-bold text-[var(--brand)]">
            Try again
          </button>
          <div>
            <Link href="/students/learning-plan" className="text-[12.5px] font-bold text-[var(--ink-3)]">
              Back to learning plan
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-1">
              Week {quiz.weekNumber} quiz
            </p>
            <h1 className="font-heading text-[20px] sm:text-[22px] text-[var(--ink)]">
              {isSubmitted ? "Results" : "Quiz"}
            </h1>
            <p className="mt-1 text-[11.5px] text-[var(--ink-4)] font-semibold">
              {quiz.questions.length} questions
              {isSubmitted
                ? ` · Score ${quiz.score ?? 0}/${quiz.questions.length}`
                : ` · ${answeredCount}/${quiz.questions.length} answered`}
            </p>
          </div>

          {!isSubmitted && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-[9px] text-[13px] font-bold flex-none",
                msLeft == null
                  ? "bg-[var(--surface-3)] text-[var(--ink-3)]"
                  : msLeft < 60_000
                    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "bg-[var(--brand-soft)] text-[var(--brand)]"
              )}
            >
              <Timer className="w-4 h-4" />
              {msLeft == null ? "No time limit" : formatClock(msLeft)}
            </div>
          )}

          {isSubmitted && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-[var(--ok-soft)] text-[var(--ok)] text-[12px] font-bold flex-none">
              <CheckCircle2 className="w-4 h-4" />
              Submitted
            </div>
          )}
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => {
            const answer = answers[q.id];
            const revealed = isSubmitted;
            const saving = savingId === q.id;
            const saved = savedIds[q.id];

            return (
              <div
                key={q.id}
                className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-none w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold bg-[var(--surface-3)] text-[var(--ink-3)]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[var(--ink)] leading-snug whitespace-pre-wrap">
                      {q.text}
                    </p>
                    {q.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={q.imageUrl}
                        alt=""
                        className="mt-3 max-h-64 rounded-[10px] border border-[var(--line)]"
                      />
                    )}
                  </div>
                  {revealed &&
                    (q.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--ok)] flex-none" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[var(--danger)] flex-none" />
                    ))}
                </div>

                {q.type === "multiple_choice" && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((option, i) => {
                      const isMine = answer?.selectedIndex === i;
                      const isRight = revealed && q.correctIndex === i;
                      const isWrongPick = revealed && isMine && !isRight;

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={revealed}
                          onClick={() => selectMultipleChoice(q, i)}
                          className={cn(
                            "relative text-left px-4 py-3 pr-9 rounded-[10px] border-2 text-[13px] font-medium transition-colors",
                            isRight && "bg-[var(--ok-soft)] border-[var(--ok)] text-[var(--ok)]",
                            isWrongPick && "bg-[var(--danger-soft)] border-[var(--danger)] text-[var(--danger)]",
                            !revealed && isMine && "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]",
                            !revealed && !isMine && "bg-[var(--surface-2)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--brand)]",
                            revealed && !isRight && !isWrongPick && "border-[var(--line)] text-[var(--ink-3)]"
                          )}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                          {option}
                          {/* Explicit, unmissable selected-state marker — not just a background tint */}
                          {isMine && !revealed && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--brand)] text-white grid place-items-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "fill_blank" && (
                  <div>
                    <input
                      type="text"
                      disabled={revealed}
                      value={answer?.answerText ?? ""}
                      onChange={(e) => typeFillBlank(q, e.target.value)}
                      onBlur={() => blurFillBlank(q)}
                      placeholder="Type your answer…"
                      className="w-full px-4 py-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] font-medium disabled:opacity-70"
                    />
                    {revealed && !q.isCorrect && q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                      <p className="mt-2 text-[12px] font-semibold text-[var(--ok)]">
                        Accepted: {q.acceptedAnswers.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {!revealed && (
                  <p className="mt-2 text-[11px] font-semibold">
                    {saving && <span className="text-[var(--ink-4)]">Saving…</span>}
                    {!saving && saved && (
                      <span className="text-[var(--ok)] inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </p>
                )}

                {revealed && q.feedback && (
                  <p className="mt-3 pt-3 border-t border-[var(--line-soft)] text-[12px] text-[var(--ink-3)]">
                    <strong className="text-[var(--ink-2)]">Feedback:</strong> {q.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {isSubmitted ? (
          <div className="pt-6 text-center">
            <Link href="/students/learning-plan" className="text-[12.5px] font-bold text-[var(--brand)]">
              ← Back to learning plan
            </Link>
          </div>
        ) : (
          <div className="sticky bottom-3 mt-6 z-30">
            <div className="rounded-[14px] px-4 py-3 flex flex-col items-stretch sm:items-end gap-2 border border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md shadow-lg">
              {submitError && (
                <p className="text-[12px] font-semibold text-[var(--danger)]">{submitError}</p>
              )}
              {answeredCount < quiz.questions.length && (
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--warn)] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {quiz.questions.length - answeredCount} question
                  {quiz.questions.length - answeredCount === 1 ? "" : "s"} unanswered
                </p>
              )}
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-heading font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit quiz"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Confirm-before-submit — manual submits only; auto-submit on timeout skips this */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setConfirmOpen(false)}
            aria-label="Cancel"
          />
          <div className="relative z-10 w-full max-w-sm rounded-[18px] bg-[var(--surface)] border border-[var(--line)] shadow-xl p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">Submit this quiz?</h2>
            <p className="mt-2 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
              {answeredCount < quiz.questions.length
                ? `You still have ${quiz.questions.length - answeredCount} unanswered question${quiz.questions.length - answeredCount === 1 ? "" : "s"}. `
                : ""}
              Once submitted, you can&apos;t change your answers.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-10 rounded-[9px] text-[13px] font-bold bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  handleSubmit();
                }}
                className="flex-1 h-10 rounded-[9px] text-[13px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
          ARQADEMY · Quiz
        </span>
      </header>
      {children}
    </div>
  );
}