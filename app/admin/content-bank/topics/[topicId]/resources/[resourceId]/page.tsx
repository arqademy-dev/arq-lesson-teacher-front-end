"use client";
// admin/content-bank/topics/[topicId]/resources/[resourceId]/page.tsx
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { ContentBlockEditor } from "@/components/admin/content-bank/ContentBlockEditor";
import { InteractiveElementEditor } from "@/components/admin/content-bank/InteractiveElementEditor";
import {
  getResource,
  updateResource,
  deleteResource,
  listInteractiveElements,
  deleteInteractiveElement,
  type Resource,
  type ResourceType,
  type InteractiveElement,
  ApiError,
} from "@/lib/api";
import { Loader2, ArrowLeft, Trash2, Plus, FileEdit } from "lucide-react";

const RESOURCE_TYPES: ResourceType[] = [
  "video",
  "pdf",
  "article",
  "image",
  "interactive",
  "quiz",
];

export default function AdminResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = String(params.topicId || "");
  const resourceId = String(params.resourceId || "");

  const [resource, setResource] = useState<Resource | null>(null);
  const [elements, setElements] = useState<InteractiveElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("article");
  const [urlOrPath, setUrlOrPath] = useState("");
  const [dayNumber, setDayNumber] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);

  const [showContentEditor, setShowContentEditor] = useState(false);
  const [elementModal, setElementModal] = useState<
    { mode: "create" } | { mode: "edit"; element: InteractiveElement } | null
  >(null);

  const load = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    setError(null);
    try {
      const [r, els] = await Promise.all([
        getResource(resourceId),
        listInteractiveElements(resourceId),
      ]);
      setResource(r);
      setTitle(r.title);
      setResourceType(r.resourceType);
      setUrlOrPath(r.urlOrPath);
      setDayNumber(r.dayNumber);
      setSortOrder(r.sortOrder);
      setElements(Array.isArray(els) ? els : []);
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
  }, [resourceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateResource(resourceId, {
        title: title.trim(),
        resourceType,
        urlOrPath: urlOrPath.trim(),
        dayNumber,
        sortOrder,
      });
      setResource(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeResource() {
    if (!confirm("Delete this resource and its interactive elements?")) return;
    try {
      await deleteResource(resourceId);
      router.push(`/admin/content-bank/topics/${topicId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function removeElement(id: string) {
    if (!confirm("Delete this interactive element?")) return;
    try {
      await deleteInteractiveElement(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell
      title={resource?.title ?? "Resource"}
      subtitle="Content bank"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <Link
        href={`/admin/content-bank/topics/${topicId}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to topic resources
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

      {!loading && !error && resource && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Meta */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-4">
            <p className="font-heading text-[13px] font-semibold mb-3">
              Resource details
            </p>
            <form onSubmit={saveMeta} className="grid gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  Type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceType)}
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                >
                  {RESOURCE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  URL / path {resourceType === "article" && "(slug or reference)"}
                </label>
                <input
                  value={urlOrPath}
                  onChange={(e) => setUrlOrPath(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                    Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                    Sort order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={removeResource}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[12.5px] font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete resource
                </button>
              </div>
            </form>

            {resourceType === "article" && (
              <div className="mt-4 pt-4 border-t border-[var(--line-soft)]">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] text-[var(--ink-2)]">
                    {(resource.contentBody?.length ?? 0)} content block
                    {(resource.contentBody?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowContentEditor(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-bold border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    Edit content
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Interactive elements */}
          <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line-soft)]">
              <p className="font-heading text-[13px] font-semibold">
                Interactive elements
              </p>
              <button
                type="button"
                onClick={() => setElementModal({ mode: "create" })}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-bold bg-[var(--brand)] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {elements.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-[var(--ink-3)]">
                No interactive elements on this resource yet.
              </p>
            ) : (
              <ul>
                {elements.map((el) => (
                  <li
                    key={el.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line-soft)] last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => setElementModal({ mode: "edit", element: el })}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="font-bold text-[13px] text-[var(--ink)]">
                        {el.interactionType}
                      </div>
                      {el.interactionType === "interactive_video" && (
                        <div className="text-[11px] text-[var(--ink-3)]">
                          at {el.videoTimestampSeconds ?? 0}s
                          {el.pauseOnTrigger ? " · pauses playback" : ""}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeElement(el.id)}
                      className="p-1.5 text-[var(--danger)]"
                      title="Delete interactive element"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {showContentEditor && resource && (
        <ContentBlockEditor
          resourceId={resourceId}
          initialBlocks={resource.contentBody ?? []}
          onClose={() => setShowContentEditor(false)}
          onSaved={(blocks) => {
            setResource((prev) => (prev ? { ...prev, contentBody: blocks } : prev));
            setShowContentEditor(false);
          }}
        />
      )}

      {elementModal && (
        <InteractiveElementEditor
          resourceId={resourceId}
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