"use client";

import { useEffect, useState } from "react";
import {
  SAMPLE_PROGRAMME,
  clearPlan,
  loadPlan,
  savePlan,
  type StudentPlan,
} from "@/lib/plan";
import { PlanSetup } from "./PlanSetup";
import { PlanView } from "./PlanView";

export default function PlanBuilder({ studentId }: { studentId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<StudentPlan | null>(null);

  // 1. On open: look for an existing plan for this student
  useEffect(() => {
    setPlan(loadPlan(studentId));
    setLoaded(true);
  }, [studentId]);

  const handleSave = (newPlan: StudentPlan) => {
    savePlan(newPlan);
    setPlan(newPlan);
  };

  const handleReset = () => {
    if (confirm("Remove this student's plan and start again?")) {
      clearPlan(studentId);
      setPlan(null);
    }
  };

  if (!loaded) {
    return <div className="animate-pulse bg-[var(--surface)] h-96 rounded-[var(--r-card)]" />;
  }

  // 2. Plan exists -> show it.  3. No plan -> show the programme model + setup.
  return plan ? (
    <PlanView plan={plan} onReset={handleReset} />
  ) : (
    <PlanSetup studentId={studentId} programme={SAMPLE_PROGRAMME} onSave={handleSave} />
  );
}