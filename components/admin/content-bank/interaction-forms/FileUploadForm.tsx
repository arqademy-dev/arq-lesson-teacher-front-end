"use client";
// components/admin/content-bank/interaction-forms/FileUploadForm.tsx
import type { FileUploadAnswers, FileUploadConfig } from "./types";

type Props = {
  config: FileUploadConfig;
  answers: FileUploadAnswers;
  onChange: (config: FileUploadConfig, answers: FileUploadAnswers) => void;
};

export function FileUploadForm({ config, answers, onChange }: Props) {
  const allowFile = config.allowFile !== false;
  const allowText = config.allowText !== false;
  const neitherAllowed = !allowFile && !allowText;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--ink-3)]">
        Submissions are reviewed by an educator, not auto-graded — there's no
        correct answer to mark, just optional notes for the reviewer.
      </p>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Instructions shown to the student
        </label>
        <textarea
          value={config.instructions ?? ""}
          onChange={(e) => onChange({ ...config, instructions: e.target.value }, answers)}
          rows={2}
          placeholder="e.g. Photograph your working-out and upload it here"
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={allowFile}
            onChange={(e) => onChange({ ...config, allowFile: e.target.checked }, answers)}
          />
          Allow file upload
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={allowText}
            onChange={(e) => onChange({ ...config, allowText: e.target.checked }, answers)}
          />
          Allow text note
        </label>
      </div>

      {neitherAllowed && (
        <p className="text-[12px] font-semibold text-[var(--danger)]">
          Enable at least one of file upload or text note.
        </p>
      )}

      {allowFile && (
        <div>
          <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
            Max files
          </label>
          <input
            type="number"
            min={1}
            value={config.maxFiles ?? 1}
            onChange={(e) => onChange({ ...config, maxFiles: Number(e.target.value) }, answers)}
            className="w-20 h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Grading notes (admin-only, not shown to students)
        </label>
        <textarea
          value={answers.gradingNotes ?? ""}
          onChange={(e) => onChange(config, { ...answers, gradingNotes: e.target.value })}
          rows={2}
          placeholder="What the reviewer should look for"
          className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>
    </div>
  );
}