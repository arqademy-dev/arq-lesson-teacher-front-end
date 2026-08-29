"use client";
// components/admin/content-bank/InteractiveElementEditor.tsx
//
// All 7 documented interactionTypes have typed forms, plus file_upload
// (a.k.a. "submission") which is NOT in the OpenAPI doc's enum — confirm
// with backend that the API accepts "file_upload" as a value before
// relying on this in production.
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
import { BranchingForm } from "./interaction-forms/BranchingForm";
import { InteractiveVideoForm } from "./interaction-forms/InteractiveVideoForm";
import { FileUploadForm } from "./interaction-forms/FileUploadForm";
import {
  defaultBranchingAnswers,
  defaultBranchingConfig,
  defaultDragAndDropAnswers,
  defaultDragAndDropConfig,
  defaultFileUploadAnswers,
  defaultFileUploadConfig,
  defaultFillBlankAnswers,
  defaultFillBlankConfig,
  defaultHotspotAnswers,
  defaultHotspotConfig,
  defaultInteractiveVideoAnswers,
  defaultInteractiveVideoConfig,
  defaultMultipleChoiceAnswers,
  defaultMultipleChoiceConfig,
  type BranchingAnswers,
  type BranchingConfig,
  type DragAndDropAnswers,
  type DragAndDropConfig,
  type FileUploadAnswers,
  type FileUploadConfig,
  type FillBlankAnswers,
  type FillBlankConfig,
  type HotspotAnswers,
  type HotspotConfig,
  type InteractiveVideoAnswers,
  type InteractiveVideoConfig,
  type MultipleChoiceAnswers,
  type MultipleChoiceConfig,
} from "./interaction-forms/types";

// NOTE: "file_upload" appended here is not in the documented OpenAPI enum.
// Confirm with backend before relying on it — see file header.
const INTERACTION_TYPES: (InteractionType | "file_upload")[] = [
  "multiple_choice",
  "fill_blank",
  "drag_and_drop",
  "hotspot",
  "branching",
  "interactive_video",
  "image_sequencing",
  "file_upload",
];

const TYPED_FORMS: (InteractionType | "file_upload")[] = [
  "multiple_choice",
  "fill_blank",
  "drag_and_drop",
  "hotspot",
  "branching",
  "interactive_video",
  "file_upload",
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
  const [interactionType, setInteractionType] = useState<InteractionType | "file_upload">(
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

  // Raw-JSON fallback state — only meaningful for image_sequencing now.
  const startsUntyped = !TYPED_FORMS.includes(element?.interactionType ?? "multiple_choice");
  const [configSchemaText, setConfigSchemaText] = useState(
    startsUntyped ? JSON.stringify(element?.configSchema ?? {}, null, 2) : "{}"
  );
  const [correctAnswersText, setCorrectAnswersText] = useState(
    startsUntyped ? JSON.stringify(element?.correctAnswers ?? {}, null, 2) : "{}"
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
      setHsAnswers(defaultHotspotAnswers());
    } else if (next === "branching") {
      setBrConfig(defaultBranchingConfig());
      setBrAnswers(defaultBranchingAnswers());
    } else if (next === "interactive_video") {
      setIvConfig(defaultInteractiveVideoConfig());
      setIvAnswers(defaultInteractiveVideoAnswers());
    } else if (next === "file_upload") {
      setFuConfig(defaultFileUploadConfig());
      setFuAnswers(defaultFileUploadAnswers());
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
    } else if (interactionType === "branching") {
      if (brConfig.steps.some((s) => !s.prompt.trim()))
        return setError("Every step needs a prompt");
      if (brConfig.steps.some((s) => s.choices.some((c) => !c.text.trim())))
        return setError("Every choice needs text");
      if (brAnswers.idealPath.length === 0)
        return setError("Build the ideal path before saving");
      configSchema = brConfig as unknown as Record<string, unknown>;
      correctAnswers = brAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "interactive_video") {
      if (!ivConfig.prompt.trim()) return setError("Prompt is required");
      if (ivConfig.choices.some((c) => !c.text.trim()))
        return setError("All choices need text");
      if (!ivAnswers.correctChoiceId) return setError("Mark the correct choice");
      configSchema = ivConfig as unknown as Record<string, unknown>;
      correctAnswers = ivAnswers as unknown as Record<string, unknown>;
    } else if (interactionType === "file_upload") {
      if (!fuConfig.allowFile && !fuConfig.allowText)
        return setError("Enable at least one of file upload or text note");
      if (fuConfig.allowFile && (!fuConfig.maxFiles || fuConfig.maxFiles < 1))
        return setError("Max files must be at least 1");
      configSchema = fuConfig as unknown as Record<string, unknown>;
      correctAnswers = fuAnswers as unknown as Record<string, unknown>;
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
        interactionType: interactionType as InteractionType,
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
              onChange={(e) => onTypeChange(e.target.value as InteractionType | "file_upload")}
              className="w-full h-9 px-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] text-[12.5px]"
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {!TYPED_FORMS.includes(t) ? " (raw JSON — builder coming soon)" : ""}
                  {t === "file_upload" ? " — confirm backend accepts this value" : ""}
                </option>
              ))}
            </select>
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
            <HotspotForm
              config={hsConfig}
              answers={hsAnswers}
              onChange={(c, a) => {
                setHsConfig(c);
                setHsAnswers(a);
              }}
            />
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