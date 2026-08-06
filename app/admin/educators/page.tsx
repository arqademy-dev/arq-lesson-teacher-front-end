"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listPendingEducators,
  listAllEducators,
  setEducatorApproval,
  ApiError,
  type AdminEducator,
} from "@/lib/api";
import { Loader2, Check, Ban, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminEducatorsPage() {
  const [pending, setPending] = useState<AdminEducator[]>([]);
  const [all, setAll] = useState<AdminEducator[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a] = await Promise.all([
        listPendingEducators(),
        listAllEducators(),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setAll(Array.isArray(a) ? a : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Not authenticated. Log in as admin.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(
    id: string,
    action: "approve" | "suspend" | "close"
  ) {
    setBusyId(id);
    try {
      await setEducatorApproval(id, action);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const rows = tab === "pending" ? pending : all;
  

  return (
    <AdminShell
      title="Educators"
      subtitle="Staff room"
      pendingCount={pending.length}
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <div className="flex gap-1 p-1 rounded-[9px] bg-[var(--surface-3)] w-fit mb-5">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-3.5 py-1.5 rounded-[7px] text-[12px] font-bold transition",
              tab === t
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            )}
          >
            {t === "pending" ? `Pending (${pending.length})` : `All (${all.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading educators…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && !error && (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="text-left px-[18px] py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Educator
                </th>
                <th className="text-left px-[18px] py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Arq ID
                </th>
                <th className="text-left px-[18px] py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Status
                </th>
                <th className="text-right px-[18px] py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-[18px] py-10 text-center text-[var(--ink-3)]"
                  >
                    No educators in this list.
                  </td>
                </tr>
              )}
              {rows.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <td className="px-[18px] py-3">
                    <div className="font-bold text-[var(--ink)]">
                      {e.firstName} {e.lastName}
                    </div>
                    <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                      {e.email}
                    </div>
                  </td>
                  <td className="px-[18px] py-3 font-semibold text-[var(--ink-2)]">
                    {e.arqId}
                  </td>
                  <td className="px-[18px] py-3">
                    <StatusChip status={e.approvalStatus ?? e.accountApproval ?? "pending"} />
                  </td>
                  <td className="px-[18px] py-3">
                    <div className="flex justify-end gap-1.5">
                      {e.accountApproval === "pending" && (
                        <ActionBtn
                          label="Approve"
                          icon={Check}
                          tone="ok"
                          busy={busyId === e.id}
                          onClick={() => act(e.id, "approve")}
                        />
                      )}
                      {e.accountApproval === "approve" && (
                        <ActionBtn
                          label="Suspend"
                          icon={Ban}
                          tone="warn"
                          busy={busyId === e.id}
                          onClick={() => act(e.id, "suspend")}
                        />
                      )}
                      {e.accountApproval !== "closed" && (
                        <ActionBtn
                          label="Close"
                          icon={XCircle}
                          tone="danger"
                          busy={busyId === e.id}
                          onClick={() => act(e.id, "close")}
                        />
                      )}
                      {e.accountApproval === "suspended" && (
                        <ActionBtn
                          label="Approve"
                          icon={Check}
                          tone="ok"
                          busy={busyId === e.id}
                          onClick={() => act(e.id, "approve")}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
    approve: "bg-[var(--ok-soft)] text-[var(--ok)]",
    suspended: "bg-[var(--danger-soft)] text-[var(--danger)]",
    closed: "bg-[var(--surface-3)] text-[var(--ink-3)]",
  };
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize",
        map[status] || map.closed
      )}
    >
      {status}
    </span>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  tone,
  busy,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ok" | "warn" | "danger";
  busy?: boolean;
  onClick: () => void;
}) {
  const tones = {
    ok: "text-[var(--ok)] hover:bg-[var(--ok-soft)]",
    warn: "text-[var(--warn)] hover:bg-[var(--warn-soft)]",
    danger: "text-[var(--danger)] hover:bg-[var(--danger-soft)]",
  };
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-2 rounded-[7px] text-[11px] font-bold",
        tones[tone],
        "disabled:opacity-50"
      )}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
}