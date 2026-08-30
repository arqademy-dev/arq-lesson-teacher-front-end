"use client";
// components/admin/content-bank/interaction-forms/HotspotForm.tsx
// A labeled-diagram exercise — click to place a labeled region, drag to
// reposition. No correctness-picking step: correctAnswers is derived
// automatically from each hotspot's own label (see InteractiveElementEditor).
import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { defaultHotspot, type HotspotConfig } from "./types";

type Props = {
  config: HotspotConfig;
  onChange: (config: HotspotConfig) => void;
};

function parsePercent(value: string): number {
  return parseFloat(value) || 0;
}
function parsePx(value: string): number {
  return parseFloat(value) || 0;
}

export function HotspotForm({ config, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function updateHotspot(id: string, patch: Partial<HotspotConfig["hotspots"][number]>) {
    onChange({
      ...config,
      hotspots: config.hotspots.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
  }

  function addHotspotAt(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(95, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(95, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    onChange({
      ...config,
      hotspots: [
        ...config.hotspots,
        { ...defaultHotspot(), x_coords: `${x.toFixed(0)}%`, y_coords: `${y.toFixed(0)}%` },
      ],
    });
  }

  function removeHotspot(id: string) {
    onChange({ ...config, hotspots: config.hotspots.filter((h) => h.id !== id) });
  }

  function onContainerClick(e: React.MouseEvent) {
    if (draggingId) return;
    if ((e.target as HTMLElement).closest("[data-hotspot]")) return;
    addHotspotAt(e.clientX, e.clientY);
  }

  function onHotspotMouseDown(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDraggingId(id);
    function onMove(moveEvent: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(95, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(95, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      updateHotspot(id, { x_coords: `${x.toFixed(0)}%`, y_coords: `${y.toFixed(0)}%` });
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
      <p className="text-[11px] text-[var(--ink-3)]">
        Each hotspot's own label is its correct answer — there's no separate
        step to mark which one is right, since this is a labeled-diagram
        exercise rather than a guessing quiz.
      </p>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Background image URL
        </label>
        <input
          value={config.backgroundImageUrl}
          onChange={(e) => onChange({ ...config, backgroundImageUrl: e.target.value })}
          placeholder="https://…"
          className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      {config.backgroundImageUrl ? (
        <div
          ref={containerRef}
          onClick={onContainerClick}
          className="relative w-full rounded-[8px] border border-[var(--line)] overflow-hidden cursor-crosshair select-none"
          style={{ aspectRatio: "16 / 9" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.backgroundImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain bg-[var(--surface-2)] pointer-events-none"
            draggable={false}
          />
          {config.hotspots.map((h) => (
            <div
              key={h.id}
              data-hotspot
              onMouseDown={(e) => onHotspotMouseDown(h.id, e)}
              className="absolute border-2 border-white/85 bg-black/35 flex items-center justify-center text-[10.5px] font-bold text-white cursor-move"
              style={{
                left: h.x_coords,
                top: h.y_coords,
                width: h.width,
                height: h.height,
              }}
              title="Drag to reposition"
            >
              {h.label || "?"}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[var(--ink-3)] italic">
          Add an image URL above to start placing hotspots.
        </p>
      )}

      <p className="text-[11px] text-[var(--ink-3)]">
        Click the image to add a hotspot, drag a hotspot to reposition it.
      </p>

      <div className="space-y-2">
        {config.hotspots.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
          >
            <input
              value={h.label}
              onChange={(e) => updateHotspot(h.id, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
            />
            <div className="flex items-center gap-1">
              <label className="text-[10.5px] text-[var(--ink-3)]">W</label>
              <input
                type="number"
                min={1}
                value={parsePx(h.width)}
                onChange={(e) => updateHotspot(h.id, { width: `${e.target.value}px` })}
                className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[10.5px] text-[var(--ink-3)]">H</label>
              <input
                type="number"
                min={1}
                value={parsePx(h.height)}
                onChange={(e) => updateHotspot(h.id, { height: `${e.target.value}px` })}
                className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[12px]"
              />
            </div>
            <button
              type="button"
              onClick={() => removeHotspot(h.id)}
              disabled={config.hotspots.length <= 1}
              className="p-1.5 text-[var(--danger)] disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({ ...config, hotspots: [...config.hotspots, defaultHotspot()] })
        }
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[var(--line)] text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
      >
        <Plus className="w-3.5 h-3.5" />
        Add hotspot manually
      </button>
    </div>
  );
}