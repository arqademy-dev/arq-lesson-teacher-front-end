"use client";
// admin/content-bank/topics/[topicId]/page.tsx
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  getTopic,
  listResources,
  createResource,
  deleteResource,
  type Resource,
  type ResourceType,
  ApiError,
} from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Video,
  Image as ImageIcon,
  FileQuestion,
  MousePointerClick,
  File as FileIcon,
} from "lucide-react";

const RESOURCE_TYPES: ResourceType[] = [
  "video",
  "pdf",
  "article",
  "image",
  "interactive",
  "quiz",
];

const TYPE_ICON: Record<ResourceType, typeof FileText> = {
  video: Video,
  pdf: FileIcon,
  article: FileText,
  image: ImageIcon,
  interactive: MousePointerClick,
  quiz: FileQuestion,
};

export default function AdminTopicResourcesPage() {
  const params = useParams();
  const topicId = String(params.topicId || "");

  const [topic, setTopic] = useState<Record<string, unknown> | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("article");
  const [urlOrPath, setUrlOrPath] = useState("");
  const [dayNumber, setDayNumber] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);

  const load = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, r] = await Promise.all([
        getTopic(topicId),
        listResources(topicId),
      ]);
      setTopic(t as Record<string, unknown>);
      setResources(Array.isArray(r) ? r : []);
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
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  // Grouped by dayNumber, days ascending, each day's resources by sortOrder.
  const byDay = resources.reduce<Map<number, Resource[]>>((acc, r) => {
    const list = acc.get(r.dayNumber) ?? [];
    list.push(r);
    acc.set(r.dayNumber, list);
    return acc;
  }, new Map());
  for (const list of byDay.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const days = Array.from(byDay.keys()).sort((a, b) => a - b);

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !urlOrPath.trim()) return;
    setCreating(true);
    try {
      await createResource(topicId, {
        title: title.trim(),
        resourceType,
        urlOrPath: urlOrPath.trim(),
        dayNumber: dayNumber || 1,
        sortOrder: sortOrder || 1,
      });
      setTitle("");
      setUrlOrPath("");
      setDayNumber(1);
      setSortOrder((byDay.get(dayNumber)?.length ?? 0) + 2);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function removeResource(id: string) {
    if (!confirm("Delete resource? This also removes its interactive elements."))
      return;
    try {
      await deleteResource(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell
      title={String(topic?.title ?? "Topic")}
      subtitle="Content bank"
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      <Link
        href="/admin/content-bank"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Subjects / Classes / Topics
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

      {!loading && !error && (
        <>
          <form
            onSubmit={addResource}
            className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr_0.7fr_0.7fr_auto]"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              className="h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
            />
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as ResourceType)}
              className="h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
            >
              {RESOURCE_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
            <input
              value={urlOrPath}
              onChange={(e) => setUrlOrPath(e.target.value)}
              placeholder={
                resourceType === "article"
                  ? "Slug or reference (body added after creation)"
                  : "URL or file path"
              }
              className="h-10 px-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
            />
            <input
              type="number"
              min={1}
              value={dayNumber}
              onChange={(e) => setDayNumber(Number(e.target.value))}
              title="Day number"
              placeholder="Day"
              className="h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
            />
            <input
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              title="Sort order"
              placeholder="Order"
              className="h-10 px-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px]"
            />
            <button
              type="submit"
              disabled={creating || !title.trim() || !urlOrPath.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </form>

          {days.length === 0 ? (
            <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-5 py-10 text-center text-[13px] text-[var(--ink-3)] shadow-[var(--shadow-sm)]">
              No resources yet for this topic.
            </div>
          ) : (
            <div className="space-y-5">
              {days.map((day) => (
                <section
                  key={day}
                  className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-[var(--line-soft)] bg-[var(--surface-2)]">
                    <p className="font-heading text-[12.5px] font-semibold">
                      Day {day}
                    </p>
                  </div>
                  <ul>
                    {(byDay.get(day) ?? []).map((r) => {
                      const Icon = TYPE_ICON[r.resourceType] ?? FileText;
                      return (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                        >
                          <Icon className="w-4 h-4 text-[var(--ink-4)] flex-none" />
                          <Link
                            href={`/admin/content-bank/topics/${topicId}/resources/${r.id}`}
                            className="flex-1 min-w-0"
                          >
                            <div className="font-bold text-[13px] text-[var(--ink)] truncate">
                              {r.title}
                            </div>
                            <div className="text-[11px] text-[var(--ink-3)]">
                              {r.resourceType} · order {r.sortOrder}
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeResource(r.id)}
                            className="p-1.5 text-[var(--danger)]"
                            title="Delete resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}