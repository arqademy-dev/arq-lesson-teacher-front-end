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
import {
  Loader2,
  ArrowLeft,
  Check,
  Ban,
  XCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EducatorCore = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  arqId?: string;
  accountApproval?: string;
  approvalStatus?: string;
  specialization?: string | null;
  bio?: string | null;
  hiredDate?: string | null;
  userId?: string;
};

type StudentRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  arqId?: string;
  academicLevel?: string | null;
  enrollmentDate?: string;
};

type AccountStatus = {
  active?: boolean;
  verified?: boolean;
};

export default function AdminEducatorDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [profile, setProfile] = useState<{
    educator?: EducatorCore;
    accountStatus?: AccountStatus;
    students?: StudentRow[];
    totalStudents?: number;
  } | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [studentLabel, setStudentLabel] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentReport, setStudentReport] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [historyError, setHistoryError] = useState<any>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEducator(id);
      setProfile(data as typeof profile);
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

  const educator = profile?.educator ?? null;
  const students = Array.isArray(profile?.students) ? profile.students : [];
  const account = profile?.accountStatus;
  const fullName = educator
    ? `${educator.firstName ?? ""} ${educator.lastName ?? ""}`.trim() ||
      "Educator"
    : "Educator";

  const status = educator
    ? educatorStatusOf({
        approvalStatus: educator.approvalStatus,
        accountApproval: educator.accountApproval,
      })
    : "—";

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
    setStudentReport(null);
    setHistoryError(null);
    try {
      const report = (await getAdminStudentReport(studentId).catch((e) => ({
        _error: e instanceof Error ? e.message : String(e),
      }))) as Record<string, unknown>;
      setStudentReport(report);

      await getAdminStudentLearningHistory(studentId).catch((e) => {
        setHistoryError(
          e instanceof Error ? e.message : "Learning history unavailable"
        );
      });
    } finally {
      setStudentLoading(false);
    }
  }

  const summary = studentReport?.assessmentSummary as
    | {
        accuracyPercent?: number;
        totalSubmissions?: number;
        correctSubmissions?: number;
        averageScore?: number;
      }
    | undefined;

  const plans = (studentReport?.learningPlans ?? []) as Array<{
    planId?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    topics?: Array<{
      topicTitle?: string;
      totalSessions?: number;
      completedSessions?: number;
    }>;
  }>;

  return (
    <AdminShell
      title={fullName}
      subtitle="Staff room"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <Link
        href="/admin/educators"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-5"
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
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && educator && (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] max-w-5xl">
          {/* Profile card */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-[var(--line-soft)] flex items-start gap-3">
              <div className="w-12 h-12 rounded-[12px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] font-heading font-semibold text-[15px] flex-none">
                {(educator.firstName?.[0] ?? "?").toUpperCase()}
                {(educator.lastName?.[0] ?? "").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                  {fullName}
                </h2>
                <p className="text-[12px] text-[var(--ink-3)] font-semibold mt-0.5">
                  {[educator.arqId, educator.email].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusChip status={status} />
                  {account && (
                    <>
                      <Pill
                        label={account.active ? "Active" : "Inactive"}
                        ok={Boolean(account.active)}
                      />
                      <Pill
                        label={account.verified ? "Verified" : "Unverified"}
                        ok={Boolean(account.verified)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-2.5 text-[12.5px]">
              <InfoRow label="Email" value={educator.email} />
              <InfoRow label="Arq ID" value={educator.arqId} />
              <InfoRow
                label="Specialization"
                value={educator.specialization}
              />
              <InfoRow label="Hired" value={educator.hiredDate} />
              <InfoRow
                label="Bio"
                value={educator.bio}
              />
            </div>

            <div className="px-5 py-3 border-t border-[var(--line-soft)] flex flex-wrap gap-1.5">
              {status === "pending" && (
                <ActionBtn
                  label="Approve"
                  icon={Check}
                  tone="ok"
                  busy={busy}
                  onClick={() => act("approve")}
                />
              )}
              {(status === "approve" || status === "approved") && (
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
          </section>

          {/* Students */}
          <section className="space-y-4">
            <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--line-soft)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--brand)]" />
                <h2 className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                  Students ({profile?.totalStudents ?? students.length})
                </h2>
              </div>
              {students.length === 0 ? (
                <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-3)]">
                  No students linked yet.
                </p>
              ) : (
                <ul>
                  {students.map((s) => {
                    const sid = String(s.id);
                    const name =
                      `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
                      sid;
                    const selected = studentLabel === name;
                    return (
                      <li
                        key={sid}
                        className="border-b border-[var(--line-soft)] last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => openStudent(sid, name)}
                          className={cn(
                            "w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--surface-2)]",
                            selected && "bg-[var(--brand-soft)]/40"
                          )}
                        >
                          <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--surface-3)] text-[var(--ink-2)] font-heading font-semibold text-[11px] flex-none">
                            {(s.firstName?.[0] ?? "?").toUpperCase()}
                            {(s.lastName?.[0] ?? "").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[13px] text-[var(--ink)]">
                              {name}
                            </div>
                            <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                              {[s.arqId, s.academicLevel, s.enrollmentDate]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--ink-4)]" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Student report panel */}
            {(studentLoading || studentLabel) && (
              <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--line-soft)]">
                  <p className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                    {studentLabel}
                  </p>
                  <p className="text-[11px] text-[var(--ink-3)] font-semibold">
                    Assessment snapshot
                  </p>
                </div>

                {studentLoading ? (
                  <div className="px-5 py-8 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading report…
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    {studentReport?._error && (
                      <p className="text-[12.5px] text-[var(--danger)] font-semibold">
                        {String(studentReport._error)}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <Mini
                        label="Accuracy"
                        value={`${summary?.accuracyPercent ?? 0}%`}
                      />
                      <Mini
                        label="Correct"
                        value={`${summary?.correctSubmissions ?? 0}/${summary?.totalSubmissions ?? 0}`}
                      />
                      <Mini
                        label="Avg score"
                        value={`${summary?.averageScore ?? 0}`}
                      />
                    </div>

                    {plans.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                          Plans
                        </p>
                        {plans.map((plan, i) => (
                          <div
                            key={plan.planId ?? i}
                            className="rounded-[9px] border border-[var(--line)] px-3 py-2.5"
                          >
                            <div className="flex flex-wrap gap-1.5 items-center text-[12px] font-bold text-[var(--ink)]">
                              Plan {plan.planId?.slice(0, 8) ?? i + 1}
                              {plan.paymentStatus && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--ink-3)] capitalize">
                                  {plan.paymentStatus.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <ul className="mt-2 space-y-1">
                              {(plan.topics ?? []).map((t, j) => (
                                <li
                                  key={j}
                                  className="text-[11.5px] text-[var(--ink-3)] flex justify-between gap-2"
                                >
                                  <span className="text-[var(--ink)] font-semibold truncate">
                                    {t.topicTitle}
                                  </span>
                                  <span className="tabular-nums flex-none">
                                    {t.completedSessions ?? 0}/
                                    {t.totalSessions ?? 0}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {historyError && (
                      <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
                        Learning history: {historyError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line-soft)] pb-2">
      <span className="text-[var(--ink-3)] font-semibold">{label}</span>
      <span className="font-bold text-[var(--ink)] text-right max-w-[60%] truncate">
        {value && String(value).trim() ? String(value) : "—"}
      </span>
    </div>
  );
}

function Pill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold",
        ok
          ? "bg-[var(--ok-soft)] text-[var(--ok)]"
          : "bg-[var(--surface-3)] text-[var(--ink-3)]"
      )}
    >
      {label}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
    approve: "bg-[var(--ok-soft)] text-[var(--ok)]",
    approved: "bg-[var(--ok-soft)] text-[var(--ok)]",
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
      {status === "approve" ? "approved" : status}
    </span>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-[var(--line)] px-2.5 py-2 text-center">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-[15px] font-semibold text-[var(--ink)] mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
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