"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal"; // adjust path if needed
import {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getSubject,
  ApiError,
  type Topic,
  type SummaryFormat,
} from "@/lib/api"; // adjust path if needed

export default function AdminTopicsPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;

  const [subjectTitle, setSubjectTitle] = useState<string>("…");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [subject, topicsData] = await Promise.all([
        getSubject(subjectId).catch(() => null),
        listTopics({ subjectId }),
      ]);

      if (subject && typeof subject === "object" && "title" in subject) {
        setSubjectTitle((subject as { title: string }).title);
      } else {
        setSubjectTitle("Subject");
      }

      setTopics(Array.isArray(topicsData) ? topicsData : []);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load topics";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (subjectId) load();
  }, [subjectId]);

  function openCreate() {
    setEditingTopic(null);
    setTitle("");
    setDescription("");
    setSummaryFormat([]);
    setModalOpen(true);
  }

  function openEdit(topic: Topic) {
    setEditingTopic(topic);
    setTitle(topic.title);
    setDescription(topic.description ?? "");
    setSummaryFormat(
      Array.isArray(topic.summaryFormat) ? topic.summaryFormat : []
    );
    setModalOpen(true);
  }

  function addSection() {
    setSummaryFormat((prev) => [...prev, { header: "", body: "" }]);
  }

  function updateSection(
    index: number,
    field: "header" | "body",
    value: string
  ) {
    setSummaryFormat((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSection(index: number) {
    setSummaryFormat((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Topic title is required");
      return;
    }

    const cleanFormat = summaryFormat
      .map((s) => ({
        header: s.header.trim(),
        body: s.body.trim(),
      }))
      .filter((s) => s.header || s.body);

    setSaving(true);
    try {
      if (editingTopic) {
        const updated = await updateTopic(editingTopic.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          summaryFormat: cleanFormat.length ? cleanFormat : null,
        });
        setTopics((prev) =>
          prev.map((t) => (t.id === editingTopic.id ? (updated as Topic) : t))
        );
        toast.success("Topic updated");
      } else {
        const created = await createTopic({
          subjectId,
          title: title.trim(),
          description: description.trim() || undefined,
          sortOrder: topics.length + 1,
          expectedDurationDays: 1,
          summaryFormat: cleanFormat.length ? cleanFormat : undefined,
        });
        setTopics((prev) => [...prev, created as Topic]);
        toast.success("Topic created");
      }

      setModalOpen(false);
      setEditingTopic(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to save topic";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(topic: Topic) {
    if (!confirm(`Delete topic “${topic.title}”? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteTopic(topic.id);
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
      toast.success("Topic deleted");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete topic";
      toast.error(msg);
    }
  }

  return (
    <AdminShell
      title="Topics"
      subtitle={`Arqademy • ${subjectTitle}`}
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link
            href="/admin/programmes/subjects"
            className="text-[12px] font-bold text-[var(--brand)]"
          >
            ← Back to Subjects
          </Link>
          <h1 className="text-4xl font-heading font-semibold mt-1">
            {subjectTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/programmes" className="btn ghost small">
            Back to Programmes
          </Link>
          <button
            onClick={openCreate}
            className="btn teal small flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm font-medium text-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 rounded-[var(--r-card)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[var(--ink-3)]">Loading topics…</div>
      ) : topics.length === 0 ? (
        <div className="text-[var(--ink-3)]">
          No topics yet.{" "}
          <button
            onClick={openCreate}
            className="text-[var(--brand)] font-bold"
          >
            Create the first one →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="card flex items-center justify-between p-6 border border-[var(--line)] hover:border-[var(--brand)] transition-all"
            >
              <Link
                href={`/admin/programmes/subjects/${subjectId}/topics/${topic.id}`}
                className="flex items-center gap-6 flex-1 group min-w-0"
              >
                <div className="w-12 h-12 bg-[var(--brand-soft)] rounded-[var(--r-card)] flex items-center justify-center text-2xl flex-none">
                  📘
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xl font-semibold group-hover:text-[var(--brand)] transition truncate">
                    {topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-xs text-[var(--ink-3)] mt-1 line-clamp-1">
                      {topic.description}
                    </p>
                  )}
                  {Array.isArray(topic.summaryFormat) &&
                    topic.summaryFormat.length > 0 && (
                      <p className="text-[11px] text-[var(--brand)] mt-1">
                        {topic.summaryFormat.length} summary section
                        {topic.summaryFormat.length === 1 ? "" : "s"}
                      </p>
                    )}
                </div>
              </Link>

              <div className="flex items-center gap-3 flex-none">
                <button
                  onClick={() => openEdit(topic)}
                  className="btn ghost small flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(topic)}
                  className="btn ghost small text-[var(--warn)] flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <Link
                  href={`/admin/programmes/subjects/${subjectId}/topics/${topic.id}`}
                  className="btn ghost small"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingTopic(null);
          }
        }}
        title={editingTopic ? "Edit Topic" : "Add New Topic"}
        footer={
          <>
            <button
              className="btn ghost"
              onClick={() => {
                setModalOpen(false);
                setEditingTopic(null);
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn teal"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editingTopic
                ? "Save Changes"
                : "Create Topic"}
            </button>
          </>
        }
      >
        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Topic Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
              placeholder="Algebra – Linear Equations"
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
              placeholder="Optional short description…"
              disabled={saving}
            />
          </div>

          {/* Summary Format */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs uppercase font-bold tracking-wider">
                Student Summary Format
              </label>
              <button
                type="button"
                onClick={addSection}
                className="btn ghost small"
                disabled={saving}
              >
                + Add section
              </button>
            </div>

            <p className="text-[11px] text-[var(--ink-3)] mb-4">
              Sections the student should cover in their end-of-day summary.
            </p>

            {summaryFormat.length === 0 ? (
              <div className="text-sm text-[var(--ink-3)] border border-dashed border-[var(--line)] rounded-[var(--r-card)] px-4 py-6 text-center">
                No sections yet. Click “Add section” to define what students
                should summarise.
              </div>
            ) : (
              <div className="space-y-4">
                {summaryFormat.map((section, index) => (
                  <div
                    key={index}
                    className="border border-[var(--line)] rounded-[var(--r-card)] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-[var(--ink-3)]">
                        Section {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="text-xs text-[var(--warn)] hover:underline"
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      value={section.header}
                      onChange={(e) =>
                        updateSection(index, "header", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                      placeholder="Header (e.g. Key concepts learned)"
                      disabled={saving}
                    />

                    <textarea
                      value={section.body}
                      onChange={(e) =>
                        updateSection(index, "body", e.target.value)
                      }
                      rows={2}
                      className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
                      placeholder="Guidance for the student (optional)"
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}