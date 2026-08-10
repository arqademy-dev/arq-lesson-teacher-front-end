"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EducatorShell } from "@/components/layout/EducatorShell";
import {
  getEducatorStudent,
  getEducatorStudentReport,
  getEducatorStudentLearningHistory,
  getEducatorMe,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2, ArrowLeft, UserPlus } from "lucide-react";

export default function EducatorStudentDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [bundle, setBundle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }

        const [student, report, history] = await Promise.all([
          getEducatorStudent(id).catch((e) => ({
            _endpoint: "GET /api/educators/students/{id}",
            error: e instanceof Error ? e.message : String(e),
            body: e instanceof ApiError ? e.body : undefined,
          })),
          getEducatorStudentReport(id).catch((e) => ({
            _endpoint: "GET /api/educators/students/{id}/report",
            error: e instanceof Error ? e.message : String(e),
            body: e instanceof ApiError ? e.body : undefined,
          })),
          getEducatorStudentLearningHistory(id).catch((e) => ({
            _endpoint: "GET /api/educators/students/{id}/learning-history",
            error: e instanceof Error ? e.message : String(e),
            body: e instanceof ApiError ? e.body : undefined,
          })),
        ]);

        setBundle({ student, report, learningHistory: history });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  return (
    <EducatorShell
      title="Student detail"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <Link
        href="/educators/students"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All students
      </Link>
      <div className="flex justify-end mb-4">
        <Link
          href={`/educators/students/${id}/learning-plan`}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
        >
          <UserPlus className="w-4 h-4" />
          Assign learning plan
        </Link>
      </div>
      <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
        Temporary view — full JSON from profile, assessment report, and learning
        history. UI polish comes after we confirm shapes.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading student data…
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