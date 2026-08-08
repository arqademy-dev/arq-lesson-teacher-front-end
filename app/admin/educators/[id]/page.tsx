"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  getAdminEducator,
  setEducatorApproval,
  getAdminStudentReport,
  getAdminStudentLearningHistory,
  educatorStatusOf,
  ApiError,
} from "@/lib/api";
import { Loader2, ArrowLeft, Check, Ban, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminEducatorDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [studentJson, setStudentJson] = useState<any>(null);
  const [studentLabel, setStudentLabel] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEducator(id);
      setProfile(data);
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
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const root = profile as {
    educator?: Record<string, unknown>;
    students?: Array<Record<string, unknown>>;
    totalStudents?: number;
  } | null;

  const educator = (root?.educator ?? root) as Record<string, unknown> | null;
  const students = Array.isArray(root?.students) ? root!.students! : [];

  async function act(action: "approve" | "suspend" | "close") {
    setBusy(true);
    try {
      await setEducatorApproval(id, action);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function openStudent(studentId: string, name: string) {
    setStudentLabel(name);
    setStudentLoading(true);
    setStudentJson(null);
    try {
      const [report, history] = await Promise.all([
        getAdminStudentReport(studentId).catch((e) => ({
          _error: "report",
          message: e instanceof Error ? e.message : String(e),
        })),
        getAdminStudentLearningHistory(studentId).catch((e) => ({
          _error: "learning-history",
          message: e instanceof Error ? e.message : String(e),
        })),
      ]);
      setStudentJson({ report, learningHistory: history });
    } finally {
      setStudentLoading(false);
    }
  }

  const status = educator
    ? educatorStatusOf(
        educator as { approvalStatus?: string; accountApproval?: string }
      )
    : "—";

  return (
    <AdminShell
      title={
        educator
          ? `${educator.firstName ?? ""} ${educator.lastName ?? ""}`.trim() ||
            "Educator"
          : "Educator"
      }
      subtitle="Staff room"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <Link
        href="/admin/educators"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All educators
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading profile…
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
          <p className="text-[12px] text-[var(--ink-3)]">
            If this is 404, the backend path may differ — raw error is above.
          </p>
        </div>
      )}

      {!loading && educator && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <StatusChip status={status} />
              <div className="flex gap-1.5">
                {status === "pending" && (
                  <ActionBtn
                    label="Approve"
                    icon={Check}
                    tone="ok"
                    busy={busy}
                    onClick={() => act("approve")}
                  />
                )}
                {status === "approve" && (
                  <ActionBtn
                    label="Suspend"
                    icon={Ban}
                    tone="warn"
                    busy={busy}
                    onClick={() => act("suspend")}
                  />
                )}
                {status !== "closed" && (
                  <ActionBtn
                    label="Close"
                    icon={XCircle}
                    tone="danger"
                    busy={busy}
                    onClick={() => act("close")}
                  />
                )}
              </div>
            </div>
            <pre className="text-[11px] text-[var(--ink-3)] overflow-auto max-h-[420px] leading-relaxed">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </section>

          <section className="space-y-4">
            <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line-soft)] font-heading text-[13px] font-semibold text-[var(--ink)]">
                Students ({root?.totalStudents ?? students.length})
              </div>
              {students.length === 0 ? (
                <p className="px-4 py-8 text-[13px] text-[var(--ink-3)] text-center">
                  No students linked yet.
                </p>
              ) : (
                <ul>
                  {students.map((s) => {
                    const sid = String(s.id);
                    const name =
                      `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
                      sid;
                    return (
                      <li
                        key={sid}
                        className="border-b border-[var(--line-soft)] last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => openStudent(sid, name)}
                          className="w-full text-left px-4 py-3 hover:bg-[var(--surface-2)]"
                        >
                          <div className="font-bold text-[13px] text-[var(--ink)]">
                            {name}
                          </div>
                          <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                            {[s.arqId, s.email, s.academicLevel]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {(studentLoading || studentJson) && (
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                <p className="text-[12px] font-bold text-[var(--ink)] mb-2">
                  {studentLabel} — report + learning history
                </p>
                {studentLoading ? (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <pre className="text-[11px] text-[var(--ink-3)] overflow-auto max-h-[480px] leading-relaxed">
                    {JSON.stringify(studentJson, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </section>
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
        "inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize",
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
        "inline-flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[11.5px] font-bold",
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