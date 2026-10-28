// Save as: components/students/ChangePasswordCard.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import {
  ApiError,
  confirmStudentPasswordOtp,
  sendStudentPasswordOtp,
} from "@/lib/api";

const inputCls =
  "w-full h-11 px-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]";

export function ChangePasswordCard() {
  const [step, setStep] = useState<"idle" | "code" | "done">("idle");
  const [sentTo, setSentTo] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const msg = (err: unknown) =>
    err instanceof ApiError ? err.message : "Something went wrong. Please try again.";

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const r = await sendStudentPasswordOtp();
      setSentTo(r.sentTo);
      setStep("code");
      setCooldown(60);
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm_() {
    setError(null);
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code from your email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      await confirmStudentPasswordOtp(otp, password);
      setStep("done");
      setOtp("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[var(--brand)]" />
        <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)]">
          Change password
        </h2>
      </div>

      {step === "idle" && (
        <>
          <p className="mt-2 text-[12.5px] text-[var(--ink-3)]">
            We&apos;ll email a 6-digit code to your account email to confirm
            it&apos;s you.
          </p>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-4 text-[13px] font-bold text-white hover:bg-[var(--brand-ink)] disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Send code to my email
          </button>
        </>
      )}

      {step === "code" && (
        <div className="mt-3 space-y-3">
          <p className="text-[12.5px] text-[var(--ink-3)]">
            We sent a code to <b className="text-[var(--ink)]">{sentTo}</b>. It
            expires in 10 minutes.
          </p>
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className={`${inputCls} tracking-[0.4em] text-center font-bold`}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={confirm_}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-4 text-[13px] font-bold text-white hover:bg-[var(--brand-ink)] disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={busy || cooldown > 0}
              className="text-[12px] font-bold text-[var(--brand)] disabled:text-[var(--ink-4)]"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--ok)]">
          <CheckCircle2 className="w-4 h-4" />
          Password updated.
        </div>
      )}

      {error && (
        <p className="mt-3 text-[12px] font-semibold text-[var(--danger)]">{error}</p>
      )}
    </section>
  );
}