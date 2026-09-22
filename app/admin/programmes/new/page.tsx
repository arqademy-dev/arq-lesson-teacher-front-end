"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { createProgramme, ApiError } from "@/lib/api"; // adjust path if needed

export default function NewProgrammePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Programme name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const programme = await createProgramme({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
      });

      // Go to the new programme detail page
      router.push(`/admin/programmes/${programme.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell
      title="New Programme"
      subtitle="Arqademy"
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/programmes"
          className="text-[12px] font-bold text-[var(--brand)] mb-6 block"
        >
          ← Back to Programmes
        </Link>

        <div className="card p-10 border border-[var(--line)]">
          <h2 className="text-3xl font-heading mb-8">Create New Programme</h2>

          <div className="space-y-8">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider mb-2">
                Programme Name *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
                placeholder="University Pathway Programme"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider mb-2">
                Subtitle
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)]"
                placeholder="SS3 → University"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] resize-none"
                placeholder="Optional short description of this programme..."
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm font-medium text-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 rounded-[var(--r-card)]">
                {error}
              </div>
            )}

            <button
              className="w-full btn teal py-4 text-xl font-semibold disabled:opacity-60"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Programme"}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}