"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { educatorRegister, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function EducatorRegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccess(null);
    try {
      const res = await educatorRegister(values);
      setSuccess(
        res.message ||
          `Registered. Your Arq ID is ${res.arqId}. An admin must approve you before you can teach.`
      );
      setTimeout(() => router.push("/educators/login"), 2200);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message || "Registration failed");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <GateShell
      title="Teach with ARQADEMY"
      subtitle="Educator registration"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[392px] mx-auto lg:mx-0">
        <h2 className="font-heading font-semibold text-[23px] text-white">
          Create educator account
        </h2>
        <p className="text-[13px] text-white/45 mt-1.5">
          You’ll stay pending until an admin approves you.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-[22px]">
          <Field label="First name" error={errors.firstName?.message}>
            <input
              className={inputClass(!!errors.firstName)}
              {...register("firstName")}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input
              className={inputClass(!!errors.lastName)}
              {...register("lastName")}
            />
          </Field>
        </div>

        <Field label="Email" error={errors.email?.message} className="mt-[18px]">
          <input
            type="email"
            autoComplete="email"
            className={inputClass(!!errors.email)}
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          className="mt-[18px]"
        >
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(!!errors.password)}
            {...register("password")}
          />
        </Field>

        {serverError && (
          <div className="mt-4 px-3.5 py-2.5 rounded-[9px] bg-red-500/15 border border-red-400/25 text-[12.5px] text-red-200 font-semibold">
            {serverError}
          </div>
        )}
        {success && (
          <div className="mt-4 px-3.5 py-2.5 rounded-[9px] bg-emerald-500/15 border border-emerald-400/25 text-[12.5px] text-emerald-100 font-semibold">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full h-[50px] mt-7 rounded-[10px] font-heading font-semibold text-[14px]",
            "bg-[#0E9B94] text-[#03211F] flex items-center justify-center gap-2",
            "hover:bg-[#12BFB4] disabled:opacity-70"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              Register
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="mt-5 text-[12.5px] text-white/40">
          Already registered?{" "}
          <Link href="/educators/login" className="text-[#12BFB4] font-bold">
            Sign in
          </Link>
        </p>
      </form>
    </GateShell>
  );
}

/* shared gate chrome for educator auth pages */

function GateShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] bg-[radial-gradient(1200px_800px_at_20%_20%,#14294F_0%,#0D1B3D_45%,#070F26_100%)]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right,#05A9A9 1px,transparent 1px),linear-gradient(to bottom,#05A9A9 1px,transparent 1px)",
          backgroundSize: "42px 42px",
          opacity: 0.05,
        }}
      />
      <div className="relative hidden lg:flex flex-col justify-center px-[clamp(40px,7vw,110px)]">
        <div className="font-heading font-semibold text-white text-[clamp(38px,4.6vw,62px)] leading-none">
          AR<span className="text-[#12BFB4]">Q</span>
          <span className="text-[#12BFB4]">academy</span>
        </div>
        <p className="mt-5 text-[11px] font-bold tracking-[0.34em] uppercase text-[#12BFB4]">
          Powering Next Minds
        </p>
        <h2 className="mt-14 font-heading font-medium text-[#EAF1FA] text-[clamp(22px,2.3vw,31px)] leading-[1.25]">
          {title}
        </h2>
        <p className="mt-3.5 text-[12px] font-bold tracking-[0.26em] uppercase text-white/40">
          {subtitle}
        </p>
        <div className="w-[52px] h-0.5 bg-[#12BFB4] rounded-sm mt-8" />
      </div>
      <div className="relative flex flex-col justify-center px-[clamp(24px,6vw,96px)] lg:border-l lg:border-white/[0.06]">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[11.5px] text-red-300/90">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full h-12 px-[15px] text-[14px] text-white rounded-[10px]",
    "bg-white/[0.045] border border-white/[0.11] placeholder:text-white/25",
    "focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(18,191,180,0.14)]",
    hasError && "border-red-400/60"
  );
}