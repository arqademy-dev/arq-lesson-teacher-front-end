"use client";

import { useState } from "react";
import type { BranchingConfig, BranchingAnswer } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  config: BranchingConfig;
  disabled?: boolean;
  onReady: (answer: BranchingAnswer | null) => void;
};

export function Branching({ config, disabled, onReady }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function pick(id: string) {
    if (disabled) return;
    setSelected(id);
    onReady({ answer: id });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3.5">
        <p className="text-[14.5px] text-[var(--ink)] font-semibold leading-relaxed">
          {config.scenario}
        </p>
      </div>

      <div className="space-y-2.5" role="radiogroup" aria-label="Choose an answer">
        {(config.choices || []).map((choice, i) => {
          const active = selected === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => pick(choice.id)}
              className={cn(
                "w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-[12px] border-2",
                "text-[14px] font-semibold transition-all duration-150",
                "active:scale-[0.99]",
                active
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] shadow-[0_0_0_3px_var(--brand-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--ink-4)] hover:bg-[var(--surface-2)]",
                disabled && "opacity-70 cursor-not-allowed active:scale-100"
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-[9px] grid place-items-center flex-none text-[12px] font-bold",
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-snug">{choice.text}</span>
              <span
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex-none grid place-items-center",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand)]"
                    : "border-[var(--ink-4)]"
                )}
              >
                {active && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}