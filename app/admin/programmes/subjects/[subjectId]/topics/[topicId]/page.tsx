// app/admin/programmes/subjects/[subjectId]/topics/[topicId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Modal } from "@/components/ui/Modal";
import { ProgrammeInteractiveEditor } from "./ProgrammeInteractiveEditor";import {
  Plus,
  Play,
  FileText,
  Pencil,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTopic,
  listResources,
  createResource,
  updateResource,
  deleteResource,
  listInteractiveElements,
  deleteInteractiveElement,
  ApiError,
  type Topic,
  type Resource,
  type ResourceType,
  type InteractiveElement,
} from "@/lib/api";

function resourceIcon(type: ResourceType) {
  if (type === "video") return <Play className="w-6 h-6 text-[var(--brand)]" />;
  if (type === "pdf") return <FileText className="w-6 h-6 text-[var(--brand)]" />;
  return <LinkIcon className="w-6 h-6 text-[var(--brand)]" />;
}

function uiToResourceType(ui: string): ResourceType {
  if (ui === "youtube" || ui === "video") return "video";
  if (ui === "pdf") return "pdf";
  return "article";
}

function resourceTypeToUi(type: ResourceType): string {
  if (type === "video") return "youtube";
  if (type === "pdf") return "pdf";
  return "link";
}

type ResourceWithElements = Resource & { elements: InteractiveElement[] };

export default function SingleTopicPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [resources, setResources] = useState<ResourceWithElements[]>([]);
  const [loading, setLoading] = useState(true);

  // Resource modal
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    uiType: "youtube",
    title: "",
    url: "",
  });
  const [savingResource, setSavingResource] = useState(false);

  // Reuse existing InteractiveElementEditor
  const [elementModal, setElementModal] = useState<
    | { mode: "create"; resource: Resource }
    | { mode: "edit"; resource: Resource; element: InteractiveElement }
    | null
  >(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [topicData, resourceList] = await Promise.all([
        getTopic(topicId),
        listResources(topicId),
      ]);
      setTopic(topicData);

      const list = Array.isArray(resourceList) ? resourceList : [];
      const withElements: ResourceWithElements[] = await Promise.all(
        list.map(async (r) => {
          try {
            const els = await listInteractiveElements(r.id);
            return { ...r, elements: Array.isArray(els) ? els : [] };
          } catch {
            return { ...r, elements: [] };
          }
        })
      );
      setResources(withElements);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to load topic"
      );
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (topicId) load();
  }, [topicId, load]);

  // ---------- Resources ----------

  function openCreateResource() {
    setEditingResource(null);
    setResourceForm({ uiType: "youtube", title: "", url: "" });
    setResourceModalOpen(true);
  }

  function openEditResource(r: Resource) {
    setEditingResource(r);
    setResourceForm({
      uiType: resourceTypeToUi(r.resourceType),
      title: r.title,
      url: r.urlOrPath,
    });
    setResourceModalOpen(true);
  }

  async function handleSaveResource() {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSavingResource(true);
    try {
      const payload = {
        title: resourceForm.title.trim(),
        resourceType: uiToResourceType(resourceForm.uiType),
        urlOrPath: resourceForm.url.trim(),
        dayNumber: 1,
        sortOrder: editingResource?.sortOrder ?? resources.length + 1,
      };
      if (editingResource) {
        await updateResource(editingResource.id, payload);
        toast.success("Resource updated");
      } else {
        await createResource(topicId, payload);
        toast.success("Resource added");
      }
      setResourceModalOpen(false);
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save resource"
      );
    } finally {
      setSavingResource(false);
    }
  }

  async function handleDeleteResource(r: Resource) {
    if (!confirm(`Delete resource “${r.title}”?`)) return;
    try {
      await deleteResource(r.id);
      toast.success("Resource deleted");
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete resource"
      );
    }
  }

  async function handleDeleteElement(el: InteractiveElement) {
    if (!confirm("Delete this interactive element?")) return;
    try {
      await deleteInteractiveElement(el.id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete"
      );
    }
  }

  if (loading) {
    return (
      <AdminShell
        title="Topic"
        subtitle="Arqademy"
        onLogout={() => (window.location.href = "/admin/login")}
      >
        <div className="max-w-6xl mx-auto text-[var(--ink-3)]">Loading…</div>
      </AdminShell>
    );
  }

  const topicTitle = topic?.title ?? "Topic";

  return (
    <AdminShell
      title="Topic"
      subtitle={`Arqademy • ${topicTitle}`}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Link
              href={`/admin/programmes/subjects/${subjectId}/topics`}
              className="text-[12px] font-bold text-[var(--brand)]"
            >
              ← Back to Topics
            </Link>
            <h1 className="text-4xl font-heading font-semibold tracking-[-0.04em] mt-2">
              {topicTitle}
            </h1>
            {topic?.description && (
              <p className="text-[var(--ink-3)] mt-1">{topic.description}</p>
            )}
          </div>
          <button
            onClick={openCreateResource}
            className="btn teal small flex items-center gap-2 rounded-[var(--r-card)]"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="text-[var(--ink-3)]">
            No resources yet.{" "}
            <button
              onClick={openCreateResource}
              className="text-[var(--brand)] font-bold"
            >
              Add the first one →
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {resources.map((r) => (
              <div key={r.id} className="card border border-[var(--line)] p-8">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {resourceIcon(r.resourceType)}
                    <div className="min-w-0">
                      <div className="font-semibold text-xl">{r.title}</div>
                      <div className="text-xs text-[var(--ink-3)] mt-1 truncate">
                        {r.resourceType.toUpperCase()} • {r.urlOrPath}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <button
                      onClick={() =>
                        setElementModal({ mode: "create", resource: r })
                      }
                      className="btn ghost small"
                    >
                      + Add interactive
                    </button>
                    <button
                      onClick={() => openEditResource(r)}
                      className="btn ghost small"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(r)}
                      className="btn ghost small text-[var(--warn)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {r.elements.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <div className="text-sm font-semibold text-[var(--brand)]">
                      Interactive elements ({r.elements.length})
                    </div>
                    {r.elements.map((el) => (
                      <div
                        key={el.id}
                        className="card border border-[var(--line)] p-4 flex items-center justify-between gap-4"
                      >
                        <button
                          type="button"
                          className="text-left min-w-0 flex-1"
                          onClick={() =>
                            setElementModal({
                              mode: "edit",
                              resource: r,
                              element: el,
                            })
                          }
                        >
                          <div className="font-medium text-sm">
                            {el.interactionType.replace(/_/g, " ")}
                          </div>
                          {el.interactionType === "interactive_video" && (
                            <div className="text-xs text-[var(--ink-3)]">
                              at {el.videoTimestampSeconds ?? 0}s
                              {el.pauseOnTrigger ? " · pauses" : ""}
                            </div>
                          )}
                        </button>
                        <div className="flex gap-2 flex-none">
                          <button
                            onClick={() =>
                              setElementModal({
                                mode: "edit",
                                resource: r,
                                element: el,
                              })
                            }
                            className="btn ghost small"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteElement(el)}
                            className="btn ghost small text-[var(--warn)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple resource modal only */}
      <Modal
        open={resourceModalOpen}
        onClose={() => !savingResource && setResourceModalOpen(false)}
        title={editingResource ? "Edit Resource" : "Add Resource"}
        footer={
          <>
            <button
              className="btn ghost small"
              onClick={() => setResourceModalOpen(false)}
              disabled={savingResource}
            >
              Cancel
            </button>
            <button
              className="btn teal small"
              onClick={handleSaveResource}
              disabled={savingResource}
            >
              {savingResource
                ? "Saving…"
                : editingResource
                ? "Save Changes"
                : "Add Resource"}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Type
            </label>
            <select
              value={resourceForm.uiType}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, uiType: e.target.value })
              }
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]"
              disabled={savingResource}
            >
              <option value="youtube">YouTube / Video</option>
              <option value="pdf">PDF Document</option>
              <option value="link">External Link</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              Title *
            </label>
            <input
              value={resourceForm.title}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, title: e.target.value })
              }
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
              placeholder="Introduction to Indices"
              disabled={savingResource}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider mb-2">
              URL *
            </label>
            <input
              value={resourceForm.url}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, url: e.target.value })
              }
              className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
              placeholder="https://youtube.com/watch?v=..."
              disabled={savingResource}
            />
          </div>
        </div>
      </Modal>

      {/* Existing editor — not extended, just used */}
      {elementModal && (
        <ProgrammeInteractiveEditor
          resourceId={elementModal.resource.id}
          resourceType={elementModal.resource.resourceType}
          element={elementModal.mode === "edit" ? elementModal.element : null}
          onClose={() => setElementModal(null)}
          onSaved={() => {
            setElementModal(null);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}