"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import {
  enrollAdminStudent,
  listProgrammes,
  listAllEducators,
  ApiError,
  type Programme,
  type AdminEducator,
  type AdminEnrollStudentResult,
} from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (result: AdminEnrollStudentResult) => void;
};

const field =
  "w-full px-4 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]";
const label =
  "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-1.5";

export function AddStudentModal({ open, onClose, onCreated }: Props) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [educators, setEducators] = useState<AdminEducator[]>([]);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [programId, setProgramId] = useState("");
  const [educatorId, setEducatorId] = useState(""); // "" = unassigned
  const [password, setPassword] = useState("");

  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRel, setGuardianRel] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listProgrammes({ status: "published", limit: 100 }).catch(() => []),
      listAllEducators().catch(() => []),
    ]).then(([progs, eds]) => {
      setProgrammes(Array.isArray(progs) ? progs : []);
      setEducators(Array.isArray(eds) ? eds : []);
    });
  }, [open]);

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAcademicLevel("");
    setProgramId("");
    setEducatorId("");
    setPassword("");
    setGuardianName("");
    setGuardianPhone("");
    setGuardianEmail("");
    setGuardianRel("");
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!programId) {
      toast.error("Select a programme (or use class placement on backend)");
      return;
    }

    setSaving(true);
    try {
      const result = await enrollAdminStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        academicLevel: academicLevel.trim() || undefined,
        programId,
        educatorId: educatorId || undefined,
        password: password.trim() || undefined,
        guardian: guardianName.trim()
          ? {
              fullName: guardianName.trim(),
              phone: guardianPhone.trim() || undefined,
              email: guardianEmail.trim() || undefined,
              relationship: guardianRel.trim() || undefined,
            }
          : undefined,
      });

      toast.success("Student enrolled");
      if (result.credentials.temporaryPassword) {
        toast.message(
          `Temp password: ${result.credentials.temporaryPassword}`,
          { duration: 12000 }
        );
      }
      onCreated(result);
      reset();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to enroll student"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Add Student"
      className="max-w-xl"
      footer={
        <>
          <button
            className="btn ghost small"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn teal small inline-flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enroll student
          </button>
        </>
      }
    >
      <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>First name *</label>
            <input
              className={field}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={label}>Last name *</label>
            <input
              className={field}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className={label}>Email (login) *</label>
          <input
            type="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Phone</label>
            <input
              className={field}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={label}>Academic level</label>
            <input
              className={field}
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              placeholder="e.g. SS3"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className={label}>Programme *</label>
          <select
            className={field}
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            disabled={saving}
          >
            <option value="">Select programme…</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Educator</label>
          <select
            className={field}
            value={educatorId}
            onChange={(e) => setEducatorId(e.target.value)}
            disabled={saving}
          >
            <option value="">— Unassigned —</option>
            {educators.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Password (optional)</label>
          <input
            type="text"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to auto-generate"
            disabled={saving}
          />
        </div>

        <div className="border-t border-[var(--line)] pt-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)]">
            Parent / Guardian (optional)
          </p>
          <div>
            <label className={label}>Full name</label>
            <input
              className={field}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Phone</label>
              <input
                className={field}
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label className={label}>Email</label>
              <input
                className={field}
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div>
            <label className={label}>Relationship</label>
            <input
              className={field}
              value={guardianRel}
              onChange={(e) => setGuardianRel(e.target.value)}
              placeholder="mother, father, guardian…"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}