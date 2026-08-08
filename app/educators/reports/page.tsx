"use client";

import { useEffect, useState } from "react";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  listEducatorStudents,
  getEducatorStudentReport,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EducatorReportsPage() {
  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        const studentsRaw = await listEducatorStudents();
        const students = Array.isArray(studentsRaw)
          ? studentsRaw
          : (studentsRaw as { students?: unknown[] })?.students ?? [];

        const reports = await Promise.all(
          (students as Record<string, unknown>[]).map(async (s) => {
            const sid = String(s.id);
            const report = await getEducatorStudentReport(sid).catch((e) => ({
              error: e instanceof Error ? e.message : String(e),
              body: e instanceof ApiError ? e.body : undefined,
            }));
            return { student: s, report };
          })
        );

        setBundle({ reports });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
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
      title="Reports"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
        Assessment reports for each of your students (`StudentReport` JSON).
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading reports…
        </div>
      )}
      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}
      {!loading && bundle && (
        <pre className="text-[11px] text-[var(--ink-3)] overflow-auto max-h-[70vh] rounded-[12px] border border-[var(--line)] p-4 bg-[var(--surface)] leading-relaxed">
          {JSON.stringify(bundle, null, 2)}
        </pre>
      )}
    </EducatorShell>
  );
}