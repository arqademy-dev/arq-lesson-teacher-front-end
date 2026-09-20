"use client";

import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function AdminTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [topics] = useState([
    {
      id: "alg1",
      name: "Algebra – Linear Equations",
      resources: 12,
      questions: 47,
      status: "published"
    },
    {
      id: "alg2",
      name: "Algebra – Quadratic Equations",
      resources: 8,
      questions: 29,
      status: "published"
    },
    {
      id: "alg3",
      name: "Algebra – Functions",
      resources: 15,
      questions: 61,
      status: "published"
    },
    {
      id: "gram1",
      name: "Grammar – Tenses",
      resources: 9,
      questions: 34,
      status: "draft"
    }
  ]);

  const subjectName = subjectId === "maths" ? "Mathematics" : "English Language";

  return (
    <AdminShell title="Topics" subtitle={`Arqademy • ${subjectName}`} pendingCount={0} onLogout={() => window.location.href = "/admin/login"}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link href="/admin/programmes/subjects" className="text-[12px] font-bold text-[var(--brand)]">← Back to Subjects</Link>
          <h1 className="text-4xl font-heading font-semibold mt-1">{subjectName}</h1>
        </div>
        <Link href="/admin/programmes" className="btn ghost small">Back to Programmes</Link>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/admin/programmes/subjects/${subjectId}/topics/${topic.id}`}
            className="group block"
          >
            <div className="card flex items-center justify-between p-6 border border-[var(--line)] hover:border-[var(--brand)] hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[var(--brand-soft)] rounded-[var(--r-card)] flex items-center justify-center text-2xl">
                  {subjectId === "maths" ? "📐" : "📝"}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold group-hover:text-[var(--brand)] transition">{topic.name}</h3>
                  <p className="text-xs text-[var(--ink-3)] mt-1">{topic.questions} questions • {topic.resources} resources</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="font-mono text-3xl font-semibold text-[var(--brand)]">{topic.questions}</div>
                  <div className="text-xs text-[var(--ink-3)]">QUESTIONS</div>
                </div>

                <div className={`px-5 py-2 text-xs font-bold rounded-full ${topic.status === "published" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--tan-soft)] text-[var(--tan)]"}`}>
                  {topic.status.toUpperCase()}
                </div>

                <button className="btn ghost small">Open in Editor</button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/admin/programmes/subjects" className="btn teal small inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Topic
        </Link>
      </div>
    </AdminShell>
  );
}