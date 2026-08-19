"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentFileHistory,
  ApiError,
  type FileHistoryTopicGroup,
  type FileHistoryFile,
} from "@/lib/api";
import { ArrowLeft, FileText, FolderOpen, Loader2 } from "lucide-react";

export default function StudentFileHistoryPage() {
  const [groups, setGroups] = useState<FileHistoryTopicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudentFileHistory()
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Not authenticated. Please log in again.");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load file history"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const totalFiles = groups.reduce(
    (n, g) => n + g.sessions.reduce((m, s) => m + s.files.length, 0),
    0
  );

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px]">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">
          ARQADEMY · My submissions
        </span>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-2">
          File history
        </p>
        <h1 className="font-heading text-[22px] text-[var(--ink)]">
          Your uploaded work
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--ink-3)]">
          Everything you&apos;ve submitted, grouped by topic and session.
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-[var(--ink-3)] text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your submissions…
          </div>
        )}

        {error && (
          <div className="mt-8 space-y-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-[13px] text-[var(--danger)] font-semibold">
              {error}
            </p>
            <Link
              href="/students/login"
              className="inline-flex text-[12.5px] font-bold text-[var(--brand)]"
            >
              Go to student login →
            </Link>
          </div>
        )}

        {!loading && !error && (
          <>
            {totalFiles === 0 ? (
              <div className="mt-10 rounded-[var(--r-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-14 text-center">
                <FolderOpen className="w-10 h-10 text-[var(--ink-4)] mx-auto mb-3" />
                <p className="text-[13px] text-[var(--ink-3)]">
                  You haven&apos;t submitted any work yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {groups.map((group) => (
                  <TopicGroup
                    key={group.topicId ?? "unknown"}
                    group={group}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TopicGroup({ group }: { group: FileHistoryTopicGroup }) {
  const fileCount = group.sessions.reduce((n, s) => n + s.files.length, 0);

  return (
    <section className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading text-[14px] font-semibold text-[var(--ink)]">
          {group.topicTitle ?? "Untitled topic"}
        </h2>
        <span className="text-[11px] font-bold text-[var(--ink-3)]">
          {fileCount} file{fileCount === 1 ? "" : "s"}
        </span>
      </div>

      <div>
        {group.sessions.map((session) => (
          <div
            key={session.sessionId ?? Math.random()}
            className="border-b border-[var(--line-soft)] last:border-0"
          >
            <div className="px-5 py-2.5 bg-[var(--surface-2)] flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-bold text-[var(--ink-2)]">
                {session.sessionDayNumber != null
                  ? `Day ${session.sessionDayNumber}`
                  : "Session"}
              </span>
              {session.scheduledDate && (
                <span className="text-[11px] text-[var(--ink-4)] font-semibold">
                  · {session.scheduledDate}
                </span>
              )}
            </div>
            <div className="px-5 py-3 space-y-3">
              {session.files.map((file) => (
                <FileEntry key={file.id} file={file} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FileEntry({ file }: { file: FileHistoryFile }) {
  const resp = file.response as {
    fileUrl?: string;
    fileUrls?: string[];
    textNote?: string;
  };
  const urls =
    resp.fileUrls && resp.fileUrls.length > 0
      ? resp.fileUrls
      : resp.fileUrl
        ? [resp.fileUrl]
        : [];

  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink)]">
          <FileText className="w-3.5 h-3.5 text-[var(--ink-4)]" />
          {file.resourceTitle ?? "Submission"}
        </span>
        <span className="text-[10.5px] text-[var(--ink-4)] font-semibold">
          {new Date(file.submittedAt).toLocaleString()}
        </span>
      </div>

      {urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] font-bold text-[var(--brand)] hover:underline"
            >
              File {i + 1} →
            </a>
          ))}
        </div>
      )}

      {resp.textNote && (
        <p className="mt-2 text-[12px] text-[var(--ink-2)] leading-relaxed">
          {resp.textNote}
        </p>
      )}

      <p className="mt-1.5 text-[10px] text-[var(--ink-4)] font-semibold">
        Attempt #{file.attemptNumber}
      </p>
    </div>
  );
}