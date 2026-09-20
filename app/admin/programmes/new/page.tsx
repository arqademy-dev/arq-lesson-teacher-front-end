"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { Plus } from "lucide-react";

export default function NewProgrammePage() {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [phase, setPhase] = useState<"exams" | "skills" | "opportunities">("exams");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const phases = [
    { value: "exams", label: "Exams Phase" },
    { value: "skills", label: "Skills Phase" },
    { value: "opportunities", label: "Opportunities Phase" }
  ];

  return (
    <AdminShell title="New Programme" subtitle="Arqademy" onLogout={() => window.location.href = "/admin/login"}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/programmes" className="text-[12px] font-bold text-[var(--brand)] mb-6 block">← Back to Programmes</Link>

        <div className="card p-10 border border-[var(--line)]">
          <h2 className="text-3xl font-heading mb-8">Create New Programme</h2>

          <div className="space-y-8">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider mb-2">Programme Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]" placeholder="University Pathway Programme" />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider mb-2">Subtitle</label>
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]" placeholder="SS3 → University" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider mb-2">Phase</label>
                <select value={phase} onChange={e => setPhase(e.target.value as any)} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]">
                  {phases.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider mb-2">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <button className="w-full btn teal py-4 text-xl font-semibold" onClick={() => window.location.href = "/admin/programmes/new"}>
              Create Programme
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}