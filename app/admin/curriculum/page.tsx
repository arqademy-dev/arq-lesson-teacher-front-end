"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listSubjects,
  createSubject,
  deleteSubject,
  ApiError,
} from "@/lib/api";
import { Loader2, Plus, Trash2, ChevronRight } from "lucide-react";

export default function AdminCurriculumPage() {
  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubjects();
      setSubjects(Array.isArray(data) ? (data as Record<string, unknown>[]) : []);
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
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createSubject({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete subject and cascade classes/topics/resources?")) return;
    try {
      await deleteSubject(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell
      title="Curriculum"
      subtitle="Content bank"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <form
        onSubmit={onCreate}
        className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subject title"
          className="h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add subject
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading subjects…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {!loading && !error && (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          {subjects.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--ink-3)]">
              No subjects yet.
            </p>
          ) : (
            <ul>
              {subjects.map((s) => {
                const id = String(s.id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <Link
                      href={`/admin/curriculum/subjects/${id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="font-bold text-[13px] text-[var(--ink)]">
                        {String(s.title)}
                      </div>
                      {s.description != null && String(s.description) && (
                        <div className="text-[11px] text-[var(--ink-3)] mt-0.5 truncate">
                          {String(s.description)}
                        </div>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(id)}
                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-[8px]"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link href={`/admin/curriculum/subjects/${id}`}>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-4)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </AdminShell>
  );
}