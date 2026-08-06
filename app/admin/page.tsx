"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  getAdminDashboard,
  listPendingEducators,
  ApiError,
} from "@/lib/api";
import { Loader2, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const [pending, setPending] = useState(0);
  const [dash, setDash] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, d] = await Promise.all([
          listPendingEducators().catch(() => []),
          getAdminDashboard().catch(() => null),
        ]);
        setPending(Array.isArray(p) ? p.length : 0);
        setDash(d);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function logout() {
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="HQ" onLogout={logout}>
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Dashboard" subtitle="HQ" onLogout={logout}>
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
        <Link href="/admin/login" className="text-[12.5px] font-bold text-[var(--brand)]">
          Go to login →
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Dashboard"
      subtitle="HQ"
      pendingCount={pending}
      onLogout={logout}
    >
      <Link
        href="/admin/educators"
        className="inline-flex items-center gap-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] transition max-w-sm"
      >
        <div className="w-10 h-10 rounded-[10px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="font-heading text-[14px] font-semibold text-[var(--ink)]">
            Educators
          </div>
          <div className="text-[12.5px] text-[var(--ink-3)] font-semibold mt-0.5">
            {pending} pending approval
          </div>
        </div>
      </Link>

      {dash != null && (
        <pre className="mt-6 text-[11px] text-[var(--ink-3)] overflow-auto max-h-56 rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)]">
          {JSON.stringify(dash, null, 2)}
        </pre>
      )}
    </AdminShell>
  );
}