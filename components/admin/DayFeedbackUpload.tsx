"use client";

import { useState } from "react";
import { Upload, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { uploadAndAttachAdminDailyFile, type AdminDailySubmissionFile } from "@/lib/api";

function isImage(contentType: string | null) {
  return !!contentType && contentType.startsWith("image/");
}

type Props = {
  studentId: string;
  learningPlanId: string;
  date: string; // YYYY-MM-DD
  existing: AdminDailySubmissionFile[];
  onAttached: (adminFiles: AdminDailySubmissionFile[]) => void;
};

/** Drop into the admin Assessments page, one per expanded day. */
export function DayFeedbackUpload({ studentId, learningPlanId, date, existing, onAttached }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const day = await uploadAndAttachAdminDailyFile(studentId, learningPlanId, date, file);
      onAttached(day.adminFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {existing.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {existing.map((f) => (
            <a
              key={f.id}
              href={f.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] font-semibold text-[var(--brand)] hover:underline"
            >
              {isImage(f.contentType) ? (
                <ImageIcon className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {f.fileName}
            </a>
          ))}
        </div>
      )}

      <label className="inline-flex items-center gap-2 h-9 px-3 rounded-[8px] text-[12px] font-bold border border-[var(--line)] bg-[var(--surface)] cursor-pointer hover:border-[var(--brand)]">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? "Uploading…" : "Attach report"}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="text-[11px] font-semibold text-[var(--danger)]">{error}</p>}
    </div>
  );
}