"use client";

import { FileText, Image as ImageIcon, Download } from "lucide-react";
import type { AdminDailySubmissionFile } from "@/lib/api";

function isImage(contentType: string | null) {
  return !!contentType && contentType.startsWith("image/");
}

/** Drop into the student's day-review page: <AdminReportCard files={day.adminFiles} /> */
export function AdminReportCard({ files }: { files: AdminDailySubmissionFile[] }) {
  if (files.length === 0) return null;

  return (
    <section className="rounded-[var(--r-card)] border border-[var(--brand)] bg-[var(--brand-soft)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[var(--brand)]" />
        <h2 className="font-heading text-[15px] font-semibold text-[var(--ink)]">
          Report from your educator
        </h2>
      </div>

      <div className="space-y-2">
        {files.map((f) => (
          <a
            key={f.id}
            href={f.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--brand)] transition-colors"
          >
            <span className="flex-none w-9 h-9 rounded-[8px] grid place-items-center bg-[var(--surface-3)] text-[var(--brand)]">
              {isImage(f.contentType) ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-bold text-[var(--ink)] truncate">
              {f.fileName}
            </span>
            <Download className="w-4 h-4 text-[var(--ink-3)] flex-none" />
          </a>
        ))}
      </div>
    </section>
  );
}