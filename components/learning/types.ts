/* ============================================================
   Learning library types — matches Arqademy JSON contract
   ============================================================ */

export type ResourceType =
  | "video"
  | "pdf"
  | "article"
  | "image"
  | "interactive"
  | "quiz";

export type InteractionType =
  | "drag_and_drop"
  | "fill_blank"
  | "hotspot"
  | "branching"
  | "interactive_video"
  | "image_sequencing"
  | "multiple_choice";

/* ---------- Content blocks (article.contentBody) ---------- */

export type HeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

export type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type ImageBlock = {
  type: "image";
  url: string;
  altText?: string;
  caption?: string;
};

export type FileBlock = {
  type: "file";
  url: string;
  fileName: string;
  mimeType?: string;
};

export type BulletListBlock = {
  type: "bullet_list";
  items: string[];
};

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | FileBlock
  | BulletListBlock;

/* ---------- Interactive config schemas ---------- */

export type FillBlankConfig = {
  prompt_text: string;
  dropdown_options: Record<string, string[]>;
};

export type BranchingChoice = {
  id: string;
  text: string;
  next: string;
};

export type BranchingConfig = {
  scenario: string;
  choices: BranchingChoice[];
  feedback: Record<string, string>;
};

export type HotspotZone = {
  id: string;
  label: string;
  width: string;
  height: string;
  x_coords: string;
  y_coords: string;
};

export type HotspotConfig = {
  backgroundImageUrl: string;
  hotspots: HotspotZone[];
};

export type DragItem = { id: string; text: string };
export type DropZone = { id: string; label: string };

export type DragAndDropConfig = {
  instructions?: string;
  draggables: DragItem[];
  dropzones: DropZone[];
};

export type SequencingItem = { id: string; text: string };

export type ImageSequencingConfig = {
  instructions?: string;
  items: SequencingItem[];
};

export type MultipleChoiceConfig = {
  question?: string;
  prompt?: string;
  options: string[];
};

/* ---------- Core entities ---------- */

export type SafeInteractiveElement = {
  id: string;
  resourceId: string;
  interactionType: InteractionType | string;
  videoTimestampSeconds?: number | null;
  pauseOnTrigger: boolean;
  configSchema: Record<string, unknown>;
};

export type Resource = {
  id: string;
  topicId: string;
  title: string;
  resourceType: ResourceType | string;
  urlOrPath: string;
  dayNumber: number;
  sortOrder: number;
  contentBody?: ContentBlock[] | null;
  interactiveElements?: SafeInteractiveElement[];
};

export type Topic = {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  expectedDurationDays: number;
};

export type ScheduledSession = {
  id: string;
  learningPlanTopicId: string;
  scheduledDate: string;
  sessionDayNumber: number;
  isCompleted: boolean;
  educatorNotes?: string | null;
};

export type SessionSubmission = {
  interactiveElementId: string;
  studentResponse: Record<string, unknown>;
  isCorrect: boolean;
  scoreAwarded: number;
  attemptNumber?: number;
  submittedAt?: string;
};

export type CurrentSessionResponse = {
  session: ScheduledSession;
  isOverdue: boolean;
  topic: Topic;
  learningPlanId: string;
  requireCorrectAnswersToProgress?: boolean;
  resources: Resource[];
  submissions?: SessionSubmission[];
};

export type SubmissionResult = {
  isCorrect: boolean;
  scoreAwarded: number;
  log?: {
    id: string;
    studentId?: string;
    interactiveElementId?: string;
    scheduledSessionId?: string;
    studentResponse?: Record<string, unknown>;
    isCorrect?: boolean;
    scoreAwarded?: number;
    submittedAt?: string;
  };
};

export type StudentDashboardSummary = {
  currentSession: CurrentSessionResponse | null;
  progress: {
    totalTopics: number;
    completedTopics: number;
    percentComplete: number;
  };
  payments: {
    hasPendingPayment: boolean;
    hasSuccessfulPayment: boolean;
  };
  performance: {
    totalSubmissions: number;
    correctSubmissions: number;
    accuracyPercent: number;
    averageScore: number;
  };
};

/* ---------- Submit payload shapes (student → API) ---------- */

export type FillBlankAnswer = Record<string, string>; // { blank1: "figurative", blank2: "rhetorical" }
export type BranchingAnswer = { answer: string }; // { answer: "c1" }
export type HotspotAnswer = Record<string, string>; // { zone_1: "..." }
export type DragAndDropAnswer = Record<string, string>; // { d1: "zone_personification" }
export type ImageSequencingAnswer = { order: string[] };
export type MultipleChoiceAnswer = { answer: string };

export type InteractionAnswer =
  | FillBlankAnswer
  | BranchingAnswer
  | HotspotAnswer
  | DragAndDropAnswer
  | ImageSequencingAnswer
  | MultipleChoiceAnswer
  | Record<string, unknown>;