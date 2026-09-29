"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";

type SummarySection = { header: string; body: string };

export function SummaryFormatButton({ sections }: { sections: SummarySection[] }) {
  const [open, setOpen] = useState(false);
  if (sections.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-11 px-4 rounded-[10px] text-[13px] font-bold border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
      >
        <FileText className="w-4 h-4" />
        Summary guide
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] mx-0 sm:mx-4 rounded-t-[20px] sm:rounded-[20px] bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--line-soft)] flex-none">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--brand)]" />
                <h2 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                  Summary guide
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full grid place-items-center bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex-none"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-[12.5px] text-[var(--ink-3)] mb-4">
                Use this outline when writing today&apos;s summary note.
              </p>
              <ul className="space-y-3">
                {sections.map((sec, i) => (
                  <li
                    key={i}
                    className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3"
                  >
                    <div className="text-[13px] font-bold text-[var(--ink)]">{sec.header}</div>
                    {sec.body && (
                      <p className="mt-1 text-[12.5px] text-[var(--ink-3)] leading-relaxed">
                        {sec.body}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-none px-5 py-3 border-t border-[var(--line-soft)]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full h-11 rounded-[10px] text-[13px] font-bold bg-[var(--surface-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}