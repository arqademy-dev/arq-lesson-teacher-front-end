"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  getSubject,
  updateSubject,
  listClasses,
  createClass,
  deleteClass,
  listTopics,
  createTopic,
  deleteTopic,
  listResources,
  listInteractiveElements,
  ApiError,
} from "@/lib/api";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function AdminSubjectDetailPage() {
  const params = useParams();
  const subjectId = String(params.id || "");

  const [subject, setSubject] = useState<Record<string, unknown> | null>(null);
  const [classes, setClasses] = useState<Record<string, unknown>[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Record<string, unknown>[]>([]);
  const [resourceJson, setResourceJson] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classTitle, setClassTitle] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDays, setTopicDays] = useState(1);

  // Classes are global now (shared across every subject) — load the whole
  // list once, independent of which subject we're viewing.
  const loadSubject = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        getSubject(subjectId),
        listClasses(),
      ]);
      setSubject(s as Record<string, unknown>);
      const list = Array.isArray(c) ? (c as Record<string, unknown>[]) : [];
      setClasses(list);
      if (list[0] && !activeClassId) {
        setActiveClassId(String(list[0].id));
      }
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
  }, [subjectId, activeClassId]);

  useEffect(() => {
    loadSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  // Topics now need BOTH this subject and the selected class — a topic is
  // uniquely identified by that combination, not by class alone.
  useEffect(() => {
    if (!activeClassId) {
      setTopics([]);
      return;
    }
    (async () => {
      try {
        const t = await listTopics({ subjectId, classId: activeClassId });
        setTopics(Array.isArray(t) ? (t as Record<string, unknown>[]) : []);
      } catch {
        setTopics([]);
      }
    })();
  }, [subjectId, activeClassId]);

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    if (!classTitle.trim()) return;
    // No subjectId — this creates a class available to every subject, not
    // just this one.
    await createClass({ title: classTitle.trim(), isActive: true });
    setClassTitle("");
    await loadSubject();
  }

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClassId || !topicTitle.trim()) return;
    await createTopic({
      subjectId,
      classId: activeClassId,
      title: topicTitle.trim(),
      sortOrder: topics.length + 1,
      expectedDurationDays: topicDays || 1,
    });
    setTopicTitle("");
    const t = await listTopics({ subjectId, classId: activeClassId });
    setTopics(Array.isArray(t) ? (t as Record<string, unknown>[]) : []);
  }

  async function removeClass(id: string) {
    const ok = confirm(
      "This class is shared across every subject that uses it — deleting it removes its topics everywhere, not just here in this subject. Continue?"
    );
    if (!ok) return;
    await deleteClass(id);
    if (activeClassId === id) setActiveClassId(null);
    await loadSubject();
  }

  async function openTopicResources(topicId: string) {
    try {
      const resources = await listResources(topicId);
      const list = Array.isArray(resources) ? resources : [];
      const withElements = await Promise.all(
        list.map(async (r) => {
          const row = r as Record<string, unknown>;
          try {
            const els = await listInteractiveElements(String(row.id));
            return { ...row, interactiveElements: els };
          } catch (e) {
            return {
              ...row,
              interactiveElements: {
                error: e instanceof Error ? e.message : String(e),
              },
            };
          }
        })
      );
      setResourceJson({ topicId, resources: withElements });
    } catch (err) {
      setResourceJson({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <AdminShell
      title={String(subject?.title ?? "Subject")}
      subtitle="Curriculum"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <Link
        href="/admin/curriculum"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All subjects
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}
      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && subject && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Classes */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="font-heading text-[13px] font-semibold">
                Classes
              </p>
              <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                Shared across all subjects — pick one to browse or add topics
                for {String(subject.title ?? "this subject")}.
              </p>
            </div>
            <form
              onSubmit={addClass}
              className="p-3 flex gap-2 border-b border-[var(--line-soft)]"
            >
              <input
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                placeholder="New class title"
                className="flex-1 h-9 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-[8px] bg-[var(--brand)] text-white text-[12px] font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
            <ul>
              {classes.map((c) => {
                const id = String(c.id);
                const active = id === activeClassId;
                return (
                  <li
                    key={id}
                    className={`flex items-center gap-2 px-3 py-2.5 border-b border-[var(--line-soft)] last:border-0 ${
                      active ? "bg-[var(--brand-soft)]" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveClassId(id)}
                      className="flex-1 text-left font-bold text-[13px] text-[var(--ink)]"
                    >
                      {String(c.title)}
                      {c.term != null && (
                        <span className="block text-[11px] font-semibold text-[var(--ink-3)]">
                          {String(c.term)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClass(id)}
                      className="p-1.5 text-[var(--danger)]"
                      title="Delete class (affects every subject using it)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Topics */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line-soft)] font-heading text-[13px] font-semibold">
              Topics {activeClassId ? "" : "(select a class)"}
            </div>
            {activeClassId && (
              <form
                onSubmit={addTopic}
                className="p-3 flex flex-wrap gap-2 border-b border-[var(--line-soft)]"
              >
                <input
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Topic title"
                  className="flex-1 min-w-[140px] h-9 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                />
                <input
                  type="number"
                  min={1}
                  value={topicDays}
                  onChange={(e) => setTopicDays(Number(e.target.value))}
                  className="w-20 h-9 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                  title="Expected days"
                />
                <button
                  type="submit"
                  className="h-9 px-3 rounded-[8px] bg-[var(--brand)] text-white text-[12px] font-bold"
                >
                  Add
                </button>
              </form>
            )}
            <ul>
              {topics.map((t) => {
                const id = String(t.id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--line-soft)] last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => openTopicResources(id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-bold text-[13px] text-[var(--ink)]">
                        {String(t.title)}
                      </div>
                      <div className="text-[11px] text-[var(--ink-3)]">
                        order {String(t.sortOrder)} ·{" "}
                        {String(t.expectedDurationDays)} day(s) — click for
                        resources JSON
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Delete topic?")) return;
                        await deleteTopic(id);
                        const next = await listTopics({
                          subjectId,
                          classId: activeClassId!,
                        });
                        setTopics(
                          Array.isArray(next)
                            ? (next as Record<string, unknown>[])
                            : []
                        );
                      }}
                      className="p-1.5 text-[var(--danger)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {resourceJson != null && (
        <div className="mt-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[12px] font-bold text-[var(--ink)] mb-2">
            Resources + interactive elements (JSON)
          </p>
          <pre className="text-[11px] text-[var(--ink-3)] overflow-auto max-h-[480px] leading-relaxed">
            {JSON.stringify(resourceJson, null, 2)}
          </pre>
        </div>
      )}
    </AdminShell>
  );
}