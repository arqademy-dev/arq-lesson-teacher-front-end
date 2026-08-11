"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react"; // Added ArrowLeft
import { adminLogin, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await adminLogin(values);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message || "Invalid credentials");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    // FIX 1: Converted fixed inset-0 to dynamic scroll container to safeguard layout integrity across mobile and smaller screens
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] bg-[radial-gradient(1200px_800px_at_20%_20%,#14294F_0%,#0D1B3D_45%,#070F26_100%)] overflow-y-auto">
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(to right,#05A9A9 1px,transparent 1px),linear-gradient(to bottom,#05A9A9 1px,transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="relative hidden lg:flex flex-col justify-center px-[clamp(40px,7vw,110px)] py-12">
        <div className="font-heading font-semibold text-white text-[clamp(38px,4.6vw,62px)] leading-none">
          AR<span className="text-[#12BFB4]">Q</span>
          <span className="text-[#12BFB4]">academy</span>
        </div>
        <p className="mt-5 text-[11px] font-bold tracking-[0.34em] uppercase text-[#12BFB4]">
          Powering Next Minds
        </p>
        <h2 className="mt-14 font-heading font-medium text-[#EAF1FA] text-[clamp(22px,2.3vw,31px)] leading-[1.25]">
          HQ control.
          <br />
          One system for every mind.
        </h2>
        <p className="mt-3.5 text-[12px] font-bold tracking-[0.26em] uppercase text-white/40">
          Super Admin
        </p>
        <div className="w-[52px] h-0.5 bg-[#12BFB4] rounded-sm mt-8" />
      </div>

      {/* FIX 2: Added vertical padding to ensure elements never clip on small screens */}
      <div className="relative flex flex-col justify-center px-[clamp(24px,6vw,96px)] py-12 lg:border-l lg:border-white/[0.06]">
        
        {/* FIXED WHITE BACK BUTTON */}
        <Link 
          href="/" 
          className="absolute top-8 left-[clamp(24px,6vw,96px)] flex items-center gap-2 text-[12px] font-medium text-white transition-colors duration-140 group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-140" />
          <span>Back to Home</span>
        </Link>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[392px] mx-auto lg:mx-0 mt-8 lg:mt-0"
        >
          <h2 className="font-heading font-semibold text-[23px] text-white">
            Admin login
          </h2>
          <p className="text-[13px] text-white/45 mt-1.5">
            Restricted access. Credentials set by HQ.
          </p>

          <div className="mt-[22px]">
            <label className="block text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-2">
              Email
            </label>
            <input
              type="email"
              className={`w-full h-12 px-[15px] text-[14px] text-white !text-white rounded-[10px] bg-white/[0.045] border focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] ${
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
              className={`w-full h-12 px-[15px] text-[14px] text-white !text-white rounded-[10px] bg-white/[0.045] border focus:outline-none focus:border-[#12BFB4] focus:bg-white/[0.07] ${
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

          {/* Hardcoded classes prevent design manipulation issues and bypass conflicting global configurations */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] mt-7 rounded-[10px] font-heading font-semibold text-[14px] bg-[#0E9B94] !bg-[#0E9B94] text-[#03211F] !text-[#03211F] flex items-center justify-center gap-2 hover:bg-[#12BFB4] hover:!bg-[#12BFB4] disabled:opacity-70 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Enter HQ
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
