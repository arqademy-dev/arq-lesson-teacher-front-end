"use client";
// components/admin/content-bank/InteractiveElementEditor.tsx
//
// multiple_choice, fill_blank, drag_and_drop, hotspot use typed forms
// (interaction-forms/*). The remaining 3 types (branching,
// interactive_video, image_sequencing) still fall back to raw JSON
// fields below — replace each as its interaction-forms/*.tsx is built.
// Nothing outside this file needs to change when that happens.
import { useState } from "react";
import {
  createInteractiveElement,
  updateInteractiveElement,
  type InteractionType,
  type InteractiveElement,
} from "@/lib/api";
import { X, Loader2 } from "lucide-react";
import { MultipleChoiceForm } from "./interaction-forms/MultipleChoiceForm";
import { FillBlankForm } from "./interaction-forms/FillBlankForm";
import { DragAndDropForm } from "./interaction-forms/DragAndDropForm";
import { HotspotForm } from "./interaction-forms/HotspotForm";
import {
  defaultDragAndDropAnswers,
  defaultDragAndDropConfig,
  defaultFillBlankAnswers,
  defaultFillBlankConfig,
  defaultHotspotAnswers,
  defaultHotspotConfig,
  defaultMultipleChoiceAnswers,
  defaultMultipleChoiceConfig,
  type DragAndDropAnswers,
  type DragAndDropConfig,
  type FillBlankAnswers,
  type FillBlankConfig,
  type HotspotAnswers,
  type HotspotConfig,
  type MultipleChoiceAnswers,
  type MultipleChoiceConfig,
} from "./interaction-forms/types";

const INTERACTION_TYPES: InteractionType[] = [
  "multiple_choice",
  "fill_blank",
  "drag_and_drop",
  "hotspot",
  "branching",
  "interactive_video",
  "image_sequencing",
];

const TYPED_FORMS: InteractionType[] = [
  "multiple_choice",
  "fill_blank",
  "drag_and_drop",
  "hotspot",
];

type Props = {
  resourceId: string;
  element?: InteractiveElement | null; // present = edit mode
  onClose: () => void;
  onSaved: () => void;
};

export function InteractiveElementEditor({
  resourceId,
  element,
  onClose,
  onSaved,
}: Props) {
  const [interactionType, setInteractionType] = useState<InteractionType>(
    element?.interactionType ?? "multiple_choice"
  );
  const [videoTimestampSeconds, setVideoTimestampSeconds] = useState<string>(
    element?.videoTimestampSeconds != null
      ? String(element.videoTimestampSeconds)
      : ""
  );
  const [pauseOnTrigger, setPauseOnTrigger] = useState(
    element?.pauseOnTrigger ?? false
  );

  const [mcConfig, setMcConfig] = useState<MultipleChoiceConfig>(
    element?.interactionType === "multiple_choice"
      ? (element.configSchema as unknown as MultipleChoiceConfig)
      : defaultMultipleChoiceConfig()
  );
  const [mcAnswers, setMcAnswers] = useState<MultipleChoiceAnswers>(
    element?.interactionType === "multiple_choice"
      ? (element.correctAnswers as unknown as MultipleChoiceAnswers)
      : defaultMultipleChoiceAnswers()
  );
  const [fbConfig, setFbConfig] = useState<FillBlankConfig>(
    element?.interactionType === "fill_blank"
      ? (element.configSchema as unknown as FillBlankConfig)
      : defaultFillBlankConfig()
  );
  const [fbAnswers, setFbAnswers] = useState<FillBlankAnswers>(
    element?.interactionType === "fill_blank"
      ? (element.correctAnswers as unknown as FillBlankAnswers)
      : defaultFillBlankAnswers()
  );
  const [ddConfig, setDdConfig] = useState<DragAndDropConfig>(
    element?.interactionType === "drag_and_drop"
      ? (element.configSchema as unknown as DragAndDropConfig)
      : defaultDragAndDropConfig()
  );
  const [ddAnswers, setDdAnswers] = useState<DragAndDropAnswers>(
    element?.interactionType === "drag_and_drop"
      ? (element.correctAnswers as unknown as DragAndDropAnswers)
      : defaultDragAndDropAnswers()
  );
  const [hsConfig, setHsConfig] = useState<HotspotConfig>(
    element?.interactionType === "hotspot"
      ? (element.configSchema as unknown as HotspotConfig)
      : defaultHotspotConfig()
  );
  const [hsAnswers, setHsAnswers] = useState<HotspotAnswers>(
    element?.interactionType === "hotspot"
      ? (element.correctAnswers as unknown as HotspotAnswers)
      : defaultHotspotAnswers()
  );

  // Raw-JSON fallback state — only meaningful for the untyped types.
  const startsUntyped = !TYPED_FORMS.includes(element?.interactionType ?? "multiple_choice");
  const [configSchemaText, setConfigSchemaText] = useState(
    startsUntyped ? JSON.stringify(element?.configSchema ?? {}, null, 2) : "{}"
  );
  const [correctAnswersText, setCorrectAnswersText] = useState(
    startsUntyped ? JSON.stringify(element?.correctAnswers ?? {}, null, 2) : "{}"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTypeChange(next: InteractionType) {
    setInteractionType(next);
    setError(null);
    // Reset the relevant editor's state to defaults on a type switch —
    // a previous type's data doesn't carry over meaningfully.
    if (next === "multiple_choice") {
      setMcConfig(defaultMultipleChoiceConfig());
      setMcAnswers(defaultMultipleChoiceAnswers());
    } else if (next === "fill_blank") {
      setFbConfig(defaultFillBlankConfig());
      setFbAnswers(defaultFillBlankAnswers());
    } else if (next === "drag_and_drop") {
      setDdConfig(defaultDragAndDropConfig());
      setDdAnswers(defaultDragAndDropAnswers());
    } else if (next === "hotspot") {
      setHsConfig(defaultHotspotConfig());
      setHsAnswers(defaultHotspotAnswers());
    } else {
      setConfigSchemaText("{}");
      setCorrectAnswersText("{}");
    }
  }

  async function save() {
    setError(null);

    let configSchema: Record<string, unknown>;
    let correctAnswers: Record<string, unknown>;

    if (interactionType === "multiple_choice") {
      if (!mcConfig.question.trim()) return setError("Question is required");
      if (mcConfig.options.some((o) => !o.text.trim()))
        return setError("All options need text");
      if (mcAnswers.correctOptionIds.length === 0)
        return setError("Mark at least one option as correct");
      configSchema = mcConfig as unknown as Record<string, unknown>;
      correctAnswers = mcAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "fill_blank") {
      if (!fbConfig.template.trim()) return setError("Template is required");
      if (fbConfig.blanks.length === 0)
        return setError("Add at least one {{id}} blank to the template");
      const missing = fbConfig.blanks.filter(
        (b) => (fbAnswers.answers[b.id] ?? []).length === 0
      );
      if (missing.length > 0)
        return setError(`Accepted answers missing for: ${missing.map((b) => b.id).join(", ")}`);
      configSchema = fbConfig as unknown as Record<string, unknown>;
      correctAnswers = fbAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "drag_and_drop") {
      if (!ddConfig.backgroundImageUrl.trim())
        return setError("Background image URL is required");
      if (ddConfig.zones.length === 0) return setError("Add at least one drop zone");
      if (ddConfig.items.some((it) => !it.label.trim()))
        return setError("All items need a label");
      const unplaced = ddConfig.items.filter((it) => !ddAnswers.placements[it.id]);
      if (unplaced.length > 0)
        return setError(`Assign a correct zone for: ${unplaced.map((i) => i.label || "(untitled)").join(", ")}`);
      configSchema = ddConfig as unknown as Record<string, unknown>;
      correctAnswers = ddAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "hotspot") {
      if (!hsConfig.imageUrl.trim()) return setError("Image URL is required");
      if (hsConfig.hotspots.length === 0) return setError("Add at least one hotspot");
      if (hsAnswers.correctHotspotIds.length === 0)
        return setError("Mark at least one hotspot as correct");
      configSchema = hsConfig as unknown as Record<string, unknown>;
      correctAnswers = hsAnswers as unknown as Record<string, unknown>;
    } else {
      try {
        configSchema = JSON.parse(configSchemaText);
      } catch {
        return setError("configSchema is not valid JSON");
      }
      try {
        correctAnswers = JSON.parse(correctAnswersText);
      } catch {
        return setError("correctAnswers is not valid JSON");
      }
    }

    setSaving(true);
    try {
      const body = {
        interactionType,
        configSchema,
        correctAnswers,
        ...(interactionType === "interactive_video"
          ? {
              videoTimestampSeconds: videoTimestampSeconds
                ? Number(videoTimestampSeconds)
                : undefined,
              pauseOnTrigger,
            }
          : {}),
      };
      if (element) {
        await updateInteractiveElement(element.id, body);
      } else {
        await createInteractiveElement(resourceId, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line-soft)]">
          <p className="font-heading text-[14px] font-semibold">
            {element ? "Edit" : "Add"} interactive element
          </p>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--ink-3)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
              Interaction type
            </label>
            <select
              value={interactionType}
              onChange={(e) => onTypeChange(e.target.value as InteractionType)}
              className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {!TYPED_FORMS.includes(t) ? " (raw JSON — builder coming soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          {interactionType === "interactive_video" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  Timestamp (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={videoTimestampSeconds}
                  onChange={(e) => setVideoTimestampSeconds(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
                />
              </div>
              <label className="flex items-center gap-2 mt-5 text-[12.5px] text-[var(--ink-2)]">
                <input
                  type="checkbox"
                  checked={pauseOnTrigger}
                  onChange={(e) => setPauseOnTrigger(e.target.checked)}
                />
                Pause on trigger
              </label>
            </div>
          )}

          {interactionType === "multiple_choice" && (
            <MultipleChoiceForm
              config={mcConfig}
              answers={mcAnswers}
              onChange={(c, a) => {
                setMcConfig(c);
                setMcAnswers(a);
              }}
            />
          )}

          {interactionType === "fill_blank" && (
            <FillBlankForm
              config={fbConfig}
              answers={fbAnswers}
              onChange={(c, a) => {
                setFbConfig(c);
                setFbAnswers(a);
              }}
            />
          )}

          {interactionType === "drag_and_drop" && (
            <DragAndDropForm
              config={ddConfig}
              answers={ddAnswers}
              onChange={(c, a) => {
                setDdConfig(c);
                setDdAnswers(a);
              }}
            />
          )}

          {interactionType === "hotspot" && (
            <HotspotForm
              config={hsConfig}
              answers={hsAnswers}
              onChange={(c, a) => {
                setHsConfig(c);
                setHsAnswers(a);
              }}
            />
          )}

          {!TYPED_FORMS.includes(interactionType) && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  configSchema (JSON — shown to students)
                </label>
                <textarea
                  value={configSchemaText}
                  onChange={(e) => setConfigSchemaText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px] font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-3)] mb-1">
                  correctAnswers (JSON — admin-only, never sent to students)
                </label>
                <textarea
                  value={correctAnswersText}
                  onChange={(e) => setCorrectAnswersText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12px] font-mono"
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="px-5 text-[12px] font-semibold text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--line-soft)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-[8px] text-[12.5px] font-semibold text-[var(--ink-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[12.5px] font-bold bg-[var(--brand)] text-white disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}