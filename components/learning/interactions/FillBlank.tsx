"use client";

import { useEffect, useState } from "react";
import type { FillBlankConfig, FillBlankAnswer } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  config: FillBlankConfig;
  disabled?: boolean;
  onReady: (answer: FillBlankAnswer | null) => void;
};

export function FillBlank({ config, disabled, onReady }: Props) {
  const blanks = Object.keys(config.dropdown_options || {});
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(blanks.map((k) => [k, ""]))
  );

  useEffect(() => {
    const complete = blanks.length > 0 && blanks.every((b) => values[b]);
    onReady(complete ? values : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  function setBlank(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const parts = splitPrompt(config.prompt_text || "", blanks);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-4",
          "text-[15px] leading-[1.85] text-[var(--ink)] font-semibold"
        )}
      >
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2.5">
          {parts.map((part, i) =>
            part.type === "text" ? (
              <span key={i}>{part.value}</span>
            ) : (
              <label key={i} className="inline-flex items-center">
                <span className="sr-only">Choose for {part.value}</span>
                <select
                  disabled={disabled}
                  value={values[part.value] || ""}
                  onChange={(e) => setBlank(part.value, e.target.value)}
                  aria-label={`Blank ${part.value}`}
                  className={cn(
                    "h-10 min-w-[140px] px-3 rounded-[10px] text-[13.5px] font-bold appearance-none",
                    "bg-[var(--surface)] border-2 text-[var(--ink)] cursor-pointer",
                    "transition-[border-color,box-shadow] duration-150",
                    values[part.value]
                      ? "border-[var(--brand)] shadow-[0_0_0_3px_var(--brand-soft)]"
                      : "border-[var(--line)] hover:border-[var(--ink-4)]",
                    "focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]",
                    disabled && "opacity-60 cursor-not-allowed"
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237C89A3' stroke-width='2.2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "14px",
                    paddingRight: "32px",
                  }}
                >
                  <option value="">Select…</option>
                  {(config.dropdown_options[part.value] || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            )
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
        Fill every blank, then submit.
      </p>
    </div>
  );
}

function splitPrompt(
  prompt: string,
  blanks: string[]
): Array<{ type: "text" | "blank"; value: string }> {
  const re = /\[(blank\d+)\]/gi;
  const out: Array<{ type: "text" | "blank"; value: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt))) {
    if (m.index > last) {
      out.push({ type: "text", value: prompt.slice(last, m.index) });
    }
    const key = m[1].toLowerCase();
    out.push({
      type: blanks.includes(key) ? "blank" : "text",
      value: blanks.includes(key) ? key : m[0],
    });
    last = m.index + m[0].length;
  }
  if (last < prompt.length) {
    out.push({ type: "text", value: prompt.slice(last) });
  }
  return out;
}