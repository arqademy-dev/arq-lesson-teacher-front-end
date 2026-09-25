"use client";

import { useEffect, useState } from "react";
import {
  getEducatorMe,
  educatorLogout,
  educatorApprovalStatus,
  type EducatorProfile,
  ApiError,
} from "@/lib/api";
import { EducatorShell } from "@/components/layout/EducatorShell";
import { Loader2 } from "lucide-react";

export default function EducatorProfilePage() {
  const [me, setMe] = useState<EducatorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEducatorMe()
      .then(setMe)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load profile"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await educatorLogout();
    } finally {
      window.location.href = "/educators/login";
    }
  }

  const fullName = me ? `${me.firstName} ${me.lastName}`.trim() : "Educator";
  const status = me ? educatorApprovalStatus(me) : "pending";

  return (
    <EducatorShell
      title="Profile"
      subtitle="Account"
      userName={fullName}
      arqId={me?.arqId}
      onLogout={handleLogout}
    >
      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)] py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[var(--danger)] font-semibold">{error}</p>
      )}

      {me && !loading && (
        <div className="max-w-lg rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full grid place-items-center text-lg font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
              {me.firstName?.[0]}
              {me.lastName?.[0]}
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold">{fullName}</h2>
              <p className="text-[12px] text-[var(--ink-3)] font-mono mt-0.5">
                {me.arqId}
              </p>
            </div>
          </div>

          <dl className="space-y-3 text-[13px]">
            <Row label="Email" value={me.email} />
            <Row
              label="Status"
              value={
                <span
                  className={
                    status === "approve"
                      ? "text-[var(--ok)] font-bold"
                      : "text-[var(--warn)] font-bold"
                  }
                >
                  {status === "approve" ? "Approved" : status}
                </span>
              }
            />
            {me.specialization && (
              <Row label="Specialization" value={me.specialization} />
            )}
            {me.bio && <Row label="Bio" value={me.bio} />}
            {me.hiredDate && <Row label="Joined" value={me.hiredDate} />}
          </dl>
        </div>
      )}
    </EducatorShell>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-2 last:border-0">
      <dt className="text-[var(--ink-3)] font-semibold text-[11px] uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-right text-[var(--ink)] font-medium">{value}</dd>
    </div>
  );
}