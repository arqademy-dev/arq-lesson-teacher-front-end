"use client";
// admin/content-bank/page.tsx
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listSubjects,
  listClasses,
  listTopics,
  ApiError,
} from "@/lib/api";
import { Loader2, ChevronRight, Layers } from "lucide-react";

export default function AdminContentBankPage() {
  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [classes, setClasses] = useState<Record<string, unknown>[]>([]);
  const [topics, setTopics] = useState<Record<string, unknown>[]>([]);

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subjects and classes are both top-level lists — load once on mount.
  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([listSubjects(), listClasses()]);
      const subjectList = Array.isArray(s) ? (s as Record<string, unknown>[]) : [];
      const classList = Array.isArray(c) ? (c as Record<string, unknown>[]) : [];
      setSubjects(subjectList);
      setClasses(classList);
      if (subjectList[0]) setActiveSubjectId(String(subjectList[0].id));
      if (classList[0]) setActiveClassId(String(classList[0].id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Failed"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  // Topics need both subject + class selected — same combination rule as
  // the curriculum subject detail page.
  useEffect(() => {
    if (!activeSubjectId || !activeClassId) {
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    (async () => {
      try {
        const t = await listTopics({
          subjectId: activeSubjectId,
          classId: activeClassId,
        });
        setTopics(Array.isArray(t) ? (t as Record<string, unknown>[]) : []);
      } catch {
        setTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    })();
  }, [activeSubjectId, activeClassId]);

  return (
    <AdminShell
      title="Content Bank"
      subtitle="Resources & interactive elements"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}
      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1.2fr]">
          {/* Subjects */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="font-heading text-[13px] font-semibold">Subjects</p>
            </div>
            {subjects.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-[var(--ink-3)]">
                No subjects yet — add one under Curriculum first.
              </p>
            ) : (
              <ul>
                {subjects.map((s) => {
                  const id = String(s.id);
                  const active = id === activeSubjectId;
                  return (
                    <li
                      key={id}
                      className={`border-b border-[var(--line-soft)] last:border-0 ${
                        active ? "bg-[var(--brand-soft)]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSubjectId(id)}
                        className="w-full text-left px-4 py-2.5 font-bold text-[13px] text-[var(--ink)]"
                      >
                        {String(s.title)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Classes */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="font-heading text-[13px] font-semibold">Classes</p>
              <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                Shared across all subjects.
              </p>
            </div>
            {classes.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-[var(--ink-3)]">
                No classes yet — add one under Curriculum first.
              </p>
            ) : (
              <ul>
                {classes.map((c) => {
                  const id = String(c.id);
                  const active = id === activeClassId;
                  return (
                    <li
                      key={id}
                      className={`border-b border-[var(--line-soft)] last:border-0 ${
                        active ? "bg-[var(--brand-soft)]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveClassId(id)}
                        className="w-full text-left px-4 py-2.5"
                      >
                        <div className="font-bold text-[13px] text-[var(--ink)]">
                          {String(c.title)}
                        </div>
                        {c.term != null && (
                          <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                            {String(c.term)}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Topics — the drill-down target */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="font-heading text-[13px] font-semibold">
                Topics {!activeSubjectId || !activeClassId ? "(select subject + class)" : ""}
              </p>
              <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                Pick a topic to manage its resources and interactive elements.
              </p>
            </div>

            {topicsLoading && (
              <div className="flex items-center gap-2 px-4 py-6 text-[12.5px] text-[var(--ink-3)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading topics…
              </div>
            )}

            {!topicsLoading && activeSubjectId && activeClassId && topics.length === 0 && (
              <p className="px-4 py-8 text-center text-[12.5px] text-[var(--ink-3)]">
                No topics for this subject + class combination yet — add one
                under Curriculum first.
              </p>
            )}

            {!topicsLoading && topics.length > 0 && (
              <ul>
                {topics.map((t) => {
                  const id = String(t.id);
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                    >
                      <Link
                        href={`/admin/content-bank/topics/${id}`}
                        className="flex-1 min-w-0 flex items-center gap-2"
                      >
                        <Layers className="w-4 h-4 text-[var(--ink-4)] flex-none" />
                        <div className="min-w-0">
                          <div className="font-bold text-[13px] text-[var(--ink)] truncate">
                            {String(t.title)}
                          </div>
                          <div className="text-[11px] text-[var(--ink-3)]">
                            order {String(t.sortOrder)} ·{" "}
                            {String(t.expectedDurationDays)} day(s)
                          </div>
                        </div>
                      </Link>
                      <Link href={`/admin/content-bank/topics/${id}`}>
                        <ChevronRight className="w-4 h-4 text-[var(--ink-4)]" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}