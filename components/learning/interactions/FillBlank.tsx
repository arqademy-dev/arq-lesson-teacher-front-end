"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type FillBlankConfig = {
  prompt_text?: string;
};

type Props = {
  config: FillBlankConfig;
  disabled?: boolean;
  initialAnswer?: { answer?: string } | null;
  onReady: (answer: { answer: string } | null) => void;
};

export function FillBlank({ config, disabled, initialAnswer, onReady }: Props) {
  const [value, setValue] = useState(initialAnswer?.answer ?? "");

  useEffect(() => {
    setValue(initialAnswer?.answer ?? "");
  }, [initialAnswer?.answer]);

  useEffect(() => {
    const trimmed = value.trim();
    onReady(trimmed ? { answer: trimmed } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed font-semibold text-[var(--ink)]">
        {config.prompt_text || "Fill in the blank"}
      </p>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer…"
        className={cn(
          "w-full h-11 px-4 rounded-[10px] text-[14px] font-semibold",
          "bg-[var(--surface)] border-2 text-[var(--ink)]",
          "focus:outline-none focus:border-[var(--brand)]",
          value.trim()
            ? "border-[var(--brand)]"
            : "border-[var(--line)]",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      />
      <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
        Enter your answer, then submit.
      </p>
    </div>
  );
}