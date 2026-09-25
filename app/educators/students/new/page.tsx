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
  listPublishedProgrammes,
  ApiError,
  type PublishedProgramme,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PASSWORD = "225466";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  programId: z.string().min(1, "Select a programme"),
  phone: z.string().optional(),
  academicLevel: z.string().optional(),
  password: z
    .string()
    .min(6, "At least 6 characters")
    .optional()
    .or(z.literal("")),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  guardianRel: z.string().optional(),
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
  const [programmes, setProgrammes] = useState<PublishedProgramme[]>([]);
  const [programmesLoading, setProgrammesLoading] = useState(true);
  const [result, setResult] = useState<EnrollResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      programId: "",
      phone: "",
      academicLevel: "",
      password: DEFAULT_PASSWORD,
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianRel: "",
    },
  });

  useEffect(() => {
    getEducatorMe()
      .then((me) => {
        setName(`${me.firstName} ${me.lastName}`.trim());
        setArqId(me.arqId);
      })
      .catch(() => null);

    listPublishedProgrammes()
      .then((data) => setProgrammes(Array.isArray(data) ? data : []))
      .catch(() => setProgrammes([]))
      .finally(() => setProgrammesLoading(false));
  }, []);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setResult(null);
    try {
      const res = (await enrollStudent({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        programId: values.programId,
        phone: values.phone?.trim() || undefined,
        academicLevel: values.academicLevel?.trim() || undefined,
        password: values.password?.trim() || undefined,
        guardian: values.guardianName?.trim()
          ? {
              fullName: values.guardianName.trim(),
              phone: values.guardianPhone?.trim() || undefined,
              email: values.guardianEmail?.trim() || undefined,
              relationship: values.guardianRel?.trim() || undefined,
            }
          : undefined,
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
      c.temporaryPassword ? `Temporary password: ${c.temporaryPassword}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

          <Field label="Phone">
            <input className={inputClass} {...register("phone")} />
          </Field>

          {/* Programme — same idea as admin */}
          <Field label="Programme" error={errors.programId?.message}>
            <select
              className={inputClass}
              disabled={programmesLoading}
              {...register("programId")}
            >
              <option value="">
                {programmesLoading
                  ? "Loading programmes…"
                  : "Select a programme"}
              </option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.topicCount != null ? ` · ${p.topicCount} topics` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--ink-4)] font-semibold">
              Only published programmes. Admin sets the learning plan later.
            </p>
          </Field>

          <Field label="Academic level">
            <input
              className={inputClass}
              placeholder="e.g. SS3 (optional)"
              {...register("academicLevel")}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              type="text"
              className={inputClass}
              placeholder={DEFAULT_PASSWORD}
              {...register("password")}
            />
            <p className="mt-1 text-[11px] text-[var(--ink-4)] font-semibold">
              Default is {DEFAULT_PASSWORD}. Clear to let the server
              auto-generate.
            </p>
          </Field>

          <div className="border-t border-[var(--line)] pt-3 space-y-3">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)]">
              Parent / Guardian (optional)
            </p>
            <Field label="Full name">
              <input className={inputClass} {...register("guardianName")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input className={inputClass} {...register("guardianPhone")} />
              </Field>
              <Field label="Email">
                <input className={inputClass} {...register("guardianEmail")} />
              </Field>
            </div>
            <Field label="Relationship">
              <input
                className={inputClass}
                placeholder="mother, father…"
                {...register("guardianRel")}
              />
            </Field>
          </div>

          {serverError && (
            <p className="text-[12.5px] font-semibold text-[var(--danger)]">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || programmesLoading}
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
            Student is linked to you and the programme. An admin will set their
            learning plan; you earn commission when payment succeeds.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex h-10 px-4 items-center rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white"
            >
              Enroll another
            </button>
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