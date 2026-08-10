"use client";

import { useState } from "react";
import type {
  SafeInteractiveElement,
  InteractionAnswer,
  FillBlankConfig,
  BranchingConfig,
  HotspotConfig,
  DragAndDropConfig,
  ImageSequencingConfig,
  SubmissionResult,
} from "../types";
import { MultipleChoice } from "./MultipleChoice";
import type { MultipleChoiceConfig } from "../types";
import { FillBlank } from "./FillBlank";
import { Branching } from "./Branching";
import { Hotspot } from "./Hotspot";
import { DragAndDrop } from "./DragAndDrop";
import { ImageSequencing } from "./ImageSequencing";
import { cn } from "@/lib/utils";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  element: SafeInteractiveElement;
  result?: SubmissionResult;
  /** Prior answer from server (refresh restore) */
  initialAnswer?: Record<string, unknown> | null;
  /** If require-correct is on and last attempt was wrong → keep retryable */
  allowRetry?: boolean;
  submitting?: boolean;
  onSubmit: (payload: InteractionAnswer) => void;
};

const SUPPORTED = new Set([
  "fill_blank",
  "branching",
  "hotspot",
  "drag_and_drop",
  "image_sequencing",
  "multiple_choice",
  "interactive_video",
]);

export function InteractionRenderer({
  element,
  result,
  initialAnswer,
  allowRetry = false,
  submitting,
  onSubmit,
}: Props) {
  const [answer, setAnswer] = useState<InteractionAnswer | null>(
    (initialAnswer as InteractionAnswer) ?? null
  );  const disabled = !!result || !!submitting;
  
  const locked =
    !!submitting ||
    (result?.isCorrect === true) ||
    (result != null && result.isCorrect === false && !allowRetry);
  
  const type = element.interactionType;
  const cfg = element.configSchema || {};
  const canSubmit = !!answer && !result && !submitting && SUPPORTED.has(String(type));


  return (
    <div className="mt-6 pt-5 border-t border-[var(--line-soft)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)] bg-[var(--surface-3)] px-2.5 py-1 rounded-full">
          {String(type).replace(/_/g, " ")}
        </span>
        {element.videoTimestampSeconds != null && (
          <span className="text-[11px] font-semibold text-[var(--ink-4)]">
            @ {element.videoTimestampSeconds}s
          </span>
        )}
      </div>

      {type === "fill_blank" && (
        <FillBlank
          config={cfg as FillBlankConfig}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {type === "branching" && (
        <Branching
          config={cfg as BranchingConfig}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {type === "hotspot" && (
        <Hotspot
          config={cfg as HotspotConfig}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {type === "drag_and_drop" && (
        <DragAndDrop
          config={cfg as DragAndDropConfig}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {type === "image_sequencing" && (
        <ImageSequencing
          config={cfg as ImageSequencingConfig}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {(type === "multiple_choice" || type === "interactive_video") && (
        <MultipleChoice
          config={{
            question:
              (cfg as { question?: string; prompt_text?: string }).question ||
              (cfg as { prompt_text?: string }).prompt_text,
            options: (cfg as { options?: string[] }).options || [],
          }}
          disabled={disabled}
          onReady={setAnswer}
        />
      )}

      {!SUPPORTED.has(String(type)) && (
        <div className="rounded-[12px] border border-dashed border-[var(--line)] px-4 py-5 text-[13px] text-[var(--ink-3)]">
          Renderer for <strong className="text-[var(--ink-2)]">{type}</strong>{" "}
          is not wired yet.
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {result && (
          <div className={cn(/* ok / danger styles */)}>
            {result.isCorrect
              ? `Correct · +${result.scoreAwarded} pts`
              : allowRetry
                ? `Not quite · try again`
                : `Not quite · ${result.scoreAwarded} pts`}
          </div>
        )}
        {(!result || (result && !result.isCorrect && allowRetry)) &&
          SUPPORTED.has(String(type)) && (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => answer && onSubmit(answer)}
            className={cn(
              "inline-flex items-center gap-2 h-11 px-5 rounded-[10px] text-[13px] font-bold",
              "transition-all duration-150 active:scale-[0.99]",
              canSubmit
                ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] shadow-[var(--shadow-sm)]"
                : "bg-[var(--surface-3)] text-[var(--ink-4)] cursor-not-allowed"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit answer
              </>
            )}
          </button>
        )}

        {result && (
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-[13px] font-bold w-full sm:w-auto",
              result.isCorrect
                ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                : "bg-[var(--danger-soft)] text-[var(--danger)]"
            )}
          >
            {result.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 flex-none" />
            ) : (
              <XCircle className="w-5 h-5 flex-none" />
            )}
            <span>
              {result.isCorrect
                ? `Correct · +${result.scoreAwarded} pts`
                : `Not quite · ${result.scoreAwarded} pts`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}