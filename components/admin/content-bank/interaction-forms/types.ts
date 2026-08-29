// components/admin/content-bank/interaction-forms/types.ts

export type MultipleChoiceOption = {
  id: string;
  text: string;
  imageUrl?: string;
};

export type MultipleChoiceConfig = {
  question: string;
  options: MultipleChoiceOption[];
  allowMultiple: boolean;
  shuffleOptions?: boolean;
};

export type MultipleChoiceAnswers = {
  correctOptionIds: string[];
};

export function defaultMultipleChoiceConfig(): MultipleChoiceConfig {
  return {
    question: "",
    options: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    allowMultiple: false,
    shuffleOptions: false,
  };
}

export function defaultMultipleChoiceAnswers(): MultipleChoiceAnswers {
  return { correctOptionIds: [] };
}

export type FillBlankBlank = {
  id: string;
  placeholder?: string;
};

export type FillBlankConfig = {
  template: string;
  blanks: FillBlankBlank[];
  caseSensitive?: boolean;
};

export type FillBlankAnswers = {
  answers: Record<string, string[]>;
};

export function defaultFillBlankConfig(): FillBlankConfig {
  return { template: "", blanks: [], caseSensitive: false };
}

export function defaultFillBlankAnswers(): FillBlankAnswers {
  return { answers: {} };
}

/** Extracts {{id}} tokens from a template, in order, deduped. */
export function extractBlankIds(template: string): string[] {
  const matches = template.match(/\{\{(.*?)\}\}/g) ?? [];
  const ids = matches.map((m) => m.slice(2, -2).trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

/* ============================================================
   Shared: positioned regions on an image
   Used by both drag_and_drop (zones) and hotspot (hotspots).
   x/y are the CENTER of the region, all values are percentages
   (0-100) of the image's rendered box — so placement stays
   correct at any render size.
   ============================================================ */

export type RegionShape = "rect" | "circle";

export type Region = {
  id: string;
  label: string;
  shape: RegionShape;
  x: number;
  y: number;
  width?: number; // rect only, % of image width
  height?: number; // rect only, % of image height
  radius?: number; // circle only, % of image width
};

export function defaultRegion(shape: RegionShape): Region {
  return shape === "circle"
    ? { id: crypto.randomUUID(), label: "", shape, x: 50, y: 50, radius: 8 }
    : { id: crypto.randomUUID(), label: "", shape, x: 50, y: 50, width: 20, height: 15 };
}

/* ============================================================
   drag_and_drop
   ============================================================ */

export type DragAndDropItem = {
  id: string;
  label: string;
  imageUrl?: string;
};

export type DragAndDropZone = Region; // shape is always "rect" for zones

export type DragAndDropConfig = {
  backgroundImageUrl: string;
  items: DragAndDropItem[];
  zones: DragAndDropZone[];
  allowMultiplePerZone?: boolean;
};

export type DragAndDropAnswers = {
  placements: Record<string, string>; // itemId -> zoneId
};

export function defaultDragAndDropConfig(): DragAndDropConfig {
  return {
    backgroundImageUrl: "",
    items: [
      { id: crypto.randomUUID(), label: "" },
      { id: crypto.randomUUID(), label: "" },
    ],
    zones: [defaultRegion("rect")],
    allowMultiplePerZone: false,
  };
}

export function defaultDragAndDropAnswers(): DragAndDropAnswers {
  return { placements: {} };
}

/* ============================================================
   hotspot
   ============================================================ */

export type HotspotConfig = {
  imageUrl: string;
  hotspots: Region[];
  allowMultiple?: boolean;
  maxAttempts?: number;
};

export type HotspotAnswers = {
  correctHotspotIds: string[];
};

export function defaultHotspotConfig(): HotspotConfig {
  return {
    imageUrl: "",
    hotspots: [defaultRegion("rect")],
    allowMultiple: false,
    maxAttempts: 3,
  };
}

export function defaultHotspotAnswers(): HotspotAnswers {
  return { correctHotspotIds: [] };
}

/* ============================================================
   branching
   ============================================================ */

export type BranchingChoice = {
  id: string;
  text: string;
  nextStepId: string | null; // null = this choice ends the scenario
};

export type BranchingStep = {
  id: string;
  prompt: string;
  imageUrl?: string;
  choices: BranchingChoice[];
};

export type BranchingConfig = {
  steps: BranchingStep[];
  startStepId: string;
};

export type BranchingAnswers = {
  idealPath: string[]; // ordered choice ids, start step's choice first
};

export function defaultBranchingConfig(): BranchingConfig {
  const stepId = crypto.randomUUID();
  return {
    steps: [
      {
        id: stepId,
        prompt: "",
        choices: [
          { id: crypto.randomUUID(), text: "", nextStepId: null },
          { id: crypto.randomUUID(), text: "", nextStepId: null },
        ],
      },
    ],
    startStepId: stepId,
  };
}

export function defaultBranchingAnswers(): BranchingAnswers {
  return { idealPath: [] };
}

/* ============================================================
   interactive_video
   Timing (videoTimestampSeconds / pauseOnTrigger) lives at the
   top level of InteractiveElement — this form still surfaces them
   for editing (see InteractiveVideoForm), but they save onto the
   element itself, not into configSchema.
   ============================================================ */

export type InteractiveVideoChoice = {
  id: string;
  text: string;
};

export type InteractiveVideoConfig = {
  prompt: string;
  choices: InteractiveVideoChoice[];
  allowSkip?: boolean;
};

export type InteractiveVideoAnswers = {
  correctChoiceId: string;
};

export function defaultInteractiveVideoConfig(): InteractiveVideoConfig {
  return {
    prompt: "",
    choices: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    allowSkip: false,
  };
}

export function defaultInteractiveVideoAnswers(): InteractiveVideoAnswers {
  return { correctChoiceId: "" };
}

/* ============================================================
   file_upload (a.k.a. "submission")
   NOT in the OpenAPI doc's interactionType enum — confirm with
   backend that "file_upload" is an accepted value before relying
   on this in production. Shape matches the existing student-facing
   FileUploadConfig used by the submission UI.
   There's no auto-gradable answer here — a human reviews the
   submission, so correctAnswers just carries a manual-review flag
   and optional rubric notes for the reviewer.
   ============================================================ */

export type FileUploadConfig = {
  instructions?: string;
  allowFile?: boolean; // default true
  allowText?: boolean; // default true
  maxFiles?: number; // default 1, only relevant when allowFile is true
};

export type FileUploadAnswers = {
  requiresManualReview: boolean;
  gradingNotes?: string; // admin-only rubric/notes, never sent to students
};

export function defaultFileUploadConfig(): FileUploadConfig {
  return { instructions: "", allowFile: true, allowText: true, maxFiles: 1 };
}

export function defaultFileUploadAnswers(): FileUploadAnswers {
  return { requiresManualReview: true, gradingNotes: "" };
}