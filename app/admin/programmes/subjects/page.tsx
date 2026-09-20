"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { useEffect, useState } from "react";
import { Plus, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type Subject = {
  id: string;
  name: string;
  phase: string;
  topics: number;
  resources: number;
  students: number;
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: "maths",
      name: "Mathematics",
      phase: "Skills",
      topics: 47,
      resources: 128,
      students: 124
    },
    {
      id: "english",
      name: "English Language",
      phase: "Exams",
      topics: 39,
      resources: 89,
      students: 87
    },
    {
      id: "physics",
      name: "Physics",
      phase: "Skills",
      topics: 52,
      resources: 156,
      students: 41
    }
  ]);

  return (
    <AdminShell title="Subjects" subtitle="Arqademy Content Pool" pendingCount={0} onLogout={() => window.location.href = "/admin/login"}>
      <div className="flex justify-between items-end mb-10">
        <Link href="/admin/programmes" className="text-[12px] font-bold text-[var(--brand)]">← Back to Programmes</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">TOTAL SUBJECTS</div>
              <div className="text-4xl font-heading font-semibold">3</div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">TOTAL TOPICS</div>
              <div className="text-4xl font-heading font-semibold">138</div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-[var(--brand)]">📘</div>
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">PUBLISHED</div>
              <div className="text-4xl font-heading font-semibold text-[var(--ok)]">2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {subjects.map((subj) => (
          <Link key={subj.id} href={`/admin/programmes/subjects/${subj.id}/topics`} className="group">
            <div className="h-full rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-6 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow-lg)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand)] mb-1">ARQADEMY</div>
                  <h3 className="font-heading text-2xl font-semibold group-hover:text-[var(--brand)] transition">{subj.name}</h3>
                  <p className="text-[var(--ink-3)] mt-1">{subj.phase} • {subj.topics} topics</p>
                </div>
                <div className={`px-4 py-1 text-xs font-bold rounded-full ${subj.students > 0 ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--surface-3)] text-[var(--ink-3)]"}`}>
                  {subj.students} students
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="font-semibold text-[var(--brand)]">{subj.resources}</span>
                    <span className="text-[var(--ink-3)] ml-1">Resources</span>
                  </div>
                  <div className="font-mono text-[var(--brand)]">{subj.topics}</div>
                </div>
                <div className="text-right">
                  <div className="text-[var(--ink-3)]">Ready for students</div>
                </div>
              </div>

              <div className="mt-6 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--teal)] to-[var(--tan)] transition-all" style={{ width: "100%" }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}