import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[9px] grid place-items-center border border-white/10"
            style={{
              background:
                "linear-gradient(150deg, rgba(255,255,255,.13), rgba(255,255,255,.03))",
              color: "#2FD3C9",
            }}
          >
            <span className="font-heading font-semibold text-sm tracking-wider">
              Q
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-semibold text-[13px] tracking-[0.155em] text-[var(--ink)]">
              ARQADEMY
            </span>
            <span className="text-[9px] font-bold tracking-[0.17em] uppercase text-[var(--ink-3)]">
              Powering Next Minds
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-24">
        <div className="max-w-2xl">
          <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-4">
            Learning platform
          </p>
          <h1 className="font-heading text-[clamp(32px,5vw,48px)] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
            Individualised learning,{" "}
            <span className="text-[var(--brand)]">one session at a time</span>
          </h1>
          <p className="mt-5 text-[15px] text-[var(--ink-2)] max-w-[48ch] leading-relaxed">
            Students complete daily lessons. Educators track performance.
            Admins run the curriculum and approvals.
          </p>
        </div>

        {/* Role entry cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {/* Student */}
          <Link
            href="/students/login"
            className="group rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)] hover:shadow-[var(--shadow)]"
          >
            <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] mb-3">
              <BookOpen className="w-[18px] h-[18px]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
              Student
            </h3>
            <p className="mt-2 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
              Log in for today&apos;s session, interactive checks, and progress.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] group-hover:gap-2.5 transition-all">
              Enter as student
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Educator */}
          <Link
            href="/educators/login"
            className="group rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)] hover:shadow-[var(--shadow)]"
          >
            <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] mb-3">
              <GraduationCap className="w-[18px] h-[18px]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
              Educator
            </h3>
            <p className="mt-2 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
              Manage students, learning plans, and see performance reports.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] group-hover:gap-2.5 transition-all">
              Enter as educator
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Admin */}
          <Link
            href="/admin/login"
            className="group rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)] hover:shadow-[var(--shadow)]"
          >
            <div className="w-9 h-9 rounded-[9px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] mb-3">
              <Shield className="w-[18px] h-[18px]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
              Admin
            </h3>
            <p className="mt-2 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
              Curriculum, approvals, payments, and system-wide activity.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] group-hover:gap-2.5 transition-all">
              Enter as admin
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[var(--line)] py-6 text-center text-[11px] text-[var(--ink-4)] tracking-wide">
        © {new Date().getFullYear()} ARQADEMY · Powering Next Minds
      </footer>
    </div>
  );
}