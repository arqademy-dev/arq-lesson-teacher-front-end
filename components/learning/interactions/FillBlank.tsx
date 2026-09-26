"use client";

import { useEffect, useMemo, useState } from "react";
import type { FillBlankConfig, FillBlankAnswer } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  config: FillBlankConfig;
  disabled?: boolean;
  /** Restore after refresh */
  initialAnswer?: FillBlankAnswer | null;
  onReady: (answer: FillBlankAnswer | null) => void;
};

/** Extract [key] tokens in order, unique */
function extractBlankKeys(promptText: string): string[] {
  if (typeof promptText !== "string") return [];
  const matches = promptText.match(/\[([^\]]+)\]/g) ?? [];
  const keys = matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  return Array.from(new Set(keys));
}

/**
 * Backend-friendly fill-blank:
 * - prompt_text with [anyKey] tokens (not only blank1)
 * - dropdown_options[key] → select
 * - otherwise → free-text input (matches acceptedAnswers grading)
 * - if no [keys] but prompt has ___, treat as single blank "answer"
 */
export function FillBlank({
  config,
  disabled,
  initialAnswer,
  onReady,
}: Props) {
  const prompt = config.prompt_text || "";

  const blanks = useMemo(() => {
    const keys = extractBlankKeys(prompt);
    if (keys.length > 0) return keys;
    // No [tokens]: single free-text blank (bank-style sentence with ___)
    if (prompt.trim()) return ["answer"];
    return [];
  }, [prompt]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries(blanks.map((k) => [k, ""]));
    if (initialAnswer) {
      for (const k of blanks) {
        if (typeof initialAnswer[k] === "string") base[k] = initialAnswer[k];
      }
    }
    return base;
  });

  // Reset when prompt/blanks change
  useEffect(() => {
    setValues((prev) => {
      const next = Object.fromEntries(blanks.map((k) => [k, prev[k] ?? ""]));
      if (initialAnswer) {
        for (const k of blanks) {
          if (typeof initialAnswer[k] === "string") next[k] = initialAnswer[k];
        }
      }
      return next;
    });
  }, [blanks.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const complete =
      blanks.length > 0 && blanks.every((b) => (values[b] ?? "").trim().length > 0);
    onReady(complete ? { ...values } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, blanks.join("|")]);

  function setBlank(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const parts = useMemo(() => splitPrompt(prompt, blanks), [prompt, blanks]);

  if (blanks.length === 0) {
    return (
      <p className="text-[13px] text-[var(--ink-3)]">
        This fill-blank has no prompt yet.
      </p>
    );
  }

  // No [tokens]: show prompt + one text field
  const singleFieldOnly =
    blanks.length === 1 && blanks[0] === "answer" && !/\[[^\]]+\]/.test(prompt);

  return (
    <div className="space-y-4">
      {singleFieldOnly ? (
        <>
          <p className="text-[15px] leading-relaxed font-semibold text-[var(--ink)]">
            {prompt}
          </p>
          <input
            type="text"
            disabled={disabled}
            value={values.answer || ""}
            onChange={(e) => setBlank("answer", e.target.value)}
            placeholder="Type your answer…"
            className={inputClass(!!values.answer)}
          />
        </>
      ) : (
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
                <BlankControl
                  key={i}
                  blankKey={part.value}
                  value={values[part.value] || ""}
                  options={config.dropdown_options?.[part.value]}
                  disabled={disabled}
                  onChange={(v) => setBlank(part.value, v)}
                />
              )
            )}
          </div>
        </div>
      )}

      <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
        {blanks.length > 1
          ? "Fill every blank, then submit."
          : "Enter your answer, then submit."}
      </p>
    </div>
  );
}

function BlankControl({
  blankKey,
  value,
  options,
  disabled,
  onChange,
}: {
  blankKey: string;
  value: string;
  options?: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  if (options && options.length > 0) {
    return (
      <label className="inline-flex items-center">
        <span className="sr-only">Choose for {blankKey}</span>
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass(!!value)}
          style={selectChevronStyle}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={blankKey}
      aria-label={`Blank ${blankKey}`}
      className={cn(inputClass(!!value), "inline-flex min-w-[120px] max-w-[200px] h-10")}
    />
  );
}

function splitPrompt(
  prompt: string,
  blanks: string[]
): Array<{ type: "text" | "blank"; value: string }> {
  if (!prompt || blanks.length === 0 || blanks[0] === "answer") {
    return [{ type: "text", value: prompt }];
  }

  const re = /\[([^\]]+)\]/g;
  const out: Array<{ type: "text" | "blank"; value: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const blankSet = new Set(blanks);

  while ((m = re.exec(prompt))) {
    if (m.index > last) {
      out.push({ type: "text", value: prompt.slice(last, m.index) });
    }
    const key = m[1].trim();
    out.push({
      type: blankSet.has(key) ? "blank" : "text",
      value: blankSet.has(key) ? key : m[0],
    });
    last = m.index + m[0].length;
  }
  if (last < prompt.length) {
    out.push({ type: "text", value: prompt.slice(last) });
  }
  return out;
}

function inputClass(filled: boolean) {
  return cn(
    "w-full h-10 px-3 rounded-[10px] text-[13.5px] font-bold",
    "bg-[var(--surface)] border-2 text-[var(--ink)]",
    "focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]",
    filled
      ? "border-[var(--brand)] shadow-[0_0_0_3px_var(--brand-soft)]"
      : "border-[var(--line)]"
  );
}

function selectClass(filled: boolean) {
  return cn(
    "h-10 min-w-[140px] px-3 rounded-[10px] text-[13.5px] font-bold appearance-none",
    "bg-[var(--surface)] border-2 text-[var(--ink)] cursor-pointer",
    "focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]",
    filled
      ? "border-[var(--brand)] shadow-[0_0_0_3px_var(--brand-soft)]"
      : "border-[var(--line)] hover:border-[var(--ink-4)]"
  );
}

const selectChevronStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237C89A3' stroke-width='2.2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "14px",
  paddingRight: "32px",
};