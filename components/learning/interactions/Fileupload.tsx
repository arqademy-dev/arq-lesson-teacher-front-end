"use client";

import { useRef, useState } from "react";
import { getStudentBatchPresignedUploadUrls, ApiError } from "@/lib/api";
import type { FileUploadConfig, InteractionAnswer } from "../types";
import { Loader2, UploadCloud, FileCheck2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  config: FileUploadConfig;
  disabled?: boolean;
  /** Restored on refresh — { fileUrl?, fileUrls?, textNote? } from the last submission */
  initialAnswer?: Record<string, unknown> | null;
  onReady: (answer: InteractionAnswer) => void;
};

type UploadedFile = { url: string; name: string };

function restoreInitialFiles(
  initialAnswer: Record<string, unknown> | null | undefined
): UploadedFile[] {
  if (!initialAnswer) return [];
  const urls = initialAnswer.fileUrls as string[] | undefined;
  if (Array.isArray(urls) && urls.length > 0) {
    return urls.map((url, i) => ({ url, name: `File ${i + 1}` }));
  }
  const single = initialAnswer.fileUrl as string | undefined;
  if (single) return [{ url: single, name: "Uploaded file" }];
  return [];
}

export function FileUpload({ config, disabled, initialAnswer, onReady }: Props) {
  const allowFile = config.allowFile !== false;
  const allowText = config.allowText !== false;
  const maxFiles = Math.max(1, (config as any).maxFiles ?? 1);
  const multiple = maxFiles > 1;

  const [files, setFiles] = useState<UploadedFile[]>(() =>
    restoreInitialFiles(initialAnswer)
  );
  const [textNote, setTextNote] = useState<string>(
    (initialAnswer?.textNote as string) ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function emit(nextFiles: UploadedFile[], nextText: string) {
    const trimmed = nextText.trim();
    const urls = nextFiles.map((f) => f.url);
    if (urls.length === 0 && !trimmed) return;

    if (multiple) {
      onReady({
        fileUrls: urls.length ? urls : undefined,
        textNote: trimmed || undefined,
      });
    } else {
      onReady({
        fileUrl: urls[0] ?? undefined,
        textNote: trimmed || undefined,
      });
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      setError(
        `You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const toUpload = selected.slice(0, remaining);
    setError(null);
    setUploading(true);
    try {
      const { files: presigned } = await getStudentBatchPresignedUploadUrls(
        toUpload.map((f) => ({
          fileName: f.name,
          contentType: f.type || "application/octet-stream",
        }))
      );

      const uploaded = await Promise.all(
        toUpload.map(async (file, i) => {
          const { uploadUrl, publicUrl } = presigned[i];
          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!putRes.ok) {
            throw new Error(`Upload failed for ${file.name}. Try again.`);
          }
          return { url: publicUrl, name: file.name } as UploadedFile;
        })
      );

      const next = [...files, ...uploaded];
      setFiles(next);
      emit(next, textNote);
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

  function removeFile(url: string) {
    const next = files.filter((f) => f.url !== url);
    setFiles(next);
    emit(next, textNote);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setTextNote(val);
    emit(files, val);
  }

  const atCap = files.length >= maxFiles;

  return (
    <div className="space-y-4">
      {config.instructions && (
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">
          {config.instructions}
        </p>
      )}

      {allowFile && (
        <div className="space-y-2">
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li
                  key={f.url}
                  className="flex items-center gap-3 rounded-[12px] border border-[var(--ok)] bg-[var(--ok-soft)] px-4 py-3"
                >
                  <FileCheck2 className="w-5 h-5 text-[var(--ok)] flex-none" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[var(--ok)] truncate">
                      {f.name}
                    </p>
                    <a
                      href={f.url}
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
                      onClick={() => removeFile(f.url)}
                      className="text-[var(--ok)] hover:opacity-70 flex-none"
                      title="Remove this file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!atCap && (
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
                multiple={multiple}
                className="hidden"
                disabled={disabled || uploading}
                onChange={handleFilesSelected}
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
                    Tap to upload {multiple ? "photos or files" : "a photo or file"}
                  </span>
                  <span className="text-[11px] text-[var(--ink-4)]">
                    Images, PDF, or Word doc
                    {multiple && ` · up to ${maxFiles} files (${files.length}/${maxFiles})`}
                  </span>
                </>
              )}
            </label>
          )}

          {atCap && (
            <p className="text-[11px] font-semibold text-[var(--ink-4)]">
              Maximum of {maxFiles} file{maxFiles === 1 ? "" : "s"} reached.
              {!disabled && " Remove one to upload a different file."}
            </p>
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