"use client";
// components/admin/content-bank/InteractiveElementEditor.tsx
//
// All 8 interactionTypes (the 7 documented + confirmed-real file_upload)
// now have typed forms matching the actual seeded backend shapes — no
// raw-JSON fallback needed anymore.
//
// `resourceType` is optional context from the parent resource, used only
// to pick a sensible default interaction type for brand-new elements:
// video resources default to interactive_video, submission resources
// default to file_upload.
import { useState } from "react";
import {
  createInteractiveElement,
  updateInteractiveElement,
  type InteractionType,
  type InteractiveElement,
  type ResourceType,
} from "@/lib/api";
import { X, Loader2 } from "lucide-react";
import { MultipleChoiceForm } from "./interaction-forms/MultipleChoiceForm";
import { FillBlankForm } from "./interaction-forms/FillBlankForm";
import { DragAndDropForm } from "./interaction-forms/DragAndDropForm";
import { HotspotForm } from "./interaction-forms/HotspotForm";
import { BranchingForm } from "./interaction-forms/BranchingForm";
import { InteractiveVideoForm } from "./interaction-forms/InteractiveVideoForm";
import { FileUploadForm } from "./interaction-forms/FileUploadForm";
import { ImageSequencingForm } from "./interaction-forms/ImageSequencingForm";
import {
  defaultBranchingAnswers,
  defaultBranchingConfig,
  defaultDragAndDropAnswers,
  defaultDragAndDropConfig,
  defaultFileUploadAnswers,
  defaultFileUploadConfig,
  defaultFillBlankAnswers,
  defaultFillBlankConfig,
  defaultHotspotConfig,
  defaultImageSequencingConfig,
  defaultInteractiveVideoAnswers,
  defaultInteractiveVideoConfig,
  defaultMultipleChoiceAnswers,
  defaultMultipleChoiceConfig,
  deriveHotspotAnswers,
  extractBlankKeys,
  type BranchingAnswers,
  type BranchingConfig,
  type DragAndDropAnswers,
  type DragAndDropConfig,
  type FileUploadAnswers,
  type FileUploadConfig,
  type FillBlankAnswers,
  type FillBlankConfig,
  type HotspotConfig,
  type ImageSequencingConfig,
  type InteractiveVideoAnswers,
  type InteractiveVideoConfig,
  type MultipleChoiceAnswers,
  type MultipleChoiceConfig,
} from "./interaction-forms/types";

const ALL_TYPES: (InteractionType | "file_upload")[] = [
  "multiple_choice",
  "fill_blank",
  "drag_and_drop",
  "hotspot",
  "branching",
  "interactive_video",
  "image_sequencing",
  "file_upload",
];

type Props = {
  resourceId: string;
  /** Context from the parent resource — used only to pick a sensible
   *  default interaction type for brand-new elements. */
  resourceType?: ResourceType;
  element?: InteractiveElement | null; // present = edit mode
  onClose: () => void;
  onSaved: () => void;
};

function defaultTypeFor(resourceType?: ResourceType): InteractionType | "file_upload" {
  if (resourceType === "video") return "interactive_video";
  if ((resourceType as string) === "submission") return "file_upload";
  return "multiple_choice";
}

export function InteractiveElementEditor({
  resourceId,
  resourceType,
  element,
  onClose,
  onSaved,
}: Props) {
  const [interactionType, setInteractionType] = useState<InteractionType | "file_upload">(
    element?.interactionType ?? defaultTypeFor(resourceType)
  );
  const [videoTimestampSeconds, setVideoTimestampSeconds] = useState<string>(
    element?.videoTimestampSeconds != null ? String(element.videoTimestampSeconds) : ""
  );
  const [pauseOnTrigger, setPauseOnTrigger] = useState(element?.pauseOnTrigger ?? false);

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
  const [brConfig, setBrConfig] = useState<BranchingConfig>(
    element?.interactionType === "branching"
      ? (element.configSchema as unknown as BranchingConfig)
      : defaultBranchingConfig()
  );
  const [brAnswers, setBrAnswers] = useState<BranchingAnswers>(
    element?.interactionType === "branching"
      ? (element.correctAnswers as unknown as BranchingAnswers)
      : defaultBranchingAnswers()
  );
  const [ivConfig, setIvConfig] = useState<InteractiveVideoConfig>(
    element?.interactionType === "interactive_video"
      ? (element.configSchema as unknown as InteractiveVideoConfig)
      : defaultInteractiveVideoConfig()
  );
  const [ivAnswers, setIvAnswers] = useState<InteractiveVideoAnswers>(
    element?.interactionType === "interactive_video"
      ? (element.correctAnswers as unknown as InteractiveVideoAnswers)
      : defaultInteractiveVideoAnswers()
  );
  const [isConfig, setIsConfig] = useState<ImageSequencingConfig>(
    element?.interactionType === "image_sequencing"
      ? (element.configSchema as unknown as ImageSequencingConfig)
      : defaultImageSequencingConfig()
  );
  const [fuConfig, setFuConfig] = useState<FileUploadConfig>(
    (element?.interactionType as string) === "file_upload"
      ? (element!.configSchema as unknown as FileUploadConfig)
      : defaultFileUploadConfig()
  );
  const [fuAnswers, setFuAnswers] = useState<FileUploadAnswers>(
    (element?.interactionType as string) === "file_upload"
      ? (element!.correctAnswers as unknown as FileUploadAnswers)
      : defaultFileUploadAnswers()
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTypeChange(next: InteractionType | "file_upload") {
    setInteractionType(next);
    setError(null);
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
    } else if (next === "branching") {
      setBrConfig(defaultBranchingConfig());
      setBrAnswers(defaultBranchingAnswers());
    } else if (next === "interactive_video") {
      setIvConfig(defaultInteractiveVideoConfig());
      setIvAnswers(defaultInteractiveVideoAnswers());
    } else if (next === "image_sequencing") {
      setIsConfig(defaultImageSequencingConfig());
    } else if (next === "file_upload") {
      setFuConfig(defaultFileUploadConfig());
      setFuAnswers(defaultFileUploadAnswers());
    }
  }

  async function save() {
    setError(null);

    let configSchema: Record<string, unknown>;
    let correctAnswers: Record<string, unknown>;

    if (interactionType === "multiple_choice") {
      if (!mcConfig.question.trim()) return setError("Question is required");
      if (mcConfig.options.some((o) => !o.trim())) return setError("All options need text");
      if (!mcAnswers.answer || !mcConfig.options.includes(mcAnswers.answer))
        return setError("Mark the correct option");
      configSchema = mcConfig as unknown as Record<string, unknown>;
      correctAnswers = mcAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "fill_blank") {
      const keys = extractBlankKeys(fbConfig.prompt_text);
      if (!fbConfig.prompt_text.trim()) return setError("Template is required");
      if (keys.length === 0) return setError("Add at least one [id] blank to the template");
      for (const key of keys) {
        const options = fbConfig.dropdown_options[key] ?? [];
        if (options.length < 2) return setError(`Add at least 2 dropdown choices for [${key}]`);
        if (!fbAnswers[key]) return setError(`Mark the correct choice for [${key}]`);
      }
      configSchema = fbConfig as unknown as Record<string, unknown>;
      correctAnswers = fbAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "drag_and_drop") {
      if (ddConfig.draggables.length === 0) return setError("Add at least one draggable item");
      if (ddConfig.dropzones.length === 0) return setError("Add at least one drop zone");
      if (ddConfig.draggables.some((d) => !d.text.trim())) return setError("All items need text");
      if (ddConfig.dropzones.some((z) => !z.label.trim())) return setError("All zones need a label");
      const unplaced = ddConfig.draggables.filter((d) => !ddAnswers[d.id]);
      if (unplaced.length > 0)
        return setError(`Assign a correct zone for: ${unplaced.map((d) => d.text || "(untitled)").join(", ")}`);
      configSchema = ddConfig as unknown as Record<string, unknown>;
      correctAnswers = ddAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "hotspot") {
      if (!hsConfig.backgroundImageUrl.trim()) return setError("Background image URL is required");
      if (hsConfig.hotspots.length === 0) return setError("Add at least one hotspot");
      if (hsConfig.hotspots.some((h) => !h.label.trim())) return setError("Every hotspot needs a label");
      configSchema = hsConfig as unknown as Record<string, unknown>;
      correctAnswers = deriveHotspotAnswers(hsConfig) as unknown as Record<string, unknown>;
    } else if (interactionType === "branching") {
      if (!brConfig.scenario.trim()) return setError("Scenario is required");
      if (brConfig.choices.some((c) => !c.text.trim())) return setError("Every choice needs text");
      if (brConfig.choices.some((c) => !c.next.trim())) return setError("Every choice needs an outcome key");
      const usedKeys = Array.from(new Set(brConfig.choices.map((c) => c.next)));
      const missingFeedback = usedKeys.filter((k) => !brConfig.feedback[k]?.trim());
      if (missingFeedback.length > 0)
        return setError(`Add feedback text for: ${missingFeedback.join(", ")}`);
      if (!brAnswers.answer) return setError("Mark the correct choice");
      configSchema = brConfig as unknown as Record<string, unknown>;
      correctAnswers = brAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "interactive_video") {
      if (!ivConfig.prompt_text.trim()) return setError("Prompt is required");
      if (ivConfig.options.some((o) => !o.trim())) return setError("All options need text");
      if (!ivAnswers.answer || !ivConfig.options.includes(ivAnswers.answer))
        return setError("Mark the correct option");
      configSchema = ivConfig as unknown as Record<string, unknown>;
      correctAnswers = ivAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "image_sequencing") {
      if (isConfig.items.length < 2) return setError("Add at least 2 items");
      if (isConfig.items.some((it) => !it.text.trim())) return setError("All items need text");
      configSchema = isConfig as unknown as Record<string, unknown>;
      correctAnswers = { order: isConfig.items.map((it) => it.id) };
    } else if (interactionType === "file_upload") {
      if (!fuConfig.allowFile && !fuConfig.allowText)
        return setError("Enable at least one of file upload or text note");
      if (fuConfig.allowFile && (!fuConfig.maxFiles || fuConfig.maxFiles < 1))
        return setError("Max files must be at least 1");
      configSchema = fuConfig as unknown as Record<string, unknown>;
      correctAnswers = fuAnswers as unknown as Record<string, unknown>;
    } else {
      return setError("Unsupported interaction type");
    }

    setSaving(true);
    try {
      const body = {
        interactionType: interactionType as InteractionType,
        configSchema,
        correctAnswers,
        ...(interactionType === "interactive_video"
          ? {
              videoTimestampSeconds: videoTimestampSeconds ? Number(videoTimestampSeconds) : undefined,
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
              onChange={(e) => onTypeChange(e.target.value as InteractionType | "file_upload")}
              className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {!element && resourceType === "video" && interactionType === "interactive_video" && (
              <p className="text-[11px] text-[var(--ink-3)] mt-1">
                Defaulted to Interactive video since this resource is a video.
              </p>
            )}
            {!element && (resourceType as string) === "submission" && interactionType === "file_upload" && (
              <p className="text-[11px] text-[var(--ink-3)] mt-1">
                Defaulted to File upload since this resource is a submission.
              </p>
            )}
          </div>

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
            <HotspotForm config={hsConfig} onChange={setHsConfig} />
          )}

          {interactionType === "branching" && (
            <BranchingForm
              config={brConfig}
              answers={brAnswers}
              onChange={(c, a) => {
                setBrConfig(c);
                setBrAnswers(a);
              }}
            />
          )}

          {interactionType === "interactive_video" && (
            <InteractiveVideoForm
              config={ivConfig}
              answers={ivAnswers}
              onChange={(c, a) => {
                setIvConfig(c);
                setIvAnswers(a);
              }}
              videoTimestampSeconds={videoTimestampSeconds}
              pauseOnTrigger={pauseOnTrigger}
              onTimingChange={(ts, pause) => {
                setVideoTimestampSeconds(ts);
                setPauseOnTrigger(pause);
              }}
            />
          )}

          {interactionType === "image_sequencing" && (
            <ImageSequencingForm config={isConfig} onChange={setIsConfig} />
          )}

          {interactionType === "file_upload" && (
            <FileUploadForm
              config={fuConfig}
              answers={fuAnswers}
              onChange={(c, a) => {
                setFuConfig(c);
                setFuAnswers(a);
              }}
            />
          )}
        </div>

        {error && (
          <p className="px-5 text-[12px] font-semibold text-[var(--danger)]">{error}</p>
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