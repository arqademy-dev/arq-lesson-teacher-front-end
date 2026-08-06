"use client";

import { useEffect, useState } from "react";
import type { DragAndDropConfig, DragAndDropAnswer } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  config: DragAndDropConfig;
  disabled?: boolean;
  onReady: (answer: DragAndDropAnswer | null) => void;
};

export function DragAndDrop({ config, disabled, onReady }: Props) {
  const draggables = config.draggables || [];
  const dropzones = config.dropzones || [];

  // draggableId → dropzoneId
  const [placements, setPlacements] = useState<Record<string, string>>({});
  // tap-to-place selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // pointer drag
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);

  const pool = draggables.filter((d) => !placements[d.id]);

  useEffect(() => {
    const allPlaced =
      draggables.length > 0 && draggables.every((d) => Boolean(placements[d.id]));
    onReady(allPlaced ? { ...placements } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements]);

  function place(dragId: string, zoneId: string) {
    if (disabled) return;
    setPlacements((prev) => {
      const next = { ...prev };
      // REMOVED: The logic that cleared the zone has been deleted
      next[dragId] = zoneId;
      return next;
    });
    setSelectedId(null);
    setDraggingId(null);
    setOverZone(null);
  }

  function returnToPool(dragId: string) {
    if (disabled) return;
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[dragId];
      return next;
    });
    setSelectedId(null);
  }

  function onItemPointerDown(id: string) {
    if (disabled) return;
    setSelectedId(id);
    setDraggingId(id);
  }

  function onZoneActivate(zoneId: string) {
    if (disabled) return;
    const id = selectedId || draggingId;
    if (id) place(id, zoneId);
  }

  return (
    <div className="space-y-4">
      {config.instructions && (
        <p className="text-[14px] text-[var(--ink)] font-semibold leading-relaxed">
          {config.instructions}
        </p>
      )}

      <p className="text-[12px] text-[var(--ink-3)] font-semibold">
        Tap an item, then tap a category — or drag it on desktop.
      </p>

      {/* Pool */}
      <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-2.5">
          Items
        </p>
        <div className="flex flex-wrap gap-2 min-h-[52px]">
          {pool.length === 0 && (
            <span className="text-[12px] text-[var(--ink-4)] font-semibold py-2">
              All placed. Tap a placed item to move it back.
            </span>
          )}
          {pool.map((item) => {
            const active = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setSelectedId((prev) => (prev === item.id ? null : item.id));
                }}
                onPointerDown={() => onItemPointerDown(item.id)}
                className={cn(
                  "px-3.5 py-2.5 rounded-[10px] border-2 text-[13px] font-bold select-none touch-manipulation",
                  "transition-all duration-150",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] shadow-[0_0_0_3px_var(--brand-soft)]"
                    : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--brand)]",
                  disabled && "opacity-60 cursor-not-allowed"
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zones */}
      <div className="grid gap-3 sm:grid-cols-2">
        {dropzones.map((zone) => {
          // FIX: Filter all draggables placed into this specific zone instead of finding just one
          const placedItems = draggables.filter(
            (d) => placements[d.id] === zone.id
          );
          const isOver = overZone === zone.id;
          const canDrop = Boolean(selectedId || draggingId);

          return (
            <div
              key={zone.id}
              onClick={() => onZoneActivate(zone.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverZone(zone.id);
              }}
              onDragLeave={() => setOverZone((z) => (z === zone.id ? null : z))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId) place(draggingId, zone.id);
              }}
              className={cn(
                "min-h-[110px] rounded-[12px] border-2 border-dashed p-3 text-left transition-all touch-manipulation cursor-pointer",
                isOver || canDrop
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)]",
                disabled && "opacity-70 cursor-not-allowed"
              )}
            >
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-3)] mb-2">
                {zone.label}
              </p>

              {/* FIX: Render all placed items inside a flex wrapper */}
              {placedItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {placedItems.map((placed) => (
                    <span
                      key={placed.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        returnToPool(placed.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          returnToPool(placed.id);
                        }
                      }}
                      className={cn(
                        "inline-block px-3.5 py-2.5 rounded-[10px] border-2 text-[13px] font-bold cursor-pointer",
                        "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]"
                      )}
                    >
                      {placed.text}
                      <span className="block text-[10px] font-semibold opacity-70 mt-0.5 text-center">
                        × Remove
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--ink-4)] font-semibold py-4 text-center">
                  {canDrop ? "Tap to place here" : "Drop / tap here"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {draggables.every((d) => placements[d.id]) && (
        <p className="text-[12.5px] font-bold text-[var(--brand)]">
          All matched — ready to submit.
        </p>
      )}
    </div>
  );
}
