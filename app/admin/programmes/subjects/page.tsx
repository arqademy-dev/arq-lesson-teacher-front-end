"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Plus, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal"; // adjust path if needed
import {
  listSubjects,
  createSubject,
  ApiError,
} from "@/lib/api"; // adjust path if needed

type Subject = {
  id: string;
  title: string;
  description?: string | null;
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadSubjects() {
    try {
      setLoading(true);
      setError(null);
      const data = await listSubjects();
      // Backend returns { id, title, description, ... }
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load subjects";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Subject name is required");
      return;
    }

    setCreating(true);
    try {
      const newSubject = await createSubject({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      setSubjects((prev) => [newSubject as Subject, ...prev]);
      toast.success("Subject created");
      setModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to create subject";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminShell
      title="Subjects"
      subtitle="Arqademy Content Pool"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="flex justify-between items-end mb-10">
        <Link
          href="/admin/programmes"
          className="text-[12px] font-bold text-[var(--brand)]"
        >
          ← Back to Programmes
        </Link>

        <button
          onClick={() => setModalOpen(true)}
          className="btn teal small flex items-center gap-2 rounded-[var(--r-card)]"
        >
          <Plus className="w-4 h-4" />
          New Subject
        </button>
      </div>

      {/* Stats — placeholders for data we don't have yet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">
                TOTAL SUBJECTS
              </div>
              <div className="text-4xl font-heading font-semibold">
                {loading ? "…" : subjects.length}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--brand)]" />
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">
                TOTAL TOPICS
              </div>
              <div className="text-4xl font-heading font-semibold text-[var(--ink-3)]">
                —
              </div>
              <div className="text-[10px] text-[var(--ink-3)] mt-1">
                Coming soon
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-[var(--brand)]">📘</div>
            <div>
              <div className="text-xs text-[var(--ink-3)] font-bold">
                PUBLISHED
              </div>
              <div className="text-4xl font-heading font-semibold text-[var(--ink-3)]">
                —
              </div>
              <div className="text-[10px] text-[var(--ink-3)] mt-1">
                Coming soon
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

      {/* Subjects Grid */}
      {loading ? (
        <div className="text-[var(--ink-3)]">Loading subjects…</div>
      ) : subjects.length === 0 ? (
        <div className="text-[var(--ink-3)]">
          No subjects yet.{" "}
          <button
            onClick={() => setModalOpen(true)}
            className="text-[var(--brand)] font-bold"
          >
            Create the first one →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {subjects.map((subj) => (
            <Link
              key={subj.id}
              href={`/admin/programmes/subjects/${subj.id}/topics`}
              className="group"
            >
              <div className="h-full rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-6 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow-lg)] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand)] mb-1">
                      ARQADEMY
                    </div>
                    <h3 className="font-heading text-2xl font-semibold group-hover:text-[var(--brand)] transition">
                      {subj.title}
                    </h3>
                    <p className="text-[var(--ink-3)] mt-1 line-clamp-2">
                      {subj.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-end text-xs">
                  <div className="text-[var(--ink-3)]">Ready for topics</div>
                </div>

                <div className="mt-6 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--teal)] to-[var(--tan)] transition-all"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!creating) {
            setModalOpen(false);
            setTitle("");
            setDescription("");
          }
        }}
        title="Create New Subject"
        footer={
          <>
            <button
              className="btn ghost"
              onClick={() => {
                setModalOpen(false);
                setTitle("");
                setDescription("");
              }}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              className="btn teal"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create Subject"}
            </button>
          </>
        }
      >
        <div className="px-6 py-6 space-y-6">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Subject Name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
              placeholder="Mathematics"
              disabled={creating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
              placeholder="Optional short description…"
              disabled={creating}
            />
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}