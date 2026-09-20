"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Plus, BookOpen, Users, CheckCircle, Subtitles } from "lucide-react";
import { cn } from "@/lib/utils";

type Programme = {
  id: string;
  name: string;
  subtitle: string;
  status: "draft" | "published" | "locked";
  weeks: number;
  students?: number;
  phase: "exams" | "skills" | "opportunities";
};

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([
    {
      id: "univ-pathway",
      name: "University Pathway Programme",
      subtitle: "SS3 → University",
      status: "published",
      weeks: 12,
      students: 124,
      phase: "skills"
    },
    {
      id: "jss3-ss1",
      name: "JSS3 → SS1",
      subtitle: "JSS3 Transition",
      status: "draft",
      weeks: 12,
      students: 87,
      phase: "exams"
    },
    {
      id: "primary-secondary",
      name: "Primary → Secondary",
      subtitle: "Foundation to Secondary",
      status: "draft",
      weeks: 12,
      students: 0,
      phase: "exams"
    }
  ]);

  return (
    <AdminShell title="Programmes" subtitle="Arqademy Academy" pendingCount={0} onLogout={() => window.location.href = "/admin/login"}>
      <div className="flex justify-between items-end mb-10">
        <div className="flex gap-3">
          <Link
            href="/admin/programmes/subjects"
            className="btn ghost small flex items-center gap-2 rounded-[var(--r-card)]"
          >
            <Plus className="w-4 h-4" />
            Curriculum Builder
          </Link>
          <Link
            href="/admin/programmes/students"
            className="btn ghost small flex items-center gap-2 rounded-[var(--r-card)]"
          >
            <Users className="w-4 h-4" />
            Students
          </Link>
          <Link
            href="/admin/programmes/questions"
            className="btn ghost small flex items-center gap-2 rounded-[var(--r-card)]"
          >
            <Subtitles className="w-4 h-4" />
            Questions Bank
          </Link>
          <Link
            href="/admin/programmes/subjects"
            className="btn ghost small flex items-center gap-2 rounded-[var(--r-card)]"
          >
            <BookOpen className="w-4 h-4" />
            Subjects
          </Link>
        </div>

        <Link
          href="/admin/programmes/new"
          className="btn teal small flex items-center gap-2 rounded-[var(--r-card)]"
        >
          <Plus className="w-4 h-4" />
          New Programme
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">TOTAL PATHWAYS</div>
              <div className="text-4xl font-heading font-semibold">3</div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">TOTAL STUDENTS</div>
              <div className="text-4xl font-heading font-semibold">124</div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[var(--ok)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">PUBLISHED</div>
              <div className="text-4xl font-heading font-semibold text-[var(--ok)]">1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Programmes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {programmes.map((prog) => (
          <Link key={prog.id} href={`/admin/programmes/${prog.id}`} className="group">
            <div className="h-full rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-6 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow)] transition-all">
              <div className={`inline-block px-4 py-1 text-xs font-bold rounded-full mb-4 ${prog.status === "published" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--surface-3)] text-[var(--ink-3)]"}`}>
                {prog.status.toUpperCase()}
              </div>
              <h3 className="font-heading text-2xl font-semibold group-hover:text-[var(--brand)] transition">{prog.name}</h3>
              <p className="text-[var(--ink-3)] mt-1">{prog.subtitle}</p>

              <div className="mt-8 flex justify-between items-end">
                <div>
                  <div className="text-xs text-[var(--ink-3)]">12 weeks • {prog.phase}</div>
                  <div className="font-mono text-sm text-[var(--brand)]">{prog.weeks} days</div>
                </div>
                <div className="text-right">
                  {prog.students ? (
                    <div className="font-semibold text-[var(--brand)]">🧑‍🎓 {prog.students} students</div>
                  ) : (
                    <div className="text-[var(--warn)]">No students yet</div>
                  )}
                </div>
              </div>

              {/* Progress bar - clean, no gradient */}
              <div className="mt-6 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--teal)] transition-all" style={{ width: prog.status === "published" ? "100%" : "45%" }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}