"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listPendingEducators,
  listAllEducators,
  setEducatorApproval,
  educatorStatusOf,
  ApiError,
  type AdminEducator,
} from "@/lib/api";
import { Loader2, Check, Ban, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "approve" | "suspended" | "closed";

export default function AdminEducatorsPage() {
  const [all, setAll] = useState<AdminEducator[]>([]);
  const [pending, setPending] = useState<AdminEducator[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
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

  const counts = useMemo(() => {
    const c = { all: all.length, pending: 0, approve: 0, suspended: 0, closed: 0 };
    for (const e of all) {
      const s = educatorStatusOf(e) as Filter;
      if (s in c && s !== "all") c[s as keyof typeof c]++;
    }
    // prefer pending endpoint count if richer
    if (pending.length > c.pending) c.pending = pending.length;
    return c;
  }, [all, pending]);

  const rows = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "pending") {
      // merge pending list + filtered all
      const ids = new Set(pending.map((e) => e.id));
      const fromAll = all.filter((e) => educatorStatusOf(e) === "pending");
      const extra = pending.filter((e) => !ids.has(e.id) === false);
      const map = new Map<string, AdminEducator>();
      [...fromAll, ...pending].forEach((e) => map.set(e.id, e));
      return Array.from(map.values());
    }
    return all.filter((e) => educatorStatusOf(e) === filter);
  }, [all, pending, filter]);

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

  return (
    <AdminShell
      title="Educators"
      subtitle="Staff room"
      pendingCount={counts.pending}
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <div className="flex flex-wrap gap-1 p-1 rounded-[9px] bg-[var(--surface-3)] w-fit mb-5">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["approve", "Approved"],
            ["suspended", "Suspended"],
            ["closed", "Closed"],
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
                    No educators in this filter.
                  </td>
                </tr>
              )}
              {rows.map((e) => {
                const status = educatorStatusOf(e);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-[18px] py-3">
                      <Link
                        href={`/admin/educators/${e.id}`}
                        className="font-bold text-[var(--ink)] hover:text-[var(--brand)] inline-flex items-center gap-1"
                      >
                        {e.firstName} {e.lastName}
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                      <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                        {e.email}
                      </div>
                    </td>
                    <td className="px-[18px] py-3 font-semibold text-[var(--ink-2)]">
                      {e.arqId}
                    </td>
                    <td className="px-[18px] py-3">
                      <StatusChip status={status} />
                    </td>
                    <td className="px-[18px] py-3">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {status === "pending" && (
                          <ActionBtn
                            label="Approve"
                            icon={Check}
                            tone="ok"
                            busy={busyId === e.id}
                            onClick={() => act(e.id, "approve")}
                          />
                        )}
                        {status === "approve" && (
                          <ActionBtn
                            label="Suspend"
                            icon={Ban}
                            tone="warn"
                            busy={busyId === e.id}
                            onClick={() => act(e.id, "suspend")}
                          />
                        )}
                        {status === "suspended" && (
                          <ActionBtn
                            label="Approve"
                            icon={Check}
                            tone="ok"
                            busy={busyId === e.id}
                            onClick={() => act(e.id, "approve")}
                          />
                        )}
                        {status !== "closed" && (
                          <ActionBtn
                            label="Close"
                            icon={XCircle}
                            tone="danger"
                            busy={busyId === e.id}
                            onClick={() => act(e.id, "close")}
                          />
                        )}
                        <Link
                          href={`/admin/educators/${e.id}`}
                          className="inline-flex items-center h-7 px-2 rounded-[7px] text-[11px] font-bold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                        >
                          Open
                        </Link>
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