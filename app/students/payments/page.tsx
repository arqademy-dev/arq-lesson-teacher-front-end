"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentDashboard,
  listStudentPayments,
  getStudentReport,
  initiateStudentPayment,
  ApiError,
} from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  learningPlanId?: string;
  amountNaira?: number;
  status?: string;
  provider?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [learningPlanId, setLearningPlanId] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const [hasSuccess, setHasSuccess] = useState(false);
  const [latestInvoice, setLatestInvoice] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, dash, report] = await Promise.all([
        listStudentPayments().catch(() => []),
        getStudentDashboard().catch(() => null),
        getStudentReport().catch(() => null),
      ]);

      const list = Array.isArray(payRes)
        ? (payRes as PaymentRow[])
        : ((payRes as { payments?: PaymentRow[] })?.payments ?? []);
      setPayments(list);

      const pending = list.find((p) => p.status === "pending");
      const anyWithPlan = list.find((p) => p.learningPlanId);
      if (pending) setLatestInvoice(pending);

      let planId: string | null = null;

      if (dash) {
        const d = dash as {
          payments?: {
            hasPendingPayment?: boolean;
            hasSuccessfulPayment?: boolean;
          };
          currentSession?: { learningPlanId?: string };
        };
        setHasPending(Boolean(d.payments?.hasPendingPayment));
        setHasSuccess(Boolean(d.payments?.hasSuccessfulPayment));
        if (d.currentSession?.learningPlanId) {
          planId = d.currentSession.learningPlanId;
        }
      }

      // Fallback: report learning plans (works before payment / session)
      if (!planId && report) {
        const r = report as {
          learningPlans?: Array<{ planId?: string; id?: string }>;
        };
        const first = r.learningPlans?.[0];
        planId = first?.planId || first?.id || null;
      }

      // Fallback: existing payment rows
      if (!planId && anyWithPlan?.learningPlanId) {
        planId = anyWithPlan.learningPlanId;
      }

      setLearningPlanId(planId);
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
  }, []);


  useEffect(() => {
    load();
  }, [load]);

  async function onGenerateInvoice() {
    console.log("onGenerateInvoice", { learningPlanId });
    if (!learningPlanId) {
      setMessage(
        "No learning plan on your current session. Ask your educator to assign a plan first."
      );
      return;
    }
    setInitiating(true);
    setMessage(null);
    try {
      const res = await initiateStudentPayment(learningPlanId);
      const payment = res.payment ?? null;
      if (payment) {
        setLatestInvoice(payment as PaymentRow);
        setMessage(
          res.message ||
            `Invoice created for ₦${Number(payment.amountNaira ?? 0).toLocaleString()}. Waiting for admin approval.`
        );
      } else {
        setMessage(res.message || "Payment record already exists for this plan.");
      }
      await load();
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not generate payment"
      );
    } finally {
      setInitiating(false);
    }
  }

  const showPayPanel = !hasSuccess;

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
          Payments
        </span>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          Billing
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">Payments</h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Generate an invoice for your plan. Amount is calculated from your
          topics. HQ approves before lessons unlock.
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <p className="mt-6 text-[13px] text-[var(--danger)] font-semibold">
            {error}
          </p>
        )}

        {!loading && (
          <>
            {hasSuccess && (
              <div className="mt-8 flex items-center gap-2.5 px-4 py-3 rounded-[12px] bg-[var(--ok-soft)] text-[var(--ok)] text-[13px] font-bold">
                <CheckCircle2 className="w-5 h-5 flex-none" />
                Your plan is paid and unlocked.
              </div>
            )}

            {showPayPanel && (
              <section className="mt-8 rounded-[var(--r-card)] border-2 border-[var(--danger)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] grid place-items-center bg-[var(--danger-soft)] text-[var(--danger)] flex-none">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                      {latestInvoice || hasPending
                        ? "Your invoice"
                        : "Generate payment"}
                    </h2>
                    <p className="mt-1 text-[13px] text-[var(--ink-2)] leading-relaxed">
                      {latestInvoice || hasPending
                        ? "Pay this amount (manual settlement for now). Admin must mark it successful."
                        : "Click below to create an invoice. The system sets the price from your plan’s topic count."}
                    </p>

                    {learningPlanId && (
                      <p className="mt-2 text-[11.5px] text-[var(--ink-4)] font-semibold">
                        Learning plan · {learningPlanId.slice(0, 8)}…
                      </p>
                    )}

                    {/* Amount after generate */}
                    {latestInvoice && (
                      <div className="mt-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-4">
                        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">
                          Amount due
                        </p>
                        <p className="font-heading text-[28px] font-semibold text-[var(--ink)] mt-1 tabular-nums">
                          ₦
                          {Number(
                            latestInvoice.amountNaira ?? 0
                          ).toLocaleString()}
                        </p>
                        <p className="mt-2 text-[12.5px] font-bold capitalize text-[var(--warn)]">
                          Status · {latestInvoice.status ?? "pending"}
                        </p>
                        {latestInvoice.createdAt && (
                          <p className="mt-1 text-[11px] text-[var(--ink-4)]">
                            Created {latestInvoice.createdAt}
                          </p>
                        )}
                      </div>
                    )}

                    {!latestInvoice && !hasPending && (
                      <>
                        <button
                          type="button"
                          disabled={initiating || !learningPlanId}
                          onClick={onGenerateInvoice}
                          className={cn(
                            "mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-bold",
                            "bg-[var(--danger)] text-white hover:opacity-90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {initiating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              Generate payment
                            </>
                          )}
                        </button>

                        {!learningPlanId && (
                          <p className="mt-2 text-[12px] font-semibold text-[var(--warn)]">
                            No learning plan found yet. Ask your educator to assign one, then
                            refresh this page.
                          </p>
                        )}
                      </>
                    )}

                    {/* Allow regenerate only if no invoice yet; if API returned 200 existing, load() should surface it */}
                    {latestInvoice && latestInvoice.status === "failed" && (
                      <button
                        type="button"
                        disabled={initiating || !learningPlanId}
                        onClick={onGenerateInvoice}
                        className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-[12.5px] font-bold border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {message && (
              <p
                className={cn(
                  "mt-4 text-[13px] font-semibold",
                  /could not|no learning|not found|failed/i.test(message)
                    ? "text-[var(--danger)]"
                    : "text-[var(--ok)]"
                )}
              >
                {message}
              </p>
            )}

            {/* History */}
            <section className="mt-8">
              <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)] mb-3">
                Payment history
              </h2>
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                {payments.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-3)]">
                    No payments yet. Generate an invoice above.
                  </p>
                ) : (
                  <ul>
                    {payments.map((p) => {
                      const status = String(p.status ?? "—");
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--line-soft)] last:border-0"
                        >
                          <StatusIcon status={status} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[13px] text-[var(--ink)] tabular-nums">
                              ₦{(p.amountNaira ?? 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                              {p.createdAt ?? p.id.slice(0, 8)}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-[10.5px] font-bold px-2 py-0.5 rounded-full capitalize",
                              status === "pending" &&
                                "bg-[var(--warn-soft)] text-[var(--warn)]",
                              status === "success" &&
                                "bg-[var(--ok-soft)] text-[var(--ok)]",
                              status === "failed" &&
                                "bg-[var(--danger-soft)] text-[var(--danger)]",
                              status === "refunded" &&
                                "bg-[var(--surface-3)] text-[var(--ink-3)]"
                            )}
                          >
                            {status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") {
    return <CheckCircle2 className="w-5 h-5 text-[var(--ok)] flex-none" />;
  }
  if (status === "pending") {
    return <Clock className="w-5 h-5 text-[var(--warn)] flex-none" />;
  }
  return <XCircle className="w-5 h-5 text-[var(--danger)] flex-none" />;
}