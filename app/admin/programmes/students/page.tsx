"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Mail, Phone, Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Modal } from "@/components/ui/Modal";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import {
  SAMPLE_STUDENTS,
  STATUS_STYLE,
  educatorLabel,
  initials,
  type Student,
  type StudentForm,
} from "@/lib/students";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>(SAMPLE_STUDENTS);
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const activeCount = students.filter((s) => s.status === "Active").length;

  const q = search.trim().toLowerCase();
  const visible = students.filter((s) => {
    if (filter === "active" && s.status !== "Active") return false;
    if (!q) return true;
    return [s.name, s.email, s.phone, s.programme, s.educator].some((v) =>
      v?.toLowerCase().includes(q)
    );
  });

  const handleAdd = (form: StudentForm) => {
    if (!form.name.trim()) return;

    setStudents((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        programme: form.programme,
        educator: form.educator,
        parentName: form.parentName.trim() || undefined,
        parentPhone: form.parentPhone.trim() || undefined,
        parentEmail: form.parentEmail.trim() || undefined,
        progress: 0,
        status: "Active",
      },
    ]);
    setShowAddModal(false);
  };

  const hasParent =
    !!selectedStudent &&
    !!(selectedStudent.parentName || selectedStudent.parentPhone || selectedStudent.parentEmail);

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
              { key: "all", label: `All (${students.length})` },
              { key: "active", label: `Active (${activeCount})` },
            ] as const
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

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, programme…"
            className="w-full pl-11 pr-4 py-2.5 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)] text-sm"
          />
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn teal small ml-auto">
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Table */}
      <div className="card border border-[var(--line)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-3)]">
              {["Student", "Programme", "Educator", "Progress", "Status"].map((h) => (
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-[var(--ink-3)]">
                  No students match your search.
                </td>
              </tr>
            )}

            {visible.map((s) => (
              <tr
                key={s.id}
                className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)] transition"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-none w-9 h-9 rounded-full grid place-items-center text-xs font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--ink)] truncate">{s.name}</div>
                      <div className="text-[11px] text-[var(--ink-3)] truncate">
                        {s.email || s.phone || "No contact yet"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-[var(--ink-2)]">{s.programme}</td>

                <td className="px-6 py-4 text-sm">
                  <span className={s.educator === "—" ? "text-[var(--ink-4)] italic" : "text-[var(--ink-2)]"}>
                    {educatorLabel(s.educator)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--teal)] transition-all"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm font-semibold">{s.progress}%</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${STATUS_STYLE[s.status]}`}
                  >
                    {s.status}
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
                    <button onClick={() => setSelectedStudent(s)} className="btn ghost small">
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
        Showing {visible.length} of {students.length} students
      </p>

      {/* Add student */}
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
      />

      {/* Student details */}
      <Modal
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Details"
        footer={
          selectedStudent && (
            <>
              <button onClick={() => setSelectedStudent(null)} className="btn ghost small">
                Close
              </button>
              <Link
                href={`/admin/programmes/students/${selectedStudent.id}/plan`}
                className="btn teal small"
              >
                <CalendarDays className="w-4 h-4" />
                View Plan
              </Link>
            </>
          )
        }
      >
        {selectedStudent && (
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-none w-14 h-14 rounded-full grid place-items-center text-lg font-heading font-semibold bg-[var(--brand-soft-2)] text-[var(--brand)]">
                  {initials(selectedStudent.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-heading truncate">{selectedStudent.name}</h2>
                  <p className="text-[var(--ink-3)] text-sm mt-0.5">{selectedStudent.programme}</p>
                </div>
              </div>
              <span
                className={`flex-none px-4 py-1 text-xs font-bold rounded-full ${STATUS_STYLE[selectedStudent.status]}`}
              >
                {selectedStudent.status}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Progress</h4>
                <div className="h-3 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--teal)] transition-all"
                    style={{ width: `${selectedStudent.progress}%` }}
                  />
                </div>
                <div className="font-mono text-4xl font-semibold mt-2">
                  {selectedStudent.progress}%
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Educator</h4>
                <div className="text-[var(--ink)] font-medium">
                  {educatorLabel(selectedStudent.educator)}
                </div>
              </div>
            </div>

            {(selectedStudent.email || selectedStudent.phone) && (
              <div className="mt-8">
                <h4 className="font-semibold mb-2">Contact</h4>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {selectedStudent.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--brand)]" />
                      {selectedStudent.email}
                    </div>
                  )}
                  {selectedStudent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[var(--brand)]" />
                      {selectedStudent.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasParent && (
              <div className="mt-8">
                <h4 className="font-semibold mb-2">Parent / Guardian</h4>
                <div className="text-sm space-y-1.5">
                  {selectedStudent.parentName && (
                    <div className="font-medium">{selectedStudent.parentName}</div>
                  )}
                  {selectedStudent.parentPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[var(--brand)]" />
                      {selectedStudent.parentPhone}
                    </div>
                  )}
                  {selectedStudent.parentEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--brand)]" />
                      {selectedStudent.parentEmail}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}