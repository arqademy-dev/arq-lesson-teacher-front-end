"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listProgrammes,
  listProgrammeTopics,
  getAdminStudentProgrammePlan,
  updateAdminStudentProgrammePlan,
  createStudentProgrammePlan,
  listAdminWeeklyQuizzes,
  ApiError,
  type Programme,
  type ProgrammeTopic,
  type CreateProgrammePlanPayload,
  type UpdateProgrammePlanPayload,
  type ProgrammeLearningPlan,
  type StudentPayment,
  type WeeklyQuizSummary,
} from "@/lib/api";
import { PlanSetup } from "./PlanSetup";
import { PlanView } from "./PlanView";

type ActivePlan = {
  plan: ProgrammeLearningPlan;
  payment: StudentPayment | null;
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

        // CHANGED — was listLearningPlansForStudent(), the OLD class-based
        // endpoint, which has no idea programme-based plans exist. This is
        // why a plan vanished on reload: it was never actually being fetched.
        try {
          const { plan, payment } = await getAdminStudentProgrammePlan(studentId);
          if (cancelled) return;

          const [quizzes, topics] = await Promise.all([
            listAdminWeeklyQuizzes(plan.id).catch(() => []),
            plan.programmeId
              ? listProgrammeTopics(plan.programmeId).catch(() => [])
              : Promise.resolve([]),
          ]);
          if (!cancelled) {
            setActive({
              plan,
              payment,
              quizzes: Array.isArray(quizzes) ? quizzes : [],
              topics: Array.isArray(topics) ? topics : [],
            });
          }
        } catch (err) {
          // 404 just means no plan yet — anything else is worth surfacing
          if (!(err instanceof ApiError && err.status === 404)) {
            toast.error(err instanceof ApiError ? err.message : "Failed to load existing plan");
          }
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
        payment: { id: result.paymentId, amountNaira: result.amountNaira, status: "pending" } as StudentPayment,
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

  // NEW — small edits only (require-correct-answers toggle, pause/cancel).
  async function handleUpdate(patch: UpdateProgrammePlanPayload) {
    if (!active) return;
    try {
      const updated = await updateAdminStudentProgrammePlan(studentId, active.plan.id, patch);
      setActive((prev) => (prev ? { ...prev, plan: updated } : prev));
      toast.success("Plan updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update plan");
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
        paymentId={active.payment?.id}
        amountNaira={active.payment?.amountNaira}
        paymentStatus={active.payment?.status}
        onUpdate={handleUpdate}
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