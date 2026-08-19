"use client";

import { useRef, useState } from "react";
import { getStudentPresignedUploadUrl, ApiError } from "@/lib/api";
import type { FileUploadConfig, InteractionAnswer } from "../types";
import { Loader2, UploadCloud, FileCheck2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  config: FileUploadConfig;
  disabled?: boolean;
  /** Restored on refresh — { fileUrl?, textNote? } from the student's last submission */
  initialAnswer?: Record<string, unknown> | null;
  onReady: (answer: InteractionAnswer) => void;
};

export function FileUpload({ config, disabled, initialAnswer, onReady }: Props) {
  const allowFile = config.allowFile !== false;
  const allowText = config.allowText !== false;

  const [fileUrl, setFileUrl] = useState<string | null>(
    (initialAnswer?.fileUrl as string) ?? null
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [textNote, setTextNote] = useState<string>(
    (initialAnswer?.textNote as string) ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function emit(nextFileUrl: string | null, nextText: string) {
    const trimmed = nextText.trim();
    if (nextFileUrl || trimmed) {
      onReady({
        fileUrl: nextFileUrl ?? undefined,
        textNote: trimmed || undefined,
      });
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await getStudentPresignedUploadUrl(
        file.name,
        file.type || "application/octet-stream"
      );

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed. Please try again.");

      setFileUrl(publicUrl);
      setFileName(file.name);
      emit(publicUrl, textNote);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not upload file"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clearFile() {
    setFileUrl(null);
    setFileName(null);
    emit(null, textNote);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setTextNote(val);
    emit(fileUrl, val);
  }

  return (
    <div className="space-y-4">
      {config.instructions && (
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">
          {config.instructions}
        </p>
      )}

      {allowFile && (
        <div>
          {!fileUrl ? (
            <label
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed px-4 py-8 text-center transition-colors",
                disabled || uploading
                  ? "border-[var(--line)] bg-[var(--surface-2)] cursor-not-allowed opacity-70"
                  : "border-[var(--line)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] cursor-pointer"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                disabled={disabled || uploading}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" />
                  <span className="text-[12.5px] font-bold text-[var(--ink-2)]">
                    Uploading…
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-[var(--ink-3)]" />
                  <span className="text-[12.5px] font-bold text-[var(--ink-2)]">
                    Tap to upload a photo or file
                  </span>
                  <span className="text-[11px] text-[var(--ink-4)]">
                    Images, PDF, or Word doc
                  </span>
                </>
              )}
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-[12px] border border-[var(--ok)] bg-[var(--ok-soft)] px-4 py-3">
              <FileCheck2 className="w-5 h-5 text-[var(--ok)] flex-none" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-[var(--ok)] truncate">
                  {fileName || "File uploaded"}
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[var(--ok)] underline"
                >
                  View upload
                </a>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-[var(--ok)] hover:opacity-70 flex-none"
                  title="Remove and upload a different file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {allowText && (
        <label className="block text-[11px] font-bold text-[var(--ink-3)]">
          {allowFile ? "Notes for your educator (optional)" : "Your answer"}
          <textarea
            value={textNote}
            disabled={disabled}
            onChange={handleTextChange}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] text-[13px] text-[var(--ink)] disabled:opacity-60"
            placeholder="Add any notes about your work…"
          />
        </label>
      )}

      {error && (
        <p className="text-[12px] font-semibold text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}