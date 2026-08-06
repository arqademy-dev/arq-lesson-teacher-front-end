"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  listEducatorStudents,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2, ChevronRight, UserPlus } from "lucide-react";

export default function EducatorStudentsPage() {
  const [students, setStudents] = useState<unknown[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }
        const data = await listEducatorStudents();
        setRaw(data);
        setStudents(Array.isArray(data) ? data : (data as { students?: unknown[] })?.students ?? []);
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
    })();
  }, []);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  return (
    <EducatorShell
      title="My students"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <div className="flex justify-end mb-4">
        <Link
          href="/educators/students/new"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
        >
          <UserPlus className="w-4 h-4" />
          Enroll student
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading students…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold mb-4">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          {students.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-3)]">
              No students yet. Enroll your first learner.
            </p>
          ) : (
            <ul>
              {students.map((s, i) => {
                const row = s as Record<string, unknown>;
                const sid = String(row.id ?? i);
                const label =
                  `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() ||
                  sid;
                return (
                  <li
                    key={sid}
                    className="border-b border-[var(--line-soft)] last:border-0"
                  >
                    <Link
                      href={`/educators/students/${sid}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-2)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] text-[var(--ink)]">
                          {label}
                        </div>
                        <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                          {[row.arqId, row.email, row.academicLevel]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-4)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {raw != null && (
        <details className="mt-6">
          <summary className="text-[12px] font-bold text-[var(--ink-3)] cursor-pointer">
            Raw list JSON
          </summary>
          <pre className="mt-2 text-[11px] text-[var(--ink-3)] overflow-auto max-h-64 rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)]">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      )}
    </EducatorShell>
  );
}