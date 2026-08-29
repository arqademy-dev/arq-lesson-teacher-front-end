"use client";
// components/admin/content-bank/interaction-forms/RegionPicker.tsx
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { defaultRegion, type Region, type RegionShape } from "./types";

type Props = {
  imageUrl: string;
  regions: Region[];
  onChange: (regions: Region[]) => void;
  /** "fixed" — every new region is `fixedShape` and shape isn't editable (zones). "choice" — admin picks per region (hotspots). */
  shapeMode: "fixed" | "choice";
  fixedShape?: RegionShape;
  /** Region ids to visually highlight (e.g. marked as correct) */
  highlightIds?: string[];
};

export function RegionPicker({
  imageUrl,
  regions,
  onChange,
  shapeMode,
  fixedShape = "rect",
  highlightIds = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function addRegionAt(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    const region = { ...defaultRegion(shapeMode === "fixed" ? fixedShape : "rect"), x, y };
    onChange([...regions, region]);
  }

  function updateRegion(id: string, patch: Partial<Region>) {
    onChange(regions.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRegion(id: string) {
    onChange(regions.filter((r) => r.id !== id));
  }

  function onContainerClick(e: React.MouseEvent) {
    // Only add a new region when clicking empty space, not while
    // finishing a drag or clicking an existing region's own handles.
    if (draggingId) return;
    if ((e.target as HTMLElement).closest("[data-region]")) return;
    addRegionAt(e.clientX, e.clientY);
  }

  function onRegionMouseDown(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDraggingId(id);

    function onMove(moveEvent: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      updateRegion(id, { x, y });
    }
    function onUp() {
      setDraggingId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div
          ref={containerRef}
          onClick={onContainerClick}
          className="relative w-full rounded-[8px] border border-[var(--line)] overflow-hidden cursor-crosshair select-none"
          style={{ aspectRatio: "16 / 9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain bg-[var(--surface-2)] pointer-events-none"
            draggable={false}
          />
          {regions.map((r) => {
            const isHighlighted = highlightIds.includes(r.id);
            const style: React.CSSProperties =
              r.shape === "circle"
                ? {
                    left: `${r.x}%`,
                    top: `${r.y}%`,
                    width: `${(r.radius ?? 8) * 2}%`,
                    aspectRatio: "1 / 1",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "9999px",
                  }
                : {
                    left: `${r.x}%`,
                    top: `${r.y}%`,
                    width: `${r.width ?? 20}%`,
                    height: `${r.height ?? 15}%`,
                    transform: "translate(-50%, -50%)",
                  };
            return (
              <div
                key={r.id}
                data-region
                onMouseDown={(e) => onRegionMouseDown(r.id, e)}
                className="absolute border-2 flex items-center justify-center text-[10.5px] font-bold text-white cursor-move"
                style={{
                  ...style,
                  borderColor: isHighlighted ? "#2FD3C9" : "rgba(255,255,255,.85)",
                  background: isHighlighted
                    ? "rgba(47,211,201,.35)"
                    : "rgba(0,0,0,.35)",
                }}
                title="Drag to reposition"
              >
                {r.label || "?"}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[12px] text-[var(--ink-3)] italic">
          Add an image URL above to start placing regions.
        </p>
      )}

      <p className="text-[11px] text-[var(--ink-3)]">
        Click the image to add a region, drag a region to reposition it.
      </p>

      <div className="space-y-2">
        {regions.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
          >
            <input
              value={r.label}
              onChange={(e) => updateRegion(r.id, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
            />
            {shapeMode === "choice" && (
              <select
                value={r.shape}
                onChange={(e) => {
                  const shape = e.target.value as RegionShape;
                  updateRegion(
                    r.id,
                    shape === "circle"
                      ? { shape, width: undefined, height: undefined, radius: r.radius ?? 8 }
                      : { shape, radius: undefined, width: r.width ?? 20, height: r.height ?? 15 }
                  );
                }}
                className="h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
              >
                <option value="rect">Rect</option>
                <option value="circle">Circle</option>
              </select>
            )}
            {r.shape === "circle" ? (
              <input
                type="number"
                min={1}
                max={50}
                value={r.radius ?? 8}
                onChange={(e) => updateRegion(r.id, { radius: Number(e.target.value) })}
                title="Radius (%)"
                className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
              />
            ) : (
              <>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={r.width ?? 20}
                  onChange={(e) => updateRegion(r.id, { width: Number(e.target.value) })}
                  title="Width (%)"
                  className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={r.height ?? 15}
                  onChange={(e) => updateRegion(r.id, { height: Number(e.target.value) })}
                  title="Height (%)"
                  className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => removeRegion(r.id)}
              className="p-1.5 text-[var(--danger)]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}