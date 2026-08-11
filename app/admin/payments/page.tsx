"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listAllPayments,
  listPendingPayments,
  setPaymentStatus,
  ApiError,
} from "@/lib/api";
import { Loader2, Check, X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "success" | "failed" | "refunded";

type PaymentRow = {
  id: string;
  studentId?: string;
  learningPlanId?: string;
  pricingTierId?: string;
  amountNaira?: number;
  status?: string;
  provider?: string | null;
  providerReference?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminPaymentsPage() {
  const [all, setAll] = useState<PaymentRow[]>([]);
  const [pending, setPending] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a] = await Promise.all([
        listPendingPayments().catch(() => []),
        listAllPayments().catch(() => []),
      ]);
      const pendingList = (Array.isArray(p) ? p : []) as PaymentRow[];
      const allList = (Array.isArray(a) ? a : []) as PaymentRow[];
      setPending(pendingList);
      setAll(allList);
      // Prefer pending tab if there is work waiting
      if (pendingList.length > 0) setFilter((f) => (f === "all" ? "pending" : f));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Failed"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (filter === "pending") {
      if (pending.length) return pending;
      return all.filter((p) => String(p.status) === "pending");
    }
    if (filter === "all") return all;
    return all.filter((p) => String(p.status) === filter);
  }, [all, pending, filter]);

  const counts = useMemo(() => {
    return {
      all: all.length,
      pending:
        pending.length ||
        all.filter((p) => p.status === "pending").length,
      success: all.filter((p) => p.status === "success").length,
      failed: all.filter((p) => p.status === "failed").length,
      refunded: all.filter((p) => p.status === "refunded").length,
    };
  }, [all, pending]);

  const revenue = useMemo(() => {
    return all
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + Number(p.amountNaira ?? 0), 0);
  }, [all]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setMessage(null);
    try {
      await setPaymentStatus(id, action);
      setMessage(
        action === "approve"
          ? "Payment marked successful."
          : "Payment rejected."
      );
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title="Payments"
      subtitle="Finance"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      {/* Summary strip */}
      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-3 mb-5 max-w-2xl">
          <SummaryCard
            label="Revenue (success)"
            value={`₦${revenue.toLocaleString()}`}
          />
          <SummaryCard
            label="Successful"
            value={String(counts.success)}
            tone="ok"
          />
          <SummaryCard
            label="Pending review"
            value={String(counts.pending)}
            tone={counts.pending > 0 ? "warn" : "muted"}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1 p-1 rounded-[9px] bg-[var(--surface-3)] w-fit mb-5">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["success", "Success"],
            ["failed", "Failed"],
            ["refunded", "Refunded"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "px-3.5 py-1.5 rounded-[7px] text-[12px] font-bold transition",
              filter === key
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            )}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {message && (
        <p className="mb-3 text-[12.5px] font-semibold text-[var(--ok)]">
          {message}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading payments…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold mb-3">
          {error}
        </p>
      )}

      {!loading && (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Payment
                </th>
                <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Amount
                </th>
                <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Provider
                </th>
                <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-[var(--ink-3)]"
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No payments in this filter.
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const id = String(p.id);
                const status = String(p.status ?? "—");
                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[var(--ink)] text-[12.5px] font-mono">
                        {id.slice(0, 8)}…
                      </div>
                      <div className="text-[11px] text-[var(--ink-3)] mt-1 space-y-0.5">
                        <div>
                          Student · {String(p.studentId ?? "—").slice(0, 8)}…
                        </div>
                        <div>
                          Plan · {String(p.learningPlanId ?? "—").slice(0, 8)}…
                        </div>
                        <div className="text-[var(--ink-4)]">
                          Created {formatWhen(p.createdAt)}
                        </div>
                        {p.paidAt && (
                          <div className="text-[var(--ok)] font-semibold">
                            Paid {formatWhen(p.paidAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-heading text-[16px] font-semibold tabular-nums text-[var(--ink)]">
                        ₦{Number(p.amountNaira ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[var(--ink)] capitalize">
                        {p.provider || "—"}
                      </div>
                      {p.providerReference && (
                        <div className="text-[10.5px] text-[var(--ink-3)] font-mono mt-0.5 max-w-[140px] truncate">
                          {p.providerReference}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize",
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
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === id}
                              onClick={() => act(id, "approve")}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[7px] text-[11px] font-bold text-[var(--ok)] hover:bg-[var(--ok-soft)] disabled:opacity-50"
                            >
                              {busyId === id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === id}
                              onClick={() => act(id, "reject")}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[7px] text-[11px] font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-4)] font-semibold">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "muted";
}) {
  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
        {label}
      </div>
      <div
        className={cn(
          "font-heading text-[20px] font-semibold mt-1 tabular-nums",
          tone === "ok" && "text-[var(--ok)]",
          tone === "warn" && "text-[var(--warn)]",
          tone === "muted" && "text-[var(--ink-3)]",
          tone === "default" && "text-[var(--ink)]"
        )}
      >
        {value}
      </div>
    </div>
  );
}