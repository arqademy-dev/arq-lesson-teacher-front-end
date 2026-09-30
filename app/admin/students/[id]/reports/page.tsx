"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  User,
  Wallet,
  XCircle,
} from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import {
  getAdminStudentFiles,
  getAdminStudentFullProfile,
  type AdminStudentFile,
  type AdminStudentFullProfile,
  type AdminStudentLearningPlan,
  type AdminStudentPayment,
} from "@/lib/api";

export default function StudentReportsPage() {
  const params = useParams();
  const router = useRouter();

  const studentId = params?.id as string;

  const [data, setData] = useState<AdminStudentFullProfile | null>(null);
  const [files, setFiles] = useState<AdminStudentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const [profile, studentFiles] = await Promise.all([
          getAdminStudentFullProfile(studentId),
          getAdminStudentFiles(studentId),
        ]);

        setData(profile);
        setFiles(studentFiles);
      } catch (err) {
        console.error(err);
        setError("Unable to load student reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [studentId]);

  const paymentSummary = useMemo(() => {
    if (!data) {
      return {
        total: 0,
        successful: 0,
        pending: 0,
        failed: 0,
      };
    }

    return {
      total: data.payments.reduce(
        (sum, payment) => sum + payment.amountNaira,
        0
      ),
      successful: data.payments.filter(
        (payment) => payment.status === "success"
      ).length,
      pending: data.payments.filter(
        (payment) => payment.status === "pending"
      ).length,
      failed: data.payments.filter(
        (payment) =>
          payment.status === "failed" || payment.status === "refunded"
      ).length,
    };
  }, [data]);

  if (loading) {
    return (
      <AdminShell
        title="Student Reports"
        subtitle="Students"
        onLogout={() => {
          window.location.href = "/admin/login";
        }}
      >
        <div
          className="flex min-h-[300px] items-center justify-center"
          style={{ color: "var(--ink-3)" }}
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading student reports...
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell
        title="Student Reports"
        subtitle="Students"
        onLogout={() => {
          window.location.href = "/admin/login";
        }}
      >
        <div
          className="rounded-[var(--r-card)] border p-6 text-center"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            color: "var(--ink-3)",
          }}
        >
          {error || "Student report not found."}
        </div>
      </AdminShell>
    );
  }

  const student = data.student;
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  const assessmentStats = data.assessments.stats;

  return (
    <AdminShell
      title="Student Reports"
      subtitle="Students"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/students/${student.id}/profile`)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              style={{
                borderColor: "var(--line)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              title="Back to profile"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {fullName}
              </h1>

              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--ink-3)" }}
              >
                Learning, payment and activity reports
              </p>
            </div>
          </div>

          <div
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink-2)",
            }}
          >
            {student.arqId}
          </div>
        </div>

        {/* Student Overview */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex items-center gap-2 border-b px-5 py-4"
            style={{ borderColor: "var(--line)" }}
          >
            <User className="h-4 w-4" style={{ color: "var(--brand)" }} />

            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Student Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <ReportInfo
              label="Student"
              value={fullName}
            />

            <ReportInfo
              label="Email"
              value={student.email}
            />

            <ReportInfo
              label="Programme"
              value={student.programmeTitle || "Not assigned"}
            />

            <ReportInfo
              label="Class"
              value={student.className || "Not assigned"}
            />
          </div>
        </section>

        {/* Learning Plans */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SectionHeader
            icon={<BookOpen className="h-4 w-4" />}
            title="Learning Plans"
            count={data.learningPlans.length}
          />

          <div className="p-5">
            {data.learningPlans.length > 0 ? (
              <div className="space-y-4">
                {data.learningPlans.map((plan) => (
                  <LearningPlanCard
                    key={plan.planId}
                    plan={plan}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="No learning plans found." />
            )}
          </div>
        </section>

        {/* Payments */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SectionHeader
            icon={<Wallet className="h-4 w-4" />}
            title="Payments"
            count={data.payments.length}
          />

          <div className="p-5">
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard
                label="Total value"
                value={formatNaira(paymentSummary.total)}
              />

              <SummaryCard
                label="Successful"
                value={String(paymentSummary.successful)}
              />

              <SummaryCard
                label="Pending"
                value={String(paymentSummary.pending)}
              />

              <SummaryCard
                label="Failed / refunded"
                value={String(paymentSummary.failed)}
              />
            </div>

            {data.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Created</TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {data.payments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No payment records found." />
            )}
          </div>
        </section>

        {/* Assessment Statistics */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SectionHeader
            icon={<GraduationCap className="h-4 w-4" />}
            title="Assessment Summary"
          />

          <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
            <SummaryCard
              label="Submissions"
              value={String(assessmentStats.totalSubmissions)}
            />

            <SummaryCard
              label="Correct"
              value={String(assessmentStats.correctSubmissions)}
            />

            <SummaryCard
              label="Accuracy"
              value={`${assessmentStats.accuracyPercent}%`}
            />

            <SummaryCard
              label="Average score"
              value={String(assessmentStats.averageScore)}
            />
          </div>
        </section>

        {/* Assessment Activity */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SectionHeader
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Assessment Activity"
            count={data.assessments.activity.length}
          />

          <div className="p-5">
            {data.assessments.activity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <TableHead>Topic</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Interaction</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {data.assessments.activity.map((activity) => (
                      <AssessmentRow
                        key={activity.id}
                        activity={activity}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No assessment activity found." />
            )}
          </div>
        </section>

        {/* Files */}
        <section
          className="rounded-[var(--r-card)] border"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SectionHeader
            icon={<FileText className="h-4 w-4" />}
            title="Submitted Files"
            count={files.length}
          />

          <div className="p-5">
            {files.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      {/* <TableHead /> */}
                    </tr>
                  </thead>

                  <tbody>
                    {files.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No submitted files found." />
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}


/* =========================================================
   LEARNING PLAN
========================================================= */

function LearningPlanCard({
  plan,
}: {
  plan: AdminStudentLearningPlan;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalSessions = plan.topics.reduce(
    (total, topic) => total + topic.done.length + topic.todo.length,
    0
  );

  const completedSessions = plan.topics.reduce(
    (total, topic) => total + topic.done.length,
    0
  );

  const progress =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  return (
    <div
      className="rounded-lg border"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface-2)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-1 text-[11px] font-medium capitalize"
              style={{
                background: "var(--surface)",
                color: "var(--brand)",
              }}
            >
              {plan.status}
            </span>

            <span
              className="text-xs"
              style={{ color: "var(--ink-3)" }}
            >
              {plan.topics.length} topic
              {plan.topics.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-xs">
            <span style={{ color: "var(--ink-2)" }}>
              Start: {formatDate(plan.startDate)}
            </span>

            <span style={{ color: "var(--ink-2)" }}>
              End: {formatDate(plan.endDate)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p
              className="text-xs font-medium"
              style={{ color: "var(--ink)" }}
            >
              {completedSessions}/{totalSessions}
            </p>

            <p
              className="text-[11px]"
              style={{ color: "var(--ink-3)" }}
            >
              sessions
            </p>
          </div>

          {expanded ? (
            <ChevronUp
              className="h-4 w-4"
              style={{ color: "var(--ink-3)" }}
            />
          ) : (
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--ink-3)" }}
            />
          )}
        </div>
      </button>

      <div className="px-4 pb-4">
        <div
          className="h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--surface)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "var(--brand)",
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span style={{ color: "var(--ink-3)" }}>
            Progress
          </span>

          <span style={{ color: "var(--ink-2)" }}>
            {progress}%
          </span>
        </div>
      </div>

      {expanded && (
        <div
          className="border-t px-4 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--ink)" }}
            >
              Topics
            </span>

            <span
              className="text-[11px]"
              style={{ color: "var(--ink-3)" }}
            >
              {plan.requireCorrectAnswersToProgress
                ? "Correct answers required"
                : "Correct answers not required"}
            </span>
          </div>

          <div className="space-y-2">
            {plan.topics.map((topic) => {
              const topicTotal =
                topic.done.length + topic.todo.length;

              const topicProgress =
                topicTotal > 0
                  ? Math.round(
                      (topic.done.length / topicTotal) * 100
                    )
                  : 0;

              return (
                <div
                  key={topic.topicId}
                  className="rounded-md border p-3"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--surface)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        {topic.topicTitle || "Untitled topic"}
                      </p>

                      <p
                        className="mt-1 text-[11px] capitalize"
                        style={{ color: "var(--ink-3)" }}
                      >
                        {topic.status}
                      </p>
                    </div>

                    <span
                      className="shrink-0 text-xs"
                      style={{ color: "var(--ink-2)" }}
                    >
                      {topic.done.length}/{topicTotal}
                    </span>
                  </div>

                  <div
                    className="mt-2 h-1 overflow-hidden rounded-full"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${topicProgress}%`,
                        background: "var(--brand)",
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <SessionList
                      title="Completed"
                      sessions={topic.done}
                      completed
                    />

                    <SessionList
                      title="Pending"
                      sessions={topic.todo}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionList({
  title,
  sessions,
  completed = false,
}: {
  title: string;
  sessions: AdminStudentLearningPlan["topics"][number]["done"];
  completed?: boolean;
}) {
  return (
    <div
      className="rounded-md border p-3"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface-2)",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        {completed ? (
          <CheckCircle2
            className="h-3.5 w-3.5"
            style={{ color: "var(--brand)" }}
          />
        ) : (
          <Clock3
            className="h-3.5 w-3.5"
            style={{ color: "var(--ink-3)" }}
          />
        )}

        <span
          className="text-xs font-medium"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </span>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-1.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span style={{ color: "var(--ink-2)" }}>
                Day {session.sessionDayNumber}
              </span>

              <span style={{ color: "var(--ink-3)" }}>
                {formatDate(session.scheduledDate)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p
          className="text-[11px]"
          style={{ color: "var(--ink-3)" }}
        >
          None
        </p>
      )}
    </div>
  );
}


/* =========================================================
   PAYMENTS
========================================================= */

function PaymentRow({
  payment,
}: {
  payment: AdminStudentPayment;
}) {
  return (
    <tr
      className="border-b last:border-0"
      style={{ borderColor: "var(--line)" }}
    >
      <td className="px-2 py-3">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--ink)" }}
        >
          {formatNaira(payment.amountNaira)}
        </span>
      </td>

      <td className="px-2 py-3">
        <StatusBadge status={payment.status} />
      </td>

      <td
        className="px-2 py-3 text-sm"
        style={{ color: "var(--ink-2)" }}
      >
        {payment.provider || "—"}
      </td>

      <td
        className="max-w-[220px] truncate px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {payment.providerReference || payment.gafiaAccountNumber || "—"}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-2)" }}
      >
        {formatDateTime(payment.paidAt)}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {formatDateTime(payment.createdAt)}
      </td>
    </tr>
  );
}


/* =========================================================
   ASSESSMENTS
========================================================= */

function AssessmentRow({
  activity,
}: {
  activity: AdminStudentFullProfile["assessments"]["activity"][number];
}) {
  return (
    <tr
      className="border-b last:border-0"
      style={{ borderColor: "var(--line)" }}
    >
      <td
        className="max-w-[180px] truncate px-2 py-3 text-sm"
        style={{ color: "var(--ink)" }}
      >
        {activity.topicTitle || "—"}
      </td>

      <td
        className="max-w-[180px] truncate px-2 py-3 text-sm"
        style={{ color: "var(--ink-2)" }}
      >
        {activity.resourceTitle || "—"}
      </td>

      <td
        className="px-2 py-3 text-xs capitalize"
        style={{ color: "var(--ink-2)" }}
      >
        {activity.interactionType
          ? activity.interactionType.replaceAll("_", " ")
          : "—"}
      </td>

      <td className="px-2 py-3">
        {activity.isCorrect ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--brand)" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Correct
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--ink-3)" }}
          >
            <XCircle className="h-3.5 w-3.5" />
            Incorrect
          </span>
        )}
      </td>

      <td
        className="px-2 py-3 text-sm"
        style={{ color: "var(--ink-2)" }}
      >
        {activity.scoreAwarded}
      </td>

      <td
        className="px-2 py-3 text-sm"
        style={{ color: "var(--ink-2)" }}
      >
        {activity.attemptNumber}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {formatDuration(activity.timeSpentSeconds)}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {formatDateTime(activity.submittedAt)}
      </td>
    </tr>
  );
}


/* =========================================================
   FILES
========================================================= */

function FileRow({
  file,
}: {
  file: AdminStudentFile;
}) {
  return (
    <tr
      className="border-b last:border-0"
      style={{ borderColor: "var(--line)" }}
    >
      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <FileText
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--brand)" }}
          />

          <span
            className="max-w-[300px] truncate text-sm"
            style={{ color: "var(--ink)" }}
          >
            {file.fileName}
          </span>
        </div>
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-2)" }}
      >
        {file.contentType || "—"}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {formatBytes(file.sizeBytes)}
      </td>

      <td
        className="px-2 py-3 text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {formatDateTime(file.createdAt)}
      </td>

      <td className="px-2 py-3 text-right">
        {file.fileUrl ? (
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--brand)" }}
          >
            Open
          </a>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}


/* =========================================================
   UI HELPERS
========================================================= */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-5 py-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--brand)" }}>{icon}</span>

        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </h2>
      </div>

      {count !== undefined && (
        <span
          className="rounded-full px-2 py-1 text-[11px]"
          style={{
            background: "var(--surface-2)",
            color: "var(--ink-3)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function ReportInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        className="mb-1 text-xs font-medium"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </p>

      <p className="text-sm" style={{ color: "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface-2)",
      }}
    >
      <p
        className="text-xs"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </p>
    </div>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      className="px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: "var(--ink-3)" }}
    >
      {children}
    </th>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="inline-flex rounded-full px-2 py-1 text-[11px] font-medium capitalize"
      style={{
        background: "var(--surface-2)",
        color: status === "success"
          ? "var(--brand)"
          : "var(--ink-2)",
      }}
    >
      {status}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="rounded-lg border border-dashed px-4 py-7 text-center text-sm"
      style={{
        borderColor: "var(--line)",
        color: "var(--ink-3)",
      }}
    >
      {text}
    </div>
  );
}


/* =========================================================
   FORMATTERS
========================================================= */

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

function formatBytes(bytes: number | null) {
  if (bytes === null || bytes === undefined) {
    return "—";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index] || "GB"}`;
}