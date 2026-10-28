// Save as: app/students/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { requestStudentPasswordReset } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await requestStudentPasswordReset(values.email);
      setSent(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="relative min-h-screen w-full grid place-items-center px-6 py-12 bg-[radial-gradient(1200px_800px_at_20%_20%,#14294F_0%,#0D1B3D_45%,#070F26_100%)]">
      <Link
        href="/students/login"
        className="absolute top-8 left-[clamp(24px,6vw,96px)] flex items-center gap-2 text-[12px] font-medium text-white group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to login
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[392px]">
        <div className="font-heading font-semibold text-white text-[28px] leading-none tracking-[-0.02em]">
          AR<span className="text-[#12BFB4]">qademy</span>
        </div>

        <h2 className="mt-8 font-heading font-semibold text-[23px] text-white">
          Forgot your password?
        </h2>
        <p className="text-[13px] text-white/45 mt-1.5">
          Enter the email you sign in with and we&apos;ll send you a link to
          choose a new password.
        </p>

        <div className="mt-[22px]">
          <label className="block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full h-12 px-[15px] text-[14px] !text-white rounded-[10px] bg-white/[0.045] border placeholder:text-white/25 focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(18,191,180,0.14)] transition-[border-color,background,box-shadow] duration-150 ${
              errors.email ? "border-red-400/60" : "border-white/[0.11]"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-[11.5px] text-red-300/90">
              {errors.email.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="mt-4 px-3.5 py-2.5 rounded-[9px] bg-red-500/15 border border-red-400/25 text-[12.5px] text-red-200 font-semibold">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[50px] mt-7 rounded-[10px] font-heading font-semibold text-[14px] !bg-[#0E9B94] !text-[#03211F] flex items-center justify-center gap-2 hover:!bg-[#12BFB4] active:translate-y-px transition-colors disabled:opacity-70 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-[17px] h-[17px] animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="w-[17px] h-[17px]" />
            </>
          )}
        </button>
      </form>

      {/* Confirmation popup */}
      {sent && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-[400px] rounded-[16px] border border-white/10 bg-[#0D1B3D] p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#12BFB4]/15 text-[#12BFB4]">
              <MailCheck className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-[19px] font-semibold text-white">
              Check your email
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              If this email is on our system, we&apos;ve sent a password reset
              link to it. The link works for 30 minutes. Remember to check your
              spam folder.
            </p>
            <Link
              href="/students/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#0E9B94] text-[14px] font-semibold text-[#03211F] hover:bg-[#12BFB4]"
            >
              Back to login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}