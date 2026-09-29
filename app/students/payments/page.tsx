"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getStudentDashboard,
  listStudentPayments,
  getStudentReport,
  initiateStudentPayment,
  getStudentPaymentStatus,
  ApiError,
  type VirtualAccount,
} from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
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

const STORAGE_KEY = "arqademy_pending_payment";

type PendingSession = { paymentId: string; account: VirtualAccount; expiresAtMs: number; amountNaira?: number };

function saveSession(session: PendingSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
function loadSession(): PendingSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSession;
    if (parsed.expiresAtMs < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [learningPlanId, setLearningPlanId] = useState<string | null>(null);
  const [hasSuccess, setHasSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Virtual account modal state
  const [showModal, setShowModal] = useState(false);
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paidJustNow, setPaidJustNow] = useState(false);
  const [amountNaira, setAmountNaira] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  setAmountNaira(session.amountNaira ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, dash, report] = await Promise.all([
        listStudentPayments().catch(() => []),
        getStudentDashboard().catch(() => null),
        getStudentReport().catch(() => null),
      ]);

      const list = Array.isArray(payRes) ? (payRes as PaymentRow[]) : [];
      setPayments(list);
      setHasSuccess(list.some((p) => p.status === "success"));

      let planId: string | null = null;
      if (dash) {
        const d = dash as { currentSession?: { learningPlanId?: string } };
        if (d.currentSession?.learningPlanId) planId = d.currentSession.learningPlanId;
      }
      if (!planId && report) {
        const r = report as { learningPlans?: Array<{ planId?: string; id?: string }> };
        const first = r.learningPlans?.[0];
        planId = first?.planId || first?.id || null;
      }
      if (!planId) {
        const anyWithPlan = list.find((p) => p.learningPlanId);
        planId = anyWithPlan?.learningPlanId ?? null;
      }
      setLearningPlanId(planId);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.status}: ${err.message}` : err instanceof Error ? err.message : "Failed to load"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resume a session that survived a page reload
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setAccount(session.account);
      setPaymentId(session.paymentId);
      setTimeLeft(Math.max(0, Math.floor((session.expiresAtMs - Date.now()) / 1000)));
      setShowModal(true);
      setAmountNaira(session.amountNaira ?? null);
    }
  }, []);

  // Countdown
  useEffect(() => {
    if (!showModal) return;
    const interval = setInterval(() => setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [showModal]);

  // Expiry — the account stops being usable, so the modal closes itself
  useEffect(() => {
    if (showModal && timeLeft === 0) {
      clearSession();
      setMessage("This virtual account expired unpaid. Generate a new one to try again.");
      setShowModal(false);
      setAccount(null);
      setPaymentId(null);
    }
  }, [timeLeft, showModal]);

  const handleConfirmed = useCallback(
    (status: string) => {
      if (status === "success") {
        clearSession();
        setPaidJustNow(true);
        setShowModal(false);
        setMessage("Payment confirmed — your plan is now unlocked.");
        load();
      } else if (status === "failed") {
        clearSession();
        setShowModal(false);
        setMessage("This payment failed. Generate a new invoice to try again.");
      }
      // status === 'pending' — keep waiting, nothing to do
    },
    [load]
  );

  // Background polling while the modal is open
  useEffect(() => {
    if (!showModal || !paymentId) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getStudentPaymentStatus(paymentId);
        if (data.status !== "pending") handleConfirmed(data.status);
      } catch {
        // network hiccup — try again next tick
      }
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showModal, paymentId, handleConfirmed]);

  // Prevent an accidental tab close while a transfer might be in flight
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showModal]);

  async function onGenerateInvoice() {
    if (!learningPlanId) {
      setMessage("No learning plan found yet. Ask your educator to assign one, then refresh this page.");
      return;
    }
    setInitiating(true);
    setMessage(null);
    try {
      const res = await initiateStudentPayment(learningPlanId);
      if (res.virtualAccount?.accountNumber && res.paymentId) {
        const expiresAtMs = res.virtualAccount.expiresAt
          ? new Date(res.virtualAccount.expiresAt).getTime()
          : Date.now() + 20 * 60 * 1000;
        setAccount(res.virtualAccount);
        setPaymentId(res.paymentId);
        setTimeLeft(Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)));
        setShowModal(true);const amt = res.payment?.amountNaira ?? null;
        setAmountNaira(amt);
        saveSession({ paymentId: res.paymentId, account: res.virtualAccount, expiresAtMs, amountNaira: amt ?? undefined });
      
      } else {
        setMessage(res.message || "Payment record already exists for this plan.");
      }
      await load();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not generate payment");
    } finally {
      setInitiating(false);
    }
  }

  async function onConfirmTransfer() {
    if (!paymentId) return;
    setChecking(true);
    try {
      const data = await getStudentPaymentStatus(paymentId);
      if (data.status !== "pending") {
        handleConfirmed(data.status);
      } else {
        setMessage("We haven't received confirmation yet. We'll keep checking automatically.");
      }
    } catch {
      setMessage("Could not reach the server. We'll keep checking automatically.");
    } finally {
      setChecking(false);
    }
  }

  function onCancel() {
    if (!window.confirm("Cancel this payment? The virtual account will no longer be monitored.")) return;
    clearSession();
    setShowModal(false);
    setAccount(null);
    setPaymentId(null);
  }

  async function onCopy() {
    if (!account?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Could not copy — long-press the number to copy it manually.");
    }
  }

  const showPayPanel = !hasSuccess;

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <Link href="/students" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">Payments</span>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">Billing</p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">Payments</h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Generate a virtual account and transfer directly — GafiaPay confirms automatically, usually within a minute.
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {error && <p className="mt-6 text-[13px] text-[var(--danger)] font-semibold">{error}</p>}

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
                    <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">Generate payment</h2>
                    <p className="mt-1 text-[13px] text-[var(--ink-2)] leading-relaxed">
                      Click below to generate a temporary account number. Transfer the exact amount and it unlocks automatically.
                    </p>

                    {learningPlanId && (
                      <p className="mt-2 text-[11.5px] text-[var(--ink-4)] font-semibold">
                        Learning plan · {learningPlanId.slice(0, 8)}…
                      </p>
                    )}

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
                          Generate virtual account
                        </>
                      )}
                    </button>

                    {!learningPlanId && (
                      <p className="mt-2 text-[12px] font-semibold text-[var(--warn)]">
                        No learning plan found yet. Ask your educator to assign one, then refresh this page.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {message && (
              <p className={cn("mt-4 text-[13px] font-semibold", /could not|failed|expired|no learning/i.test(message) ? "text-[var(--danger)]" : "text-[var(--ok)]")}>
                {message}
              </p>
            )}

            <section className="mt-8">
              <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)] mb-3">Payment history</h2>
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                {payments.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-3)]">No payments yet. Generate one above.</p>
                ) : (
                  <ul>
                    {payments.map((p) => {
                      const status = String(p.status ?? "—");
                      return (
                        <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--line-soft)] last:border-0">
                          <StatusIcon status={status} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[13px] text-[var(--ink)] tabular-nums">
                              ₦{(p.amountNaira ?? 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{p.createdAt ?? p.id.slice(0, 8)}</div>
                          </div>
                          <span
                            className={cn(
                              "text-[10.5px] font-bold px-2 py-0.5 rounded-full capitalize",
                              status === "pending" && "bg-[var(--warn-soft)] text-[var(--warn)]",
                              status === "success" && "bg-[var(--ok-soft)] text-[var(--ok)]",
                              status === "failed" && "bg-[var(--danger-soft)] text-[var(--danger)]",
                              status === "refunded" && "bg-[var(--surface-3)] text-[var(--ink-3)]"
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

      {/* Virtual account modal */}
      {showModal && account && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl max-w-md w-full p-8 border border-[var(--line)] shadow-lg">
            <h3 className="font-heading text-[19px] text-[var(--ink)] mb-6">Pay into this account</h3>

            <div className="space-y-5">
              {amountNaira != null && (
                <div className="rounded-[12px] bg-[var(--surface-2)] p-4">
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-1">Amount to transfer</p>
                  <p className="text-[24px] font-bold text-[var(--ink)] tabular-nums">₦{amountNaira.toLocaleString()}</p>
                </div>
              )}
              <div className="rounded-[12px] bg-[var(--surface-2)] p-4">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-1">Account Number</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[24px] font-bold tracking-widest text-[var(--brand)]">{account.accountNumber}</p>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-2 rounded-[10px] border border-[var(--line)] hover:border-[var(--brand)] flex-none"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                        Copied
                      </>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {account.accountName && (
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">Account Name</p>
                  <p className="font-semibold text-[15px] text-[var(--ink)] mt-0.5">{account.accountName}</p>
                </div>
              )}
              {account.bankName && (
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">Bank</p>
                  <p className="font-semibold text-[15px] text-[var(--ink)] mt-0.5">{account.bankName}</p>
                </div>
              )}

              <div
                className={cn(
                  "text-center text-[13px] font-bold",
                  timeLeft < 60 ? "text-[var(--danger)]" : "text-[var(--ink-3)]"
                )}
              >
                Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <button
              type="button"
              onClick={onConfirmTransfer}
              disabled={checking}
              className="mt-7 w-full h-12 rounded-[10px] bg-[var(--brand)] text-white font-bold text-[13px] disabled:opacity-70 flex items-center justify-center gap-2 hover:bg-[var(--brand-ink)]"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  I have made the transfer
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full text-[var(--ink-3)] text-[11.5px] font-bold uppercase tracking-wide py-2 hover:text-[var(--ink)]"
            >
              Cancel payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-5 h-5 text-[var(--ok)] flex-none" />;
  if (status === "pending") return <Clock className="w-5 h-5 text-[var(--warn)] flex-none" />;
  return <XCircle className="w-5 h-5 text-[var(--danger)] flex-none" />;
}