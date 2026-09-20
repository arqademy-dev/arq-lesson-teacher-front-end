"use client";

import { useEffect, useState } from "react";
import { User, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EDUCATORS, EMPTY_FORM, PROGRAMMES, type StudentForm } from "@/lib/students";

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (form: StudentForm) => void;
};

export function AddStudentModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);

  // Start blank every time the modal opens
  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const set = (key: keyof StudentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Student"
      footer={
        <>
          <button onClick={onClose} className="btn ghost small">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="btn teal small"
          >
            Save Student
          </button>
        </>
      }
    >
      <div className="p-6 space-y-8">
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Student Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Full Name">
              <input value={form.name} onChange={set("name")} className={fieldClass} />
            </Field>
            <Field label="Email (or Parent/Guardian)">
              <input type="email" value={form.email} onChange={set("email")} className={fieldClass} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={set("phone")} className={fieldClass} />
            </Field>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Programme &amp; Educator
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Programme">
              <select value={form.programme} onChange={set("programme")} className={fieldClass}>
                {PROGRAMMES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Educator (if known)">
              <select value={form.educator} onChange={set("educator")} className={fieldClass}>
                {EDUCATORS.map((ed) => (
                  <option key={ed} value={ed}>
                    {ed === "—" ? "Unassigned" : ed}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Parent / Guardian</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Full Name">
              <input value={form.parentName} onChange={set("parentName")} className={fieldClass} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.parentPhone} onChange={set("parentPhone")} className={fieldClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.parentEmail} onChange={set("parentEmail")} className={fieldClass} />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  );
}