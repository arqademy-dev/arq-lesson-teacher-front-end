"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Pencil,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/AdminShell";
import { Modal } from "@/components/ui/Modal";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import {
  listAdminStudents,
  getAdminStudent,
  updateAdminStudent,
  deactivateAdminStudent,
  listProgrammes,
  listAllEducators,
  ApiError,
  type AdminStudent,
  type Programme,
  type AdminEducator,
  type AdminEnrollStudentResult,
} from "@/lib/api";

function fullName(s: AdminStudent) {
  return `${s.firstName} ${s.lastName}`.trim();
}

function initials(s: AdminStudent) {
  return `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [educators, setEducators] = useState<AdminEducator[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"all" | "active">("all");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState(""); // "" = all programmes

  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    academicLevel: "",
    programId: "",
    educatorId: "",
    active: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAdminStudents({
        programId: programFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  }, [programFilter, search]);

  useEffect(() => {
    listProgrammes({ status: "published", limit: 100 })
      .then((p) => setProgrammes(Array.isArray(p) ? p : []))
      .catch(() => {});
    listAllEducators()
      .then((e) => setEducators(Array.isArray(e) ? e : []))
      .catch(() => {});
  }, []);

  // Debounce search slightly via effect dependency on search + programFilter
  useEffect(() => {
    const t = setTimeout(() => loadStudents(), 250);
    return () => clearTimeout(t);
  }, [loadStudents]);

  const educatorName = useCallback(
    (educatorId: string | null) => {
      if (!educatorId) return "—";
      const e = educators.find((x) => x.id === educatorId);
      return e ? `${e.firstName} ${e.lastName}` : "—";
    },
    [educators]
  );

  const visible = useMemo(() => {
    if (filter === "active") return students.filter((s) => s.active);
    return students;
  }, [students, filter]);

  const activeCount = students.filter((s) => s.active).length;

  async function openDetail(id: string) {
    setDetailLoading(true);
    setSelected(null);
    try {
      const detail = await getAdminStudent(id);
      setSelected(detail);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to load student"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function openEdit(s: AdminStudent) {
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone ?? "",
      academicLevel: s.academicLevel ?? "",
      programId: s.programId ?? "",
      educatorId: s.educatorId ?? "",
      active: s.active,
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!selected) return;
    setSavingEdit(true);
    try {
      const updated = await updateAdminStudent(selected.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        academicLevel: editForm.academicLevel.trim() || null,
        programId: editForm.programId || null,
        educatorId: editForm.educatorId || null,
        active: editForm.active,
      });
      setSelected(updated);
      setStudents((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      toast.success("Student updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeactivate(s: AdminStudent) {
    if (!confirm(`Deactivate ${fullName(s)}? They will no longer be able to log in.`)) {
      return;
    }
    try {
      await deactivateAdminStudent(s.id);
      toast.success("Student deactivated");
      setSelected(null);
      await loadStudents();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to deactivate"
      );
    }
  }

  function onCreated(_result: AdminEnrollStudentResult) {
    loadStudents();
  }

  const primaryGuardian = selected?.guardians?.[0];

  return (
    <AdminShell
      title="Students"
      subtitle="Arqademy"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <Link
        href="/admin/programmes"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] mb-6 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Programmes
      </Link>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-[var(--surface-3)] p-1 rounded-[var(--r-card)]">
          {(
            [
              { key: "all" as const, label: `All (${students.length})` },
              { key: "active" as const, label: `Active (${activeCount})` },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-5 py-2 text-sm font-semibold rounded-[var(--r-ctl)] transition ${
                filter === tab.key
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--ink-3)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email…"
            className="w-full pl-11 pr-4 py-2.5 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm"
          />
        </div>

        {/* Sort / filter by programme */}
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-4 py-2.5 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm font-semibold min-w-[180px]"
        >
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn teal small ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Table */}
      <div className="card border border-[var(--line)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-3)]">
              {["Student", "Programme", "Educator", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]"
                >
                  {h}
                </th>
              ))}
              <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-[var(--ink-3)]">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            )}

            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-[var(--ink-3)]">
                  No students match.
                </td>
              </tr>
            )}

            {!loading &&
              visible.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)] transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-none w-9 h-9 rounded-full grid place-items-center text-xs font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                        {initials(s)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{fullName(s)}</div>
                        <div className="text-[11px] text-[var(--ink-3)] truncate">
                          {s.email || s.phone || "No contact"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--ink-2)]">
                    {s.programmeTitle || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={
                        !s.educatorId
                          ? "text-[var(--ink-4)] italic"
                          : "text-[var(--ink-2)]"
                      }
                    >
                      {educatorName(s.educatorId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                        s.active
                          ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                          : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/programmes/students/${s.id}/plan`}
                        className="btn ghost small"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Plan
                      </Link>
                      <button
                        onClick={() => openDetail(s.id)}
                        className="btn ghost small"
                      >
                        Open <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--ink-3)]">
        Showing {visible.length} student{visible.length === 1 ? "" : "s"}
      </p>

      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={onCreated}
      />

      {/* Detail modal */}
      <Modal
        open={!!selected || detailLoading}
        onClose={() => setSelected(null)}
        title="Student Details"
        footer={
          selected && (
            <>
              <button
                onClick={() => handleDeactivate(selected)}
                className="btn ghost small text-[var(--warn)]"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </button>
              <button
                onClick={() => openEdit(selected)}
                className="btn ghost small"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <Link
                href={`/admin/programmes/students/${selected.id}/plan`}
                className="btn teal small"
              >
                <CalendarDays className="w-4 h-4" />
                View Plan
              </Link>
            </>
          )
        }
      >
        {detailLoading && (
          <div className="p-10 text-center text-[var(--ink-3)]">
            <Loader2 className="w-5 h-5 animate-spin inline" /> Loading…
          </div>
        )}
        {selected && !detailLoading && (
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-none w-14 h-14 rounded-full grid place-items-center text-lg font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                  {initials(selected)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-heading truncate">
                    {fullName(selected)}
                  </h2>
                  <p className="text-[var(--ink-3)] text-sm mt-0.5">
                    {selected.programmeTitle || "No programme"}
                  </p>
                  <p className="text-[11px] text-[var(--ink-3)] font-mono mt-0.5">
                    {selected.arqId}
                  </p>
                </div>
              </div>
              <span
                className={`flex-none px-4 py-1 text-xs font-bold rounded-full ${
                  selected.active
                    ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                    : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                }`}
              >
                {selected.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">Educator</h4>
                <div className="text-sm">
                  {educatorName(selected.educatorId)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Level</h4>
                <div className="text-sm">
                  {selected.academicLevel || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Contact</h4>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--brand)]" />
                  {selected.email}
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--brand)]" />
                    {selected.phone}
                  </div>
                )}
              </div>
            </div>

            {primaryGuardian && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Parent / Guardian</h4>
                <div className="text-sm space-y-1.5">
                  <div className="font-medium">{primaryGuardian.fullName}</div>
                  {primaryGuardian.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[var(--brand)]" />
                      {primaryGuardian.phone}
                    </div>
                  )}
                  {primaryGuardian.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--brand)]" />
                      {primaryGuardian.email}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => !savingEdit && setEditOpen(false)}
        title="Edit Student"
        footer={
          <>
            <button
              className="btn ghost small"
              onClick={() => setEditOpen(false)}
              disabled={savingEdit}
            >
              Cancel
            </button>
            <button
              className="btn teal small"
              onClick={handleSaveEdit}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
                First name
              </label>
              <input
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
                Last name
              </label>
              <input
                className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
              Email
            </label>
            <input
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
              Phone
            </label>
            <input
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
              Programme
            </label>
            <select
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
              value={editForm.programId}
              onChange={(e) =>
                setEditForm({ ...editForm, programId: e.target.value })
              }
            >
              <option value="">— None —</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--ink-3)] mb-1">
              Educator
            </label>
            <select
              className="w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)]"
              value={editForm.educatorId}
              onChange={(e) =>
                setEditForm({ ...editForm, educatorId: e.target.value })
              }
            >
              <option value="">— Unassigned —</option>
              {educators.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editForm.active}
              onChange={(e) =>
                setEditForm({ ...editForm, active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
      </Modal>
    </AdminShell>
  );
}