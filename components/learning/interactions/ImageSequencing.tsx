"use client";

import { useEffect, useState } from "react";
import type { ImageSequencingConfig, ImageSequencingAnswer } from "../types";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";

type Props = {
  config: ImageSequencingConfig;
  disabled?: boolean;
  onReady: (answer: ImageSequencingAnswer | null) => void;
};

export function ImageSequencing({ config, disabled, onReady }: Props) {
  const initial = (config.items || []).map((i) => i.id);
  const [order, setOrder] = useState<string[]>(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const byId = Object.fromEntries((config.items || []).map((i) => [i.id, i]));

  useEffect(() => {
    if (order.length === 0) {
      onReady(null);
      return;
    }
    onReady({ order });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  function move(from: number, to: number) {
    if (disabled || to < 0 || to >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {config.instructions && (
        <p className="text-[14px] text-[var(--ink)] font-semibold leading-relaxed">
          {config.instructions}
        </p>
      )}

      <div className="space-y-2" role="list">
        {order.map((id, index) => {
          const item = byId[id];
          if (!item) return null;
          return (
            <div
              key={id}
              role="listitem"
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex === null || dragIndex === index || disabled) return;
                move(dragIndex, index);
                setDragIndex(index);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-[12px] border-2 bg-[var(--surface)]",
                "transition-all duration-150",
                dragIndex === index
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] opacity-80"
                  : "border-[var(--line)] hover:border-[var(--ink-4)]",
                disabled && "opacity-70"
              )}
            >
              <GripVertical className="w-4 h-4 text-[var(--ink-4)] flex-none cursor-grab" />

              <span className="w-8 h-8 rounded-[9px] grid place-items-center flex-none text-[12px] font-bold bg-[var(--surface-3)] text-[var(--ink-3)]">
                {index + 1}
              </span>

              <span className="flex-1 text-[13.5px] font-semibold text-[var(--ink)] leading-snug">
                {item.text}
              </span>

              <div className="flex flex-col gap-0.5 flex-none">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  aria-label="Move up"
                  onClick={() => move(index, index - 1)}
                  className={cn(
                    "w-8 h-8 rounded-[8px] grid place-items-center border border-[var(--line)]",
                    "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:border-[var(--ink-4)]",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === order.length - 1}
                  aria-label="Move down"
                  onClick={() => move(index, index + 1)}
                  className={cn(
                    "w-8 h-8 rounded-[8px] grid place-items-center border border-[var(--line)]",
                    "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:border-[var(--ink-4)]",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px] text-[var(--ink-4)] font-semibold">
        Drag rows or use the arrows to set the order, then submit.
      </p>
    </div>
  );
}