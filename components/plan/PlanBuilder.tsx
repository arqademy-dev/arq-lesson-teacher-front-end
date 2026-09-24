"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listProgrammes,
  listProgrammeTopics,
  listLearningPlansForStudent,
  createStudentProgrammePlan,
  listAdminWeeklyQuizzes,
  ApiError,
  type Programme,
  type ProgrammeTopic,
  type CreateProgrammePlanPayload,
  type ProgrammeLearningPlan,
  type WeeklyQuizSummary,
} from "@/lib/api";
import { PlanSetup } from "./PlanSetup";
import { PlanView } from "./PlanView";

type ActivePlan = {
  plan: ProgrammeLearningPlan;
  paymentId?: string;
  amountNaira?: number;
  quizzes: WeeklyQuizSummary[];
  topics: ProgrammeTopic[];
};

export default function PlanBuilder({ studentId }: { studentId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<ActivePlan | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const progs = await listProgrammes({ status: "published", limit: 100 });
        if (cancelled) return;
        setProgrammes(Array.isArray(progs) ? progs : []);

        try {
          const plans = await listLearningPlansForStudent(studentId);
          const list = Array.isArray(plans) ? (plans as ProgrammeLearningPlan[]) : [];
          // Prefer active programme plans
          const first =
            list.find((p) => p.status === "active") ?? list[0] ?? null;

          if (first?.id) {
            const [quizzes, topics] = await Promise.all([
              listAdminWeeklyQuizzes(first.id).catch(() => []),
              first.programmeId
                ? listProgrammeTopics(first.programmeId).catch(() => [])
                : Promise.resolve([]),
            ]);
            if (!cancelled) {
              setActive({
                plan: first,
                quizzes: Array.isArray(quizzes) ? quizzes : [],
                topics: Array.isArray(topics) ? topics : [],
              });
            }
          }
        } catch {
          // no existing plan
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleSave(payload: CreateProgrammePlanPayload) {
    try {
      const result = await createStudentProgrammePlan(studentId, payload);
      const [quizzes, topics] = await Promise.all([
        listAdminWeeklyQuizzes(result.plan.id).catch(() => []),
        listProgrammeTopics(payload.programmeId).catch(() => []),
      ]);
      setActive({
        plan: result.plan,
        paymentId: result.paymentId,
        amountNaira: result.amountNaira,
        quizzes: Array.isArray(quizzes) ? quizzes : [],
        topics: Array.isArray(topics) ? topics : [],
      });
      toast.success(
        `Plan created • ₦${Number(result.amountNaira).toLocaleString()} pending payment`
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create plan"
      );
      throw err;
    }
  }

  function handleReset() {
    if (
      confirm(
        "Clear this view to set up another plan? This does not delete the plan on the server."
      )
    ) {
      setActive(null);
    }
  }

  if (!loaded) {
    return (
      <div className="animate-pulse bg-[var(--surface)] h-96 rounded-[var(--r-card)]" />
    );
  }

  if (active) {
    return (
      <PlanView
        plan={active.plan}
        quizzes={active.quizzes}
        topics={active.topics}
        paymentId={active.paymentId}
        amountNaira={active.amountNaira}
        onReset={handleReset}
      />
    );
  }

  return (
    <PlanSetup
      studentId={studentId}
      programmes={programmes}
      onSave={handleSave}
    />
  );
}