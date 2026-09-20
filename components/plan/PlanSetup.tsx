"use client";

import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import {
  generatePlan,
  type MasterStep,
  type PlanConfig,
  type QuizDay,
  type StudentPlan,
} from "@/lib/plan";
import { PlanTable } from "./PlanTable";

const WEEK_OPTIONS = [3, 4, 5, 6, 8];
const QUIZ_SIZES = [10, 50, 100];

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)] font-semibold";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2";

type Props = {
  studentId: string;
  programme: { id: string; name: string; steps: MasterStep[] };
  onSave: (plan: StudentPlan) => void;
};

export function PlanSetup({ studentId, programme, onSave }: Props) {
  const [weeks, setWeeks] = useState(5);
  const [quizDay, setQuizDay] = useState<QuizDay>(5);
  const [quizSize, setQuizSize] = useState(50);

  const config: PlanConfig = { weeks, quizDay, quizSize };

  // The preview regenerates instantly whenever a setting changes
  const days = useMemo(
    () => generatePlan(programme.steps, { weeks, quizDay, quizSize }),
    [programme.steps, weeks, quizDay, quizSize]
  );

  const learningDays = weeks * (quizDay - 1);
  const revisionDays = days.filter((d) => d.type === "revision").length;
  const perDay = (programme.steps.length / learningDays).toFixed(1);

  const handleSave = () => {
    onSave({
      studentId,
      programmeId: programme.id,
      programmeName: programme.name,
      config,
      days,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Programme model */}
      <section className="card border border-[var(--line)] p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="eyebrow text-[var(--brand)]">No plan yet • Programme model</div>
            <h3 className="font-heading text-xl font-semibold mt-1">{programme.name}</h3>
          </div>
          <span className="text-xs font-semibold text-[var(--ink-3)]">
            {programme.steps.length} topics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 max-h-64 overflow-auto pr-2">
          {programme.steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 text-sm">
              <span className="flex-none w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold bg-[var(--surface-3)] text-[var(--ink-3)]">
                {i + 1}
              </span>
              <span className="truncate text-[var(--ink)]">{s.topic}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Settings */}
      <section className="card border border-[var(--line)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Weeks</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className={fieldClass}
            >
              {WEEK_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} weeks
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Quiz day (end of week)</label>
            <select
              value={quizDay}
              onChange={(e) => setQuizDay(Number(e.target.value) as QuizDay)}
              className={fieldClass}
            >
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Quiz size</label>
            <select
              value={quizSize}
              onChange={(e) => setQuizSize(Number(e.target.value))}
              className={fieldClass}
            >
              {QUIZ_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
          <p className="text-xs text-[var(--ink-3)] leading-relaxed">
            {programme.steps.length} topics over {learningDays} learning days (about {perDay} per
            day) + {weeks} quizzes
            {revisionDays > 0 && ` • ${revisionDays} revision day${revisionDays === 1 ? "" : "s"}`}
          </p>

          <button onClick={handleSave} className="btn teal">
            <CalendarCheck className="w-4 h-4" />
            Save plan for student
          </button>
        </div>
      </section>

      {/* 3. Live preview */}
      <div>
        <h3 className="font-heading text-lg font-semibold mb-4">Preview</h3>
        <PlanTable days={days} />
      </div>
    </div>
  );
}