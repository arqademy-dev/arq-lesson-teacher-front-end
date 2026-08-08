"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { studentLogin, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function StudentLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await studentLogin(values);
      router.replace("/students");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message || "Invalid email or password");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    // FIX 1: Swapped fixed viewports with a dynamic scroll container to safeguard layout integrity
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] bg-[radial-gradient(1200px_800px_at_20%_20%,#14294F_0%,#0D1B3D_45%,#070F26_100%)] overflow-y-auto">
      {/* Grid motif */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right,#05A9A9 1px,transparent 1px),linear-gradient(to bottom,#05A9A9 1px,transparent 1px)",
          backgroundSize: "42px 42px",
          opacity: 0.05,
          WebkitMaskImage:
            "radial-gradient(90% 80% at 30% 40%, #000, transparent 78%)",
          maskImage:
            "radial-gradient(90% 80% at 30% 40%, #000, transparent 78%)",
        }}
      />

      {/* Decorative arcs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { d: 520, t: "-14%", l: "58%" },
          { d: 760, t: "-30%", l: "44%" },
          { d: 1040, t: "-48%", l: "30%" },
        ].map((a, i) => (
          <i
            key={i}
            className="absolute rounded-full border border-[rgba(47,211,201,0.10)]"
            style={{ width: a.d, height: a.d, top: a.t, left: a.l }}
          />
        ))}
      </div>

      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-center px-[clamp(40px,7vw,110px)] py-12">
        <div className="font-heading font-semibold text-white text-[clamp(38px,4.6vw,62px)] leading-none tracking-[-0.02em] flex items-center">
          <span>AR</span>
          <span className="text-[#12BFB4] mx-[-0.005em]">Q</span>
          <span className="text-[#12BFB4]">academy</span>
        </div>
        <p className="mt-5 text-[11px] font-bold tracking-[0.34em] uppercase text-[#12BFB4]">
          Powering Next Minds
        </p>
        <h2 className="mt-14 font-heading font-medium text-[#EAF1FA] text-[clamp(22px,2.3vw,31px)] leading-[1.25] tracking-[-0.01em]">
          Pick up today&apos;s lesson.
          <br />
          One session at a time.
        </h2>
        <p className="mt-3.5 text-[12px] font-bold tracking-[0.26em] uppercase text-white/40">
          Student portal
        </p>
        <div className="w-[52px] h-0.5 bg-[#12BFB4] rounded-sm mt-8" />
      </div>

      {/* Right form panel */}
      {/* FIX 2: Added py-12 and pb-24 to accommodate the bottom fixed copyright layout safely without collision */}
      <div className="relative flex flex-col justify-center px-[clamp(24px,6vw,96px)] py-12 pb-24 lg:border-l lg:border-white/[0.06]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[392px] mx-auto lg:mx-0"
        >
          <h2 className="font-heading font-semibold text-[23px] text-white">
            Student login
          </h2>
          <p className="text-[13px] text-white/45 mt-1.5">
            Use the email and password your teacher gave you.
          </p>

          <div className="mt-[22px]">
            <label className="block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`w-full h-12 px-[15px] text-[14px] text-white !text-white rounded-[10px] bg-white/[0.045] border placeholder:text-white/25 focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(18,191,180,0.14)] transition-[border-color,background,box-shadow] duration-150 ${
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

          <div className="mt-[22px]">
            <label className="block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full h-12 px-[15px] text-[14px] text-white !text-white rounded-[10px] bg-white/[0.045] border placeholder:text-white/25 focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(18,191,180,0.14)] transition-[border-color,background,box-shadow] duration-150 ${
                errors.password ? "border-red-400/60" : "border-white/[0.11]"
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1.5 text-[11.5px] text-red-300/90">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="mt-4 px-3.5 py-2.5 rounded-[9px] bg-red-500/15 border border-red-400/25 text-[12.5px] text-red-200 font-semibold">
              {serverError}
            </div>
          )}

          {/* Hardcoded classes prevent design manipulation issues */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] mt-7 rounded-[10px] font-heading font-semibold text-[14px] bg-[#0E9B94] !bg-[#0E9B94] text-[#03211F] !text-[#03211F] flex items-center justify-center gap-2 hover:bg-[#12BFB4] hover:!bg-[#12BFB4] active:translate-y-px transition-colors duration-150 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-[17px] h-[17px] animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Enter
                <ArrowRight className="w-[17px] h-[17px]" />
              </>
            )}
          </button>

          <p className="mt-[22px] text-[11.5px] text-white/35 leading-relaxed">
            Students are enrolled by their educator. If you don&apos;t have
            credentials yet, ask your teacher.
          </p>
        </form>

        <p className="absolute bottom-[30px] left-0 right-0 text-center text-[10.5px] text-white/25 tracking-wide">
          © {new Date().getFullYear()} ARQADEMY
        </p>
      </div>
    </div>
  );
}
