"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listAllPayments,
  listPendingPayments,
  setPaymentStatus,
  ApiError,
} from "@/lib/api";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "success" | "failed" | "refunded";

export default function AdminPaymentsPage() {
  const [all, setAll] = useState<Record<string, unknown>[]>([]);
  const [pending, setPending] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [raw, setRaw] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a] = await Promise.all([
        listPendingPayments().catch((e) => {
          console.warn(e);
          return [];
        }),
        listAllPayments().catch((e) => {
          console.warn(e);
          return [];
        }),
      ]);
      const pendingList = Array.isArray(p) ? p : [];
      const allList = Array.isArray(a) ? a : [];
      setPending(pendingList as Record<string, unknown>[]);
      setAll(allList as Record<string, unknown>[]);
      setRaw({ pending: p, all: a });
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
    const c = {
      all: all.length,
      pending: pending.length || all.filter((p) => p.status === "pending").length,
      success: all.filter((p) => p.status === "success").length,
      failed: all.filter((p) => p.status === "failed").length,
      refunded: all.filter((p) => p.status === "refunded").length,
    };
    return c;
  }, [all, pending]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await setPaymentStatus(id, action);
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
      <div className="flex flex-wrap gap-1 p-1 rounded-[9px] bg-[var(--surface-3)] w-fit mb-5">
        {(
          [
            ["pending", "Pending"],
            ["all", "All"],
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
                    colSpan={4}
                    className="px-4 py-10 text-center text-[var(--ink-3)]"
                  >
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
                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--ink)] text-[12px]">
                        {id.slice(0, 8)}…
                      </div>
                      <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                        student {String(p.studentId ?? "—").slice(0, 8)} · plan{" "}
                        {String(p.learningPlanId ?? "—").slice(0, 8)}
                      </div>
                      {p.createdAt != null && (
                        <div className="text-[10.5px] text-[var(--ink-4)] mt-0.5">
                          {String(p.createdAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                      ₦
                      {Number(p.amountNaira ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === id}
                              onClick={() => act(id, "approve")}
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-[7px] text-[11px] font-bold text-[var(--ok)] hover:bg-[var(--ok-soft)] disabled:opacity-50"
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
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-[7px] text-[11px] font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
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

      {raw != null && (
        <details className="mt-6">
          <summary className="text-[12px] font-bold text-[var(--ink-3)] cursor-pointer">
            Raw payments JSON
          </summary>
          <pre className="mt-2 text-[11px] text-[var(--ink-3)] overflow-auto max-h-72 rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)]">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      )}
    </AdminShell>
  );
}