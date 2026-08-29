"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  enrollStudent,
  getEducatorMe,
  educatorLogout,
  listAllClasses,
  ApiError,
  type CurriculumClass,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PASSWORD = "225466";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  classId: z.string().min(1, "Select a class"),
  academicLevel: z.string().optional(),
  password: z
    .string()
    .min(6, "At least 6 characters")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type EnrollResult = {
  message?: string;
  student?: { id: string };
  credentials?: {
    email?: string;
    arqId?: string;
    temporaryPassword?: string | null;
  };
};

export default function EnrollStudentPage() {
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();
  const [classes, setClasses] = useState<CurriculumClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [result, setResult] = useState<EnrollResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      classId: "",
      academicLevel: "",
      password: DEFAULT_PASSWORD,
    },
  });

  const selectedClassId = watch("classId");

  // Load educator + classes
  useEffect(() => {
    getEducatorMe()
      .then((me) => {
        setName(`${me.firstName} ${me.lastName}`.trim());
        setArqId(me.arqId);
      })
      .catch(() => null);

    listAllClasses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Prefer active classes; fall back to all
        const active = list.filter((c) => c.isActive !== false);
        setClasses(active.length > 0 ? active : list);
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  // When class changes → academicLevel = class title
  useEffect(() => {
    if (!selectedClassId) {
      setValue("academicLevel", "");
      return;
    }
    const cls = classes.find((c) => c.id === selectedClassId);
    if (cls?.title) {
      setValue("academicLevel", cls.title, { shouldValidate: true });
    }
  }, [selectedClassId, classes, setValue]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setResult(null);
    try {
      const res = (await enrollStudent({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        classId: values.classId,
        academicLevel:
          values.academicLevel?.trim() ||
          classes.find((c) => c.id === values.classId)?.title ||
          undefined,
        password: values.password?.trim() || undefined,
      })) as EnrollResult;
      setResult(res);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Enroll failed"
      );
    }
  }

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  function copyCreds() {
    const c = result?.credentials;
    if (!c) return;
    const text = [
      `Email: ${c.email ?? ""}`,
      `Arq ID: ${c.arqId ?? ""}`,
      c.temporaryPassword
        ? `Temporary password: ${c.temporaryPassword}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const studentId = result?.student?.id;

  return (
    <EducatorShell
      title="Enroll student"
      subtitle="Classroom"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <Link
        href="/educators/students"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        All students
      </Link>

      {!result ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-md space-y-4 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              <input className={inputClass} {...register("firstName")} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input className={inputClass} {...register("lastName")} />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </Field>

          {/* Class dropdown → drives academicLevel */}
          <Field label="Class" error={errors.classId?.message}>
            <select
              className={inputClass}
              disabled={classesLoading}
              {...register("classId")}
            >
              <option value="">
                {classesLoading ? "Loading classes…" : "Select a class"}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.term ? ` · ${c.term}` : ""}
                </option>
              ))}
            </select>
          </Field>

          {/* Auto-filled from class name; still visible/editable if needed */}
          <Field label="Academic level">
            <input
              className={cn(inputClass, "bg-[var(--surface-3)]")}
              placeholder="Filled from class"
              readOnly
              {...register("academicLevel")}
            />
            <p className="mt-1 text-[11px] text-[var(--ink-4)] font-semibold">
              Set automatically from the selected class name.
            </p>
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              type="text"
              className={inputClass}
              placeholder={DEFAULT_PASSWORD}
              {...register("password")}
            />
            <p className="mt-1 text-[11px] text-[var(--ink-4)] font-semibold">
              Default is {DEFAULT_PASSWORD}. Change if you want a different
              password, or clear to let the server auto-generate.
            </p>
          </Field>

          {serverError && (
            <p className="text-[12.5px] font-semibold text-[var(--danger)]">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || classesLoading}
            className="w-full h-11 rounded-[10px] text-[13px] font-heading font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enrolling…
              </>
            ) : (
              "Enroll student"
            )}
          </button>
        </form>
      ) : (
        <div className="max-w-md rounded-[var(--r-card)] border border-[var(--ok)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] space-y-4">
          <p className="text-[13px] font-bold text-[var(--ok)]">
            {result.message || "Student enrolled"}
          </p>
          {result.credentials && (
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] p-4 text-[13px] space-y-1.5">
              <div>
                <span className="text-[var(--ink-3)]">Email · </span>
                <b>{result.credentials.email}</b>
              </div>
              <div>
                <span className="text-[var(--ink-3)]">Arq ID · </span>
                <b>{result.credentials.arqId}</b>
              </div>
              {result.credentials.temporaryPassword && (
                <div>
                  <span className="text-[var(--ink-3)]">Temp password · </span>
                  <b>{result.credentials.temporaryPassword}</b>
                </div>
              )}
              <button
                type="button"
                onClick={copyCreds}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)]"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy credentials"}
              </button>
            </div>
          )}
          <p className="text-[12.5px] text-[var(--ink-3)]">
            Student can log in. Assign a learning plan next so they can start
            sessions.
          </p>
          <div className="flex flex-wrap gap-2">
            {studentId && (
              <Link
                href={`/educators/students/${studentId}/learning-plan`}
                className="inline-flex h-10 px-4 items-center rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white"
              >
                Assign learning plan →
              </Link>
            )}
            <Link
              href="/educators/students"
              className="inline-flex h-10 px-4 items-center rounded-[9px] text-[12.5px] font-bold border border-[var(--line)]"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}
    </EducatorShell>
  );
}

const inputClass = cn(
  "w-full h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)]",
  "text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11.5px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}