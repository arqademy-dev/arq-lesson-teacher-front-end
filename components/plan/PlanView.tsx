"use client";

import { RotateCcw } from "lucide-react";
import { DAY_NAMES, type StudentPlan } from "@/lib/plan";
import { PlanTable } from "./PlanTable";

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className="font-heading text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

type Props = {
  plan: StudentPlan;
  onReset: () => void;
};

export function PlanView({ plan, onReset }: Props) {
  const { config } = plan;
  const topicCount = plan.days.filter((d) => d.type === "quiz").reduce((n, d) => n + d.topics.length, 0);

  return (
    <div className="space-y-8">
      <section className="card border border-[var(--line)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="eyebrow text-[var(--brand)]">Active plan</div>
            <h3 className="font-heading text-xl font-semibold mt-1">{plan.programmeName}</h3>
            <p className="text-xs text-[var(--ink-3)] mt-1">
              Created {new Date(plan.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Demo only: in production a saved plan is locked */}
          <button onClick={onReset} className="btn ghost small">
            <RotateCcw className="w-4 h-4" />
            Reset plan
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Chip label="Duration" value={`${config.weeks} weeks`} />
          <Chip label="Topics" value={String(topicCount)} />
          <Chip label="Quiz day" value={DAY_NAMES[config.quizDay - 1]} />
          <Chip label="Quiz size" value={`${config.quizSize} questions`} />
        </div>
      </section>

      <PlanTable days={plan.days} />
    </div>
  );
}