// Save as: app/students/reset-password/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";
import {
  ApiError,
  resetStudentPassword,
  verifyStudentResetToken,
} from "@/lib/api";

const inputCls =
  "w-full h-12 px-[15px] text-[14px] !text-white rounded-[10px] bg-white/[0.045] border border-white/[0.11] placeholder:text-white/25 focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(18,191,180,0.14)] transition-[border-color,background,box-shadow] duration-150";
const labelCls =
  "block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2";

function ResetPasswordInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [status, setStatus] = useState<"checking" | "invalid" | "ready" | "done">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    verifyStudentResetToken(token)
      .then((r) => {
        setEmail(r.email);
        setStatus("ready");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  useEffect(() => {
    if (status !== "done") return;
    const t = setTimeout(() => router.replace("/students/login"), 2500);
    return () => clearTimeout(t);
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await resetStudentPassword(token, password);
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full grid place-items-center px-6 py-12 bg-[radial-gradient(1200px_800px_at_20%_20%,#14294F_0%,#0D1B3D_45%,#070F26_100%)]">
      <div className="w-full max-w-[392px]">
        <div className="font-heading font-semibold text-white text-[28px] leading-none tracking-[-0.02em]">
          AR<span className="text-[#12BFB4]">qademy</span>
        </div>

        {status === "checking" && (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your link…
          </div>
        )}

        {status === "invalid" && (
          <div className="mt-8">
            <XCircle className="h-10 w-10 text-red-300" />
            <h2 className="mt-3 font-heading font-semibold text-[21px] text-white">
              Link expired or invalid
            </h2>
            <p className="mt-1.5 text-[13px] text-white/50">
              Reset links work for 30 minutes and only once. Request a new one
              to continue.
            </p>
            <Link
              href="/students/forgot-password"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#0E9B94] text-[14px] font-semibold text-[#03211F] hover:bg-[#12BFB4]"
            >
              Request a new link
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={onSubmit} className="mt-8">
            <h2 className="font-heading font-semibold text-[23px] text-white">
              Choose a new password
            </h2>
            <p className="text-[13px] text-white/45 mt-1.5">
              Resetting the password for this account.
            </p>

            <div className="mt-[22px]">
              <label className={labelCls}>Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className={`${inputCls} !text-white/60 cursor-not-allowed pr-10`}
                />
                <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            <div className="mt-[22px]">
              <label className={labelCls}>New password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="mt-[22px]">
              <label className={labelCls}>Confirm password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <div className="mt-4 px-3.5 py-2.5 rounded-[9px] bg-red-500/15 border border-red-400/25 text-[12.5px] text-red-200 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[50px] mt-7 rounded-[10px] font-heading font-semibold text-[14px] !bg-[#0E9B94] !text-[#03211F] flex items-center justify-center gap-2 hover:!bg-[#12BFB4] active:translate-y-px transition-colors disabled:opacity-70 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-[17px] h-[17px] animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Update password <ArrowRight className="w-[17px] h-[17px]" />
                </>
              )}
            </button>
          </form>
        )}

        {status === "done" && (
          <div className="mt-8">
            <CheckCircle2 className="h-10 w-10 text-[#12BFB4]" />
            <h2 className="mt-3 font-heading font-semibold text-[21px] text-white">
              Password updated
            </h2>
            <p className="mt-1.5 text-[13px] text-white/50">
              Taking you to the login page…
            </p>
            <Link
              href="/students/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#0E9B94] text-[14px] font-semibold text-[#03211F] hover:bg-[#12BFB4]"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}