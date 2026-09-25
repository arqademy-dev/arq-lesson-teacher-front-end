"use client";

import { useEffect, useState } from "react";
import { getEducatorMe, educatorLogout } from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { Mail, Phone } from "lucide-react";

export default function ContactHqPage() {
  const [name, setName] = useState("Educator");
  const [arqId, setArqId] = useState<string | undefined>();

  useEffect(() => {
    getEducatorMe()
      .then((me) => {
        setName(`${me.firstName} ${me.lastName}`.trim());
        setArqId(me.arqId);
      })
      .catch(() => null);
  }, []);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  return (
    <EducatorShell
      title="Contact HQ"
      subtitle="Support"
      userName={name}
      arqId={arqId}
      onLogout={handleLogout}
    >
      <div className="max-w-md rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
          Need help with enrolment, payments, or your account? Reach ARQADEMY
          headquarters.
        </p>
        <a
          href="mailto:support@arqademy.com"
          className="flex items-center gap-3 text-[13px] font-semibold text-[var(--brand)]"
        >
          <Mail className="w-4 h-4" />
          support@arqademy.com
        </a>
        {/* Update phone when you have a real number */}
        <div className="flex items-center gap-3 text-[13px] text-[var(--ink-3)]">
          <Phone className="w-4 h-4" />
          HQ line — coming soon
        </div>
      </div>
    </EducatorShell>
  );
}