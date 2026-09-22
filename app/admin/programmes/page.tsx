"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Plus, BookOpen, Users, CheckCircle, Subtitles } from "lucide-react";
import { listProgrammes, type Programme, ApiError } from "@/lib/api"; // adjust path

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listProgrammes({ limit: 100 });
        if (!cancelled) setProgrammes(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load programmes"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = programmes.reduce((sum, p) => sum + (p.studentCount || 0), 0);
  const publishedCount = programmes.filter((p) => p.status === "published").length;

  return (
    <AdminShell
      title="Programmes"
      subtitle="Arqademy Academy"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="flex justify-between items-end mb-10">
        <div className="flex gap-3 flex-wrap">
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
              <div className="text-4xl font-heading font-semibold">
                {loading ? "…" : programmes.length}
              </div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">TOTAL STUDENTS</div>
              <div className="text-4xl font-heading font-semibold">
                {loading ? "…" : totalStudents}
              </div>
            </div>
          </div>
        </div>
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[var(--ok)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">PUBLISHED</div>
              <div className="text-4xl font-heading font-semibold text-[var(--ok)]">
                {loading ? "…" : publishedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm font-medium text-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 rounded-[var(--r-card)]">
          {error}
        </div>
      )}

      {/* Programmes Grid */}
      {loading ? (
        <div className="text-[var(--ink-3)]">Loading programmes…</div>
      ) : programmes.length === 0 ? (
        <div className="text-[var(--ink-3)]">
          No programmes yet.{" "}
          <Link href="/admin/programmes/new" className="text-[var(--brand)] font-bold">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {programmes.map((prog) => (
            <Link key={prog.id} href={`/admin/programmes/${prog.id}`} className="group">
              <div className="h-full rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-6 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow)] transition-all">
                <div
                  className={`inline-block px-4 py-1 text-xs font-bold rounded-full mb-4 ${
                    prog.status === "published"
                      ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                      : prog.status === "locked"
                      ? "bg-[var(--warn-soft)] text-[var(--warn)]"
                      : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                  }`}
                >
                  {prog.status.toUpperCase()}
                </div>

                <h3 className="font-heading text-2xl font-semibold group-hover:text-[var(--brand)] transition">
                  {prog.title}
                </h3>
                <p className="text-[var(--ink-3)] mt-1">
                  {prog.subtitle || "No subtitle"}
                </p>

                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <div className="text-xs text-[var(--ink-3)]">
                      {prog.topicCount} topic{prog.topicCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-right">
                    {prog.studentCount > 0 ? (
                      <div className="font-semibold text-[var(--brand)]">
                        🧑‍🎓 {prog.studentCount} student
                        {prog.studentCount === 1 ? "" : "s"}
                      </div>
                    ) : (
                      <div className="text-[var(--warn)]">No students yet</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--teal)] transition-all"
                    style={{
                      width:
                        prog.status === "published"
                          ? "100%"
                          : prog.status === "locked"
                          ? "100%"
                          : "45%",
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}