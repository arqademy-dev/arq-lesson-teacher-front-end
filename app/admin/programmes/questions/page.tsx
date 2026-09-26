"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/AdminShell";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFormModal } from "@/components/questions/QuestionFormModal";
import {
  listBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  archiveBankQuestion,
  listSubjects,
  listTopics,
  ApiError,
  type BankQuestion,
  type CreateBankQuestionPayload,
  type QuestionType,
} from "@/lib/api";

const ALL = "";

export default function AdminQuestionsPage() {
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name?: string; title?: string }>
  >([]);
  const [topics, setTopics] = useState<
    Array<{ id: string; title: string; subjectId?: string | null }>
  >([]);
  const [items, setItems] = useState<BankQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [subjectId, setSubjectId] = useState(ALL);
  const [topicId, setTopicId] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState<QuestionType | "">("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSubjects()
      .then((s) => setSubjects(Array.isArray(s) ? s : []))
      .catch(() => {});
    listTopics({})
      .then((t) => setTopics(Array.isArray(t) ? t : []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBankQuestions({
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
        type: typeFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to load questions"
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId, topicId, typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const topicsForFilter = useMemo(
    () =>
      subjectId
        ? topics.filter((t) => t.subjectId === subjectId)
        : topics,
    [topics, subjectId]
  );

  // Group by topic for display
  const byTopic = useMemo(() => {
    const map = new Map<string, { title: string; subject: string; list: BankQuestion[] }>();
    for (const q of items) {
      const key = q.topicId;
      if (!map.has(key)) {
        map.set(key, {
          title: q.topicTitle,
          subject: q.subjectTitle ?? "—",
          list: [],
        });
      }
      map.get(key)!.list.push(q);
    }
    return Array.from(map.entries());
  }, [items]);

  async function handleSave(payload: {
    mode: "add" | "edit";
    id?: string;
    body: CreateBankQuestionPayload | Record<string, unknown>;
  }) {
    setSaving(true);
    try {
      if (payload.mode === "add") {
        await createBankQuestion(payload.body as CreateBankQuestionPayload);
        toast.success("Question created");
      } else if (payload.id) {
        const b = payload.body as CreateBankQuestionPayload;
        // Type is immutable — only send updatable fields
        if (b.type === "multiple_choice") {
          await updateBankQuestion(payload.id, {
            topicId: b.topicId,
            text: b.text,
            options: b.options,
            correctIndex: b.correctIndex,
            feedback: b.feedback ?? null,
          });
        } else {
          await updateBankQuestion(payload.id, {
            topicId: b.topicId,
            text: b.text,
            acceptedAnswers: b.acceptedAnswers,
            feedback: b.feedback ?? null,
          });
        }
        toast.success("Question updated");
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Archive this question? It stays in the DB for quiz history.")) {
      return;
    }
    try {
      await archiveBankQuestion(id);
      toast.success("Question archived");
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Archive failed"
      );
    }
  }

  return (
    <AdminShell
      title="Questions"
      subtitle="Arqademy Question Bank"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card border border-[var(--line)] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-2">
                Subject
              </label>
              <select
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId(ALL);
                }}
              >
                <option value={ALL}>All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-2">
                Topic
              </label>
              <select
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
              >
                <option value={ALL}>All topics</option>
                {topicsForFilter.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-2">
                Type
              </label>
              <select
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as QuestionType | "")
                }
              >
                <option value="">All types</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="fill_blank">Fill in the blank</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question text…"
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm"
              />
            </div>
            <button
              className="btn teal small ml-auto"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add question
            </button>
          </div>

          <p className="text-xs text-[var(--ink-3)]">
            {total} question{total === 1 ? "" : "s"}
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--ink-3)] py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}

        {!loading && byTopic.length === 0 && (
          <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] p-12 text-center text-sm text-[var(--ink-3)]">
            No questions match. Add one or clear filters.
          </div>
        )}

        {!loading &&
          byTopic.map(([tid, group]) => (
            <section
              key={tid}
              className="card border border-[var(--line)] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <div className="eyebrow text-[var(--brand)]">
                    {group.subject}
                  </div>
                  <h3 className="font-heading text-2xl font-semibold mt-1">
                    {group.title}
                  </h3>
                  <p className="text-xs text-[var(--ink-3)] mt-1">
                    {group.list.length} question
                    {group.list.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  className="btn teal small"
                  onClick={() => {
                    setEditing(null);
                    setTopicId(tid);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add question
                </button>
              </div>
              <div className="space-y-5">
                {group.list.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    number={i + 1}
                    onEdit={() => {
                      setEditing(q);
                      setFormOpen(true);
                    }}
                    onDelete={() => handleDelete(q.id)}
                  />
                ))}
              </div>
            </section>
          ))}
      </div>

      <QuestionFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        subjects={subjects as never}
        topics={topics as never}
        defaultSubjectId={
          editing?.subjectId ?? (subjectId || subjects[0]?.id || "")
        }
        defaultTopicId={
          editing?.topicId ?? (topicId || topics[0]?.id || "")
        }
        question={editing}
        saving={saving}
        onSave={handleSave}
      />
    </AdminShell>
  );
}