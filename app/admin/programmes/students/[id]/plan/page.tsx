"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import PlanBuilder from "@/components/plan/PlanBuilder";

export default function StudentPlanPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <AdminShell
      title="Student Plan"
      subtitle="Arqademy"
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin/programmes/students"
          className="text-[12px] font-bold text-[var(--brand)] mb-6 block"
        >
          ← Back to Students
        </Link>

        
        <PlanBuilder studentId={id} />


      </div>
    </AdminShell>
  );
}