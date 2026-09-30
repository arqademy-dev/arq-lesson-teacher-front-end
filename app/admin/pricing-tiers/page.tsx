"use client";

import { useEffect, useState } from "react";
import {
  listProgrammes,
  listProgrammePrices,
  createProgrammePrice,
  updateProgrammePrice,
  type Programme,
  type ProgrammePrice,
} from "@/lib/api";
import { AdminShell } from "@/components/layout/AdminShell";
import { Loader2, Plus, Check } from "lucide-react";

export default function AdminPricingTiersPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prices, setPrices] = useState<ProgrammePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProgrammes()
      .then((p) => {
        setProgrammes(p);
        if (p[0]) setSelectedId(p[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    setLoadingPrices(true);
    listProgrammePrices(selectedId)
      .then(setPrices)
      .finally(() => setLoadingPrices(false));
  }, [selectedId]);

  async function refreshPrices() {
    if (!selectedId) return;
    setPrices(await listProgrammePrices(selectedId));
  }

  async function onCreate() {
    if (!selectedId || !amount) return;

    setSaving(true);
    setError(null);

    try {
      await createProgrammePrice({
        programmeId: selectedId,
        priceNaira: Number(amount),
        label: label || undefined,
        isActive: true,
      });

      setLabel("");
      setAmount("");
      await refreshPrices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create price"
      );
    } finally {
      setSaving(false);
    }
  }

  async function onMakeActive(id: string) {
    await updateProgrammePrice(id, { isActive: true });
    await refreshPrices();
  }

  async function onEditAmount(price: ProgrammePrice) {
    const next = window.prompt(
      "New price (₦)",
      String(price.priceNaira)
    );

    if (!next) return;

    await updateProgrammePrice(price.id, {
      priceNaira: Number(next),
    });

    await refreshPrices();
  }

  return (
    <AdminShell
      title="Pricing Tiers"
      subtitle="Arqademy Academy"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-3xl">
        <div className="mb-6">
          <h2 className="font-heading text-[20px] text-[var(--ink)] mb-1">
            Programme pricing
          </h2>

          <p className="text-[13px] text-[var(--ink-3)]">
            One active price per programme — the learning-plan invoice always
            uses whichever price is active.
          </p>
        </div>

        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[var(--ink-3)]" />
        ) : (
          <>
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-11 px-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[13px] font-semibold mb-6"
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 mb-6">
              <p className="text-[12px] font-bold text-[var(--ink-3)] mb-3 uppercase tracking-wide">
                Add a new price
              </p>

              <div className="flex flex-wrap gap-3">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Label (optional) — e.g. Standard"
                  className="h-10 px-3 rounded-[9px] border border-[var(--line)] text-[13px] flex-1 min-w-[160px]"
                />

                <input
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Amount in ₦"
                  className="h-10 px-3 rounded-[9px] border border-[var(--line)] text-[13px] w-40"
                />

                <button
                  type="button"
                  onClick={onCreate}
                  disabled={saving || !amount}
                  className="h-10 px-4 rounded-[9px] bg-[var(--brand)] text-white text-[12.5px] font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>

              {error && (
                <p className="mt-2 text-[12px] font-semibold text-[var(--danger)]">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
              {loadingPrices ? (
                <div className="p-6">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--ink-3)]" />
                </div>
              ) : prices.length === 0 ? (
                <p className="p-6 text-[13px] text-[var(--ink-3)] text-center">
                  No prices yet for this programme.
                </p>
              ) : (
                <ul>
                  {prices.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--line-soft)] last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--ink)]">
                          ₦{p.priceNaira.toLocaleString()}

                          {p.label && (
                            <span className="ml-2 text-[11px] font-semibold text-[var(--ink-3)]">
                              {p.label}
                            </span>
                          )}
                        </p>

                        <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[var(--ok-soft)] text-[var(--ok)]">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMakeActive(p.id)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--brand)]"
                        >
                          Make active
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditAmount(p)}
                        className="text-[11px] font-bold text-[var(--brand)]"
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
