"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";

import  { AdminShell } from "@/components/layout/AdminShell";
import {
  getAdminStudentFullProfile,
  type AdminStudentFullProfile,
} from "@/lib/api";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();

  const studentId = params?.id as string;

  const [data, setData] = useState<AdminStudentFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminStudentFullProfile(studentId);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Unable to load student profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [studentId]);

  if (loading) {
    return (
      <AdminShell
        title="Student Profile"
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
          Loading student profile...
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell
        title="Student Profile"
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
          {error || "Student profile not found."}
        </div>
      </AdminShell>
    );
  }

  const student = data.student;

  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <AdminShell
      title="Student Profile"
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
              onClick={() => router.push("/admin/students")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              style={{
                borderColor: "var(--line)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
              title="Back to students"
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
                Student profile
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

        {/* Student Information */}
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
              Student Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Full name"
              value={fullName}
              icon={<User className="h-4 w-4" />}
            />

            <InfoItem
              label="ARQ ID"
              value={student.arqId}
              icon={<User className="h-4 w-4" />}
            />

            <InfoItem
              label="Email"
              value={student.email}
              icon={<Mail className="h-4 w-4" />}
            />

            <InfoItem
              label="Phone"
              value={student.phone || "Not provided"}
              icon={<Phone className="h-4 w-4" />}
            />

            <InfoItem
              label="Academic level"
              value={student.academicLevel || "Not provided"}
              icon={<GraduationCap className="h-4 w-4" />}
            />

            <InfoItem
              label="Enrollment date"
              value={formatDate(student.enrollmentDate)}
              icon={<BookOpen className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Academic Placement */}
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
            <GraduationCap
              className="h-4 w-4"
              style={{ color: "var(--brand)" }}
            />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Academic Placement
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Programme"
              value={student.programmeTitle || "Not assigned"}
              icon={<BookOpen className="h-4 w-4" />}
            />

            <InfoItem
              label="Programme status"
              value={student.programmeStatus || "Not assigned"}
              icon={<BookOpen className="h-4 w-4" />}
            />

            <InfoItem
              label="Class"
              value={student.className || "Not assigned"}
              icon={<GraduationCap className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Educator */}
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
            <GraduationCap
              className="h-4 w-4"
              style={{ color: "var(--brand)" }}
            />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Educator
            </h2>
          </div>

          <div className="p-5">
            {data.educator ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <InfoItem
                  label="Name"
                  value={`${data.educator.firstName} ${data.educator.lastName}`}
                  icon={<User className="h-4 w-4" />}
                />

                <InfoItem
                  label="Email"
                  value={data.educator.email}
                  icon={<Mail className="h-4 w-4" />}
                />

                <InfoItem
                  label="Educator ID"
                  value={data.educator.id}
                  icon={<User className="h-4 w-4" />}
                />
              </div>
            ) : (
              <EmptyState text="No educator assigned." />
            )}
          </div>
        </section>

        {/* Guardians */}
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
            <Users className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Parent / Guardian Information
            </h2>
          </div>

          <div className="p-5">
            {data.guardians.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: "var(--ink)" }}
                        >
                          {guardian.fullName}
                        </p>

                        <p
                          className="mt-1 text-xs capitalize"
                          style={{ color: "var(--ink-3)" }}
                        >
                          {guardian.relationship || "Guardian"}
                        </p>
                      </div>

                      {guardian.isPrimary && (
                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-medium"
                          style={{
                            background: "var(--surface)",
                            color: "var(--brand)",
                          }}
                        >
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <ContactRow
                        icon={<Phone className="h-3.5 w-3.5" />}
                        value={guardian.phone || "No phone"}
                      />

                      <ContactRow
                        icon={<Mail className="h-3.5 w-3.5" />}
                        value={guardian.email || "No email"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No parent or guardian information available." />
            )}
          </div>
        </section>

        {/* Reports shortcut */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`/admin/students/${student.id}/reports`)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: "var(--brand)",
              color: "white",
            }}
          >
            View Student Reports
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium"
        style={{ color: "var(--ink-3)" }}
      >
        {icon}
        <span>{label}</span>
      </div>

      <p className="text-sm" style={{ color: "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}

function ContactRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      style={{ color: "var(--ink-2)" }}
    >
      {icon}
      <span>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      style={{
        borderColor: "var(--line)",
        color: "var(--ink-3)",
      }}
    >
      {text}
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";

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