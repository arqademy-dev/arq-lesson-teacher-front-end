"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, CheckCircle, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/AdminShell";
import { Modal } from "@/components/ui/Modal";
import {
  getProgramme,
  updateProgramme,
  listProgrammeTopics,
  listAvailableProgrammeTopics,
  addExistingTopicToProgramme,
  removeTopicFromProgramme,
  reorderProgrammeTopics,
  listSubjects,
  ApiError,
  type Programme,
  type ProgrammeTopic,
  type AvailableTopic,
  type ProgrammeStatus,
} from "@/lib/api"; // adjust path

type SubjectOption = { id: string; title: string };

export default function ProgrammeBuilderPage() {
  const params = useParams();
  const programmeId = params.id as string;

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [topics, setTopics] = useState<ProgrammeTopic[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Add-topic modal
  const [showModal, setShowModal] = useState(false);
  const [available, setAvailable] = useState<AvailableTopic[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [prog, topicList, subjectList] = await Promise.all([
        getProgramme(programmeId),
        listProgrammeTopics(programmeId),
        listSubjects().catch(() => []),
      ]);
      setProgramme(prog);
      setTopics(Array.isArray(topicList) ? topicList : []);
      setSubjects(
        Array.isArray(subjectList)
          ? subjectList.map((s: any) => ({ id: s.id, title: s.title }))
          : []
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to load programme"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (programmeId) load();
  }, [programmeId]);

  // ---------- Status ----------
  async function handleStatusChange(next: ProgrammeStatus) {
    if (!programme) return;
    try {
      const updated = await updateProgramme(programme.id, { status: next });
      setProgramme(updated);
      toast.success(`Status set to ${next}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update status"
      );
    }
  }

  // ---------- Reorder ----------
  async function onDragEnd(result: DropResult) {
    if (!result.destination || reordering) return;
    if (result.source.index === result.destination.index) return;

    const prev = topics;
    const next = Array.from(topics);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);

    // Optimistic UI
    setTopics(next);
    setReordering(true);

    try {
      const updated = await reorderProgrammeTopics(
        programmeId,
        next.map((t) => t.topicId)
      );
      setTopics(updated);
    } catch (err) {
      setTopics(prev); // rollback
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reorder"
      );
    } finally {
      setReordering(false);
    }
  }

  // ---------- Remove ----------
  async function handleRemove(topicId: string, title: string) {
    if (!confirm(`Remove “${title}” from this programme?`)) return;

    try {
      const updated = await removeTopicFromProgramme(programmeId, topicId);
      setTopics(updated);
      toast.success("Topic removed from programme");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove topic"
      );
    }
  }

  // ---------- Add modal ----------
  async function openAddModal() {
    setShowModal(true);
    setFilterSubjectId("");
    setSearch("");
    setSelectedTopicId(null);
    await loadAvailable();
  }

  async function loadAvailable(subjectId?: string) {
    setLoadingAvailable(true);
    try {
      const data = await listAvailableProgrammeTopics(
        programmeId,
        subjectId || undefined
      );
      setAvailable(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to load available topics"
      );
      setAvailable([]);
    } finally {
      setLoadingAvailable(false);
    }
  }

  function onFilterSubject(subjectId: string) {
    setFilterSubjectId(subjectId);
    setSelectedTopicId(null);
    loadAvailable(subjectId || undefined);
  }

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.subjectTitle ?? "").toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  }, [available, search]);

  async function handleAddSelected() {
    if (!selectedTopicId) {
      toast.error("Select a topic first");
      return;
    }
    setAdding(true);
    try {
      const updated = await addExistingTopicToProgramme(
        programmeId,
        selectedTopicId
      );
      setTopics(updated);
      toast.success("Topic added to programme");
      setShowModal(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add topic"
      );
    } finally {
      setAdding(false);
    }
  }

  if (!isMounted || loading) {
    return (
      <AdminShell
        title="Programme Builder"
        subtitle="Arqademy"
        onLogout={() => (window.location.href = "/admin/login")}
      >
        <div className="max-w-5xl mx-auto animate-pulse bg-[var(--surface)] h-96 rounded-[var(--r-card)]" />
      </AdminShell>
    );
  }

  const progName = programme?.title ?? "Programme";
  const status = programme?.status ?? "draft";
  const isLocked = status === "locked";

  return (
    <AdminShell
      title="Programme Builder"
      subtitle={`Arqademy • ${progName}`}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
          <div>
            <Link
              href="/admin/programmes"
              className="text-[12px] font-bold text-[var(--brand)]"
            >
              ← Back to Programmes
            </Link>
            <h1 className="text-4xl font-heading font-semibold tracking-[-0.04em] mt-2">
              {progName}
            </h1>
            {programme?.subtitle && (
              <p className="text-[var(--ink-3)] mt-1">{programme.subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(e) =>
                handleStatusChange(e.target.value as ProgrammeStatus)
              }
              className="px-5 py-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] text-sm font-semibold"
              disabled={isLocked && status === "locked"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="locked">Locked</option>
            </select>

            <button
              onClick={openAddModal}
              className="btn ghost small flex items-center gap-2"
              disabled={isLocked}
            >
              <Plus className="w-4 h-4" />
              Add Topic
            </button>
          </div>
        </div>

        {/* Sequence header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h3 className="font-heading text-2xl">
            Program Model • {topics.length}-Step Sequence
          </h3>
          <div className="text-xs text-[var(--ink-3)] font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--ok)]" />
            {isLocked
              ? "Locked — read only"
              : reordering
              ? "Saving order…"
              : "Editable • Drag to reorder"}
          </div>
        </div>

        {/* Sortable list */}
        {topics.length === 0 ? (
          <div className="card border border-[var(--line)] p-10 text-center text-[var(--ink-3)]">
            No topics yet.{" "}
            {!isLocked && (
              <button
                onClick={openAddModal}
                className="text-[var(--brand)] font-bold"
              >
                Add the first one →
              </button>
            )}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="programme-topics" isDropDisabled={isLocked || reordering}>
              {(dropProvided) => (
                <div
                  {...dropProvided.droppableProps}
                  ref={dropProvided.innerRef}
                  className="card border border-[var(--line)] overflow-hidden"
                >
                  {topics.map((topic, index) => (
                    <Draggable
                      key={topic.topicId}
                      draggableId={topic.topicId}
                      index={index}
                      isDragDisabled={isLocked || reordering}
                    >
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`px-6 py-5 flex items-center justify-between border-b border-[var(--line)] last:border-0 transition ${
                            snapshot.isDragging
                              ? "bg-[var(--surface)] shadow-[var(--shadow-lg)]"
                              : "hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <div className="flex items-center gap-6 min-w-0">
                            <div
                              {...dragProvided.dragHandleProps}
                              className={`text-[var(--ink-3)] p-1 ${
                                isLocked
                                  ? "cursor-not-allowed opacity-40"
                                  : "hover:text-[var(--brand)] cursor-grab active:cursor-grabbing"
                              }`}
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center font-heading text-base font-semibold bg-[var(--surface-3)] text-[var(--ink-3)]">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--ink)]">
                                {topic.subjectTitle ?? "—"}
                              </div>
                              <div className="text-[11px] text-[var(--ink-3)] mt-0.5 truncate">
                                {topic.title}
                              </div>
                            </div>
                          </div>

                          {!isLocked && (
                            <button
                              onClick={() =>
                                handleRemove(topic.topicId, topic.title)
                              }
                              title="Remove from programme"
                              className="p-2 rounded-[var(--r-ctl)] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <div className="mt-8 text-xs text-[var(--ink-3)]">
          Drag any step to change order. Students will follow this exact sequence.
        </div>
      </div>

      {/* Add Topic Modal — select from pool + search */}
      <Modal
        open={showModal}
        onClose={() => !adding && setShowModal(false)}
        title="Add Topic to Programme"
        className="max-w-xl"
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="btn ghost small"
              disabled={adding}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              className="btn teal small"
              disabled={adding || !selectedTopicId}
            >
              {adding ? "Adding…" : "Add Topic"}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-5">
          {/* Subject filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Filter by Subject
            </label>
            <select
              value={filterSubjectId}
              onChange={(e) => onFilterSubject(e.target.value)}
              className="w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
              disabled={loadingAvailable}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Search Topics
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search by title or subject…"
                className="w-full pl-11 pr-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
              />
            </div>
          </div>

          {/* Available topics list */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Available Topics
              {!loadingAvailable && (
                <span className="ml-2 font-normal normal-case">
                  ({filteredAvailable.length})
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto border border-[var(--line)] rounded-[var(--r-card)] divide-y divide-[var(--line)]">
              {loadingAvailable ? (
                <div className="p-4 text-[var(--ink-3)] text-sm">
                  Loading…
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="p-4 text-[var(--ink-3)] text-sm">
                  No available topics
                  {search ? " match your search" : ""}.
                </div>
              ) : (
                filteredAvailable.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-2)] ${
                      selectedTopicId === t.id ? "bg-[var(--brand-soft)]" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="topic"
                      checked={selectedTopicId === t.id}
                      onChange={() => setSelectedTopicId(t.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-[11px] text-[var(--ink-3)]">
                        {t.subjectTitle ?? "No subject"}
                        {t.description ? ` • ${t.description}` : ""}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}