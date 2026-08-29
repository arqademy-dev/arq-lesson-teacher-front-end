"use client";
// components/admin/content-bank/interaction-forms/HotspotForm.tsx
import { RegionPicker } from "./RegionPicker";
import type { HotspotAnswers, HotspotConfig } from "./types";

type Props = {
  config: HotspotConfig;
  answers: HotspotAnswers;
  onChange: (config: HotspotConfig, answers: HotspotAnswers) => void;
};

export function HotspotForm({ config, answers, onChange }: Props) {
  function toggleCorrect(id: string) {
    const isCorrect = answers.correctHotspotIds.includes(id);
    if (config.allowMultiple) {
      onChange(config, {
        correctHotspotIds: isCorrect
          ? answers.correctHotspotIds.filter((hid) => hid !== id)
          : [...answers.correctHotspotIds, id],
      });
    } else {
      onChange(config, { correctHotspotIds: isCorrect ? [] : [id] });
    }
  }

  function setAllowMultiple(allowMultiple: boolean) {
    onChange(
      { ...config, allowMultiple },
      allowMultiple
        ? answers
        : { correctHotspotIds: answers.correctHotspotIds.slice(0, 1) }
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Image URL
        </label>
        <input
          value={config.imageUrl}
          onChange={(e) => onChange({ ...config, imageUrl: e.target.value }, answers)}
          placeholder="https://…"
          className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={config.allowMultiple ?? false}
            onChange={(e) => setAllowMultiple(e.target.checked)}
          />
          Allow multiple correct hotspots
        </label>
        <div className="flex items-center gap-2">
          <label className="text-[12.5px] text-[var(--ink-2)]">Max attempts</label>
          <input
            type="number"
            min={1}
            value={config.maxAttempts ?? 3}
            onChange={(e) => onChange({ ...config, maxAttempts: Number(e.target.value) }, answers)}
            className="w-16 h-8 px-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
          Hotspots — tick the correct one{config.allowMultiple ? "(s)" : ""} below
        </label>
        <RegionPicker
          imageUrl={config.imageUrl}
          regions={config.hotspots}
          shapeMode="choice"
          highlightIds={answers.correctHotspotIds}
          onChange={(hotspots) => {
            // Drop correctness for any hotspot that got removed.
            const ids = new Set(hotspots.map((h) => h.id));
            onChange(
              { ...config, hotspots },
              {
                correctHotspotIds: answers.correctHotspotIds.filter((id) => ids.has(id)),
              }
            );
          }}
        />
      </div>

      {config.hotspots.length > 0 && (
        <div className="space-y-1.5">
          {config.hotspots.map((h) => (
            <label
              key={h.id}
              className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]"
            >
              <input
                type={config.allowMultiple ? "checkbox" : "radio"}
                name="hotspot-correct"
                checked={answers.correctHotspotIds.includes(h.id)}
                onChange={() => toggleCorrect(h.id)}
              />
              {h.label || "(untitled hotspot)"}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}