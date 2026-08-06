"use client";

import { useEffect, useState } from "react";
import type { HotspotConfig, HotspotAnswer } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  config: HotspotConfig;
  disabled?: boolean;
  onReady: (answer: HotspotAnswer | null) => void;
};

export function Hotspot({ config, disabled, onReady }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      onReady(null);
      return;
    }
    const zone = (config.hotspots || []).find((h) => h.id === selected);
    if (!zone) {
      onReady(null);
      return;
    }
    // Contract: { zone_1: "<label/value>" }
    onReady({ [zone.id]: zone.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--ink-3)] font-semibold">
        Tap the region that matches the idea.
      </p>

      <div className="relative w-full overflow-hidden rounded-[12px] border-2 border-[var(--line)] bg-[var(--surface-2)] select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={config.backgroundImageUrl}
          alt="Hotspot activity"
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />

        {(config.hotspots || []).map((zone) => {
          const active = selected === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              disabled={disabled}
              title={zone.label}
              aria-pressed={active}
              onClick={() => {
                if (disabled) return;
                setSelected((prev) => (prev === zone.id ? null : zone.id));
              }}
              className={cn(
                "absolute rounded-[10px] border-2 transition-all duration-150",
                "flex items-end justify-center p-1.5 text-left",
                active
                  ? "border-[var(--brand)] bg-[rgba(10,122,118,0.28)] shadow-[0_0_0_3px_var(--brand-soft)]"
                  : "border-white/80 bg-white/20 hover:bg-white/35 hover:border-white",
                disabled && "cursor-not-allowed opacity-70"
              )}
              style={{
                left: zone.x_coords,
                top: zone.y_coords,
                width: zone.width,
                height: zone.height,
              }}
            >
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md max-w-full truncate",
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-black/55 text-white"
                )}
              >
                {zone.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="text-[12.5px] font-bold text-[var(--brand)]">
          Selected:{" "}
          {(config.hotspots || []).find((h) => h.id === selected)?.label}
        </p>
      )}
    </div>
  );
}