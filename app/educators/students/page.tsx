"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { Modal } from "@/components/ui/Modal";
import {
  listEducatorStudents,
  getEducatorMe,
  getEducatorStudent,
  getEducatorStudentReport,
  educatorLogout,
  ApiError,
} from "@/lib/api";
import { Loader2, UserPlus, Mail } from "lucide-react";

type StudentRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  arqId?: string;
  academicLevel?: string;
  programId?: string;
  programmeTitle?: string;
  programTitle?: string; // alternate key if backend uses this
};

/** Pull a 0–100 progress number from report if the API sends one */
function progressFromReport(report: unknown): number | null {
  if (!report || typeof report !== "object") return null;
  const r = report as Record<string, unknown>;

  const candidates = [
    r.progress,
    r.progressPercent,
    r.completionPercent,
    r.overallProgress,
    (r.summary as Record<string, unknown> | undefined)?.progress,
    (r.summary as Record<string, unknown> | undefined)?.progressPercent,
  ];

  for (const v of candidates) {
    if (typeof v === "number" && !Number.isNaN(v)) {
      return Math.max(0, Math.min(100, Math.round(v)));
    }
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Math.max(0, Math.min(100, Math.round(Number(v))));
    }
  }

  // completed / total sessions style
  const done = Number(r.completedSessions ?? r.completed ?? NaN);
  const total = Number(r.totalSessions ?? r.total ?? NaN);
  if (!Number.isNaN(done) && !Number.isNaN(total) && total > 0) {
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }

  return null;
}

function programmeLabel(s: StudentRow, detail?: Record<string, unknown> | null) {
  return (
    s.programmeTitle ||
    s.programTitle ||
    (detail?.programmeTitle as string | undefined) ||
    (detail?.programTitle as string | undefined) ||
    "—"
  );
}

export default function EducatorStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await getEducatorMe().catch(() => null);
        if (me) {
          setName(`${me.firstName} ${me.lastName}`.trim());
          setArqId(me.arqId);
        }
        const data = await listEducatorStudents();
        const list = Array.isArray(data)
          ? data
          : ((data as { students?: StudentRow[] })?.students ?? []);
        setStudents(list as StudentRow[]);
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

  async function openStudent(id: string) {
    setSelectedId(id);
    setDetail(null);
    setProgress(null);
    setDetailLoading(true);
    try {
      const [d, r] = await Promise.all([
        getEducatorStudent(id).catch(() => null),
        getEducatorStudentReport(id).catch(() => null),
      ]);
      setDetail((d as Record<string, unknown>) ?? null);
      setProgress(progressFromReport(r));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  const label = (s: StudentRow) =>
    `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.id;

  const selectedRow = students.find((s) => s.id === selectedId);

  return (
    <EducatorShell
      title="My students"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <div className="flex justify-end mb-6">
        <Link
          href="/educators/students/new"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)]"
        >
          <UserPlus className="w-4 h-4" />
          Enroll student
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)] py-8">
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
            <p className="px-6 py-12 text-center text-[13px] text-[var(--ink-3)]">
              No students yet. Enroll your first learner.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)]">
              {students.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openStudent(s.id)}
                    className="w-full flex items-center gap-4 px-6 py-5 hover:bg-[var(--surface-2)] text-left transition"
                  >
                    <div className="flex-none w-11 h-11 rounded-full grid place-items-center text-xs font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                      {`${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase() ||
                        "?"}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-[14px] text-[var(--ink)] truncate">
                        {label(s)}
                      </div>
                      <div className="text-[12px] text-[var(--ink-3)] truncate">
                        {programmeLabel(s)}
                      </div>
                      {s.email && (
                        <div className="text-[11px] text-[var(--ink-4)] truncate">
                          {s.email}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Student"
        footer={
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="btn ghost small"
          >
            Close
          </button>
        }
      >
        {detailLoading ? (
          <div className="px-6 py-12 text-center text-[var(--ink-3)]">
            <Loader2 className="w-5 h-5 animate-spin inline" /> Loading…
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Basic identity only */}
            <div className="flex items-start gap-4">
              <div className="flex-none w-14 h-14 rounded-full grid place-items-center text-lg font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                {selectedRow
                  ? `${selectedRow.firstName?.[0] ?? ""}${selectedRow.lastName?.[0] ?? ""}`.toUpperCase() ||
                    "?"
                  : "?"}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-xl font-semibold truncate">
                  {detail
                    ? `${String(detail.firstName ?? "")} ${String(detail.lastName ?? "")}`.trim()
                    : selectedRow
                      ? label(selectedRow)
                      : "Student"}
                </h3>
                <p className="text-sm text-[var(--ink-3)] mt-1">
                  {programmeLabel(selectedRow ?? { id: "" }, detail)}
                </p>
                {(detail?.email || selectedRow?.email) && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-[var(--ink-2)]">
                    <Mail className="w-4 h-4 text-[var(--brand)]" />
                    {String(detail?.email ?? selectedRow?.email)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress only — no topics / plan JSON */}
            <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] mb-3">
                Progress
              </div>
              {progress == null ? (
                <p className="text-sm text-[var(--ink-3)]">
                  No progress data yet.
                </p>
              ) : (
                <>
                  <div className="h-3 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--teal)] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="font-mono text-3xl font-semibold mt-3 text-[var(--ink)]">
                    {progress}%
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </EducatorShell>
  );
}