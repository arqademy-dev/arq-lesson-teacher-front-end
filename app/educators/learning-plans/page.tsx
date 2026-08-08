"use client";

import { useEffect, useState } from "react";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  listEducatorLearningPlans,
  listEducatorStudents,
  listLearningPlansForStudent,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EducatorLearningPlansPage() {
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

        const globalPlans = await listEducatorLearningPlans().catch((e) => ({
          _error: e instanceof Error ? e.message : String(e),
          body: e instanceof ApiError ? e.body : undefined,
        }));

        const studentsRaw = await listEducatorStudents().catch(() => []);
        const students = Array.isArray(studentsRaw)
          ? studentsRaw
          : (studentsRaw as { students?: unknown[] })?.students ?? [];

        const perStudent = await Promise.all(
          (students as Record<string, unknown>[]).map(async (s) => {
            const sid = String(s.id);
            const plans = await listLearningPlansForStudent(sid).catch((e) => ({
              error: e instanceof Error ? e.message : String(e),
            }));
            return {
              student: s,
              plans,
            };
          })
        );

        setBundle({ globalPlans, perStudent });
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
      title="Learning plans"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
        Temporary JSON view of plans for your students. UI polish next.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading plans…
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