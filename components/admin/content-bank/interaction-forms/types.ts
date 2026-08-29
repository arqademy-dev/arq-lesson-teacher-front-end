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