// components/admin/content-bank/interaction-forms/types.ts
//
// These shapes are reverse-engineered from real seed scripts that
// successfully wrote to the production backend — treat the field
// NAMES and STRUCTURE here as ground truth, more reliable than the
// OpenAPI doc's open-ended configSchema/correctAnswers description.

/* ============================================================
   multiple_choice
   Single-answer only. Options are plain strings, matched by exact
   text — there are no per-option ids.
   ============================================================ */

export type MultipleChoiceConfig = {
  question: string;
  options: string[];
};

export type MultipleChoiceAnswers = {
  answer: string; // must exactly match one entry in options
};

export function defaultMultipleChoiceConfig(): MultipleChoiceConfig {
  return { question: "", options: ["", ""] };
}

export function defaultMultipleChoiceAnswers(): MultipleChoiceAnswers {
  return { answer: "" };
}

/* ============================================================
   fill_blank
   Template uses [blankKey] tokens (square brackets, not curly).
   Each blank is answered via a dropdown of admin-supplied choices,
   not free text.
   ============================================================ */

export type FillBlankConfig = {
  prompt_text: string;
  dropdown_options: Record<string, string[]>; // blankKey -> choices shown to student
};

export type FillBlankAnswers = Record<string, string>; // blankKey -> correct choice

export function defaultFillBlankConfig(): FillBlankConfig {
  return { prompt_text: "", dropdown_options: {} };
}

export function defaultFillBlankAnswers(): FillBlankAnswers {
  return {};
}

/** Extracts [blankKey] tokens from prompt_text, in order, deduped. */
export function extractBlankKeys(promptText: string): string[] {
  const matches = promptText.match(/\[(.*?)\]/g) ?? [];
  const keys = matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  return Array.from(new Set(keys));
}

/* ============================================================
   drag_and_drop
   A flat match-the-term exercise — no image, no canvas positions.
   ============================================================ */

export type DragAndDropDraggable = { id: string; text: string };
export type DragAndDropDropzone = { id: string; label: string };

export type DragAndDropConfig = {
  instructions?: string;
  draggables: DragAndDropDraggable[];
  dropzones: DragAndDropDropzone[];
};

export type DragAndDropAnswers = Record<string, string>; // draggableId -> dropzoneId

export function defaultDragAndDropConfig(): DragAndDropConfig {
  return {
    instructions: "",
    draggables: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    dropzones: [
      { id: crypto.randomUUID(), label: "" },
      { id: crypto.randomUUID(), label: "" },
    ],
  };
}

export function defaultDragAndDropAnswers(): DragAndDropAnswers {
  return {};
}

/* ============================================================
   hotspot
   Labeled regions on an image — a "label the diagram" exercise, not
   a "guess which one" quiz. Position (x_coords/y_coords) is a
   percentage string, top-left anchored; size (width/height) is a
   fixed pixel string. There is no correctness-picking step:
   correctAnswers is always derived, mapping each hotspot's id to
   its own label.
   ============================================================ */

export type Hotspot = {
  id: string;
  label: string;
  x_coords: string; // e.g. "20%"
  y_coords: string; // e.g. "30%"
  width: string; // e.g. "150px"
  height: string; // e.g. "60px"
};

export type HotspotConfig = {
  backgroundImageUrl: string;
  hotspots: Hotspot[];
};

export type HotspotAnswers = Record<string, string>; // hotspotId -> label

export function defaultHotspot(): Hotspot {
  return {
    id: crypto.randomUUID(),
    label: "",
    x_coords: "20%",
    y_coords: "30%",
    width: "150px",
    height: "60px",
  };
}

export function defaultHotspotConfig(): HotspotConfig {
  return { backgroundImageUrl: "", hotspots: [defaultHotspot()] };
}

/** correctAnswers is never edited directly — always derived from labels. */
export function deriveHotspotAnswers(config: HotspotConfig): HotspotAnswers {
  const out: HotspotAnswers = {};
  for (const h of config.hotspots) out[h.id] = h.label;
  return out;
}

/* ============================================================
   branching
   A single decision point — one scenario, several choices, each
   choice routes to a feedback message via its `next` key. Not a
   multi-step tree.
   ============================================================ */

export type BranchingChoice = { id: string; text: string; next: string }; // next = a key into feedback

export type BranchingConfig = {
  scenario: string;
  choices: BranchingChoice[];
  feedback: Record<string, string>; // key -> message shown for that outcome
};

export type BranchingAnswers = {
  answer: string; // id of the correct choice
};

export function defaultBranchingConfig(): BranchingConfig {
  return {
    scenario: "",
    choices: [
      { id: crypto.randomUUID(), text: "", next: "correct_feedback" },
      { id: crypto.randomUUID(), text: "", next: "incorrect_feedback" },
    ],
    feedback: {
      correct_feedback: "Correct!",
      incorrect_feedback: "Not quite — think again.",
    },
  };
}

export function defaultBranchingAnswers(): BranchingAnswers {
  return { answer: "" };
}

/* ============================================================
   image_sequencing
   Despite the name, items only need id+text — an image is optional.
   The order they're arranged in IS the correct order; students see
   a shuffled copy and must reorder it.
   ============================================================ */

export type SequenceItem = { id: string; text: string; imageUrl?: string };

export type ImageSequencingConfig = {
  instructions?: string;
  items: SequenceItem[]; // arranged in the correct order
};

export type ImageSequencingAnswers = {
  order: string[]; // item ids, derived from items[] order at save time
};

export function defaultImageSequencingConfig(): ImageSequencingConfig {
  return {
    instructions: "",
    items: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
  };
}

export function defaultImageSequencingAnswers(): ImageSequencingAnswers {
  return { order: [] };
}

/* ============================================================
   interactive_video
   Same single-answer pattern as multiple_choice. Timing
   (videoTimestampSeconds / pauseOnTrigger) lives at the top level
   of InteractiveElement, not here.
   ============================================================ */

export type InteractiveVideoConfig = {
  prompt_text: string;
  options: string[];
};

export type InteractiveVideoAnswers = {
  answer: string; // must exactly match one entry in options
};

export function defaultInteractiveVideoConfig(): InteractiveVideoConfig {
  return { prompt_text: "", options: ["", ""] };
}

export function defaultInteractiveVideoAnswers(): InteractiveVideoAnswers {
  return { answer: "" };
}

/* ============================================================
   file_upload (resourceType "submission")
   Confirmed real — seeded directly against the backend. Reviewed
   manually by an educator, so there's no auto-gradable answer.
   ============================================================ */

export type FileUploadConfig = {
  instructions?: string;
  allowFile?: boolean; // default true
  allowText?: boolean; // default true
  maxFiles?: number; // default 1
};

export type FileUploadAnswers = {
  gradingNotes?: string; // admin-only — not in the original seed, but harmless to add
};

export function defaultFileUploadConfig(): FileUploadConfig {
  return { instructions: "", allowFile: true, allowText: true, maxFiles: 1 };
}

export function defaultFileUploadAnswers(): FileUploadAnswers {
  return {};
}