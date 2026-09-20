"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical, CheckCircle, Plus, Pencil, X } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Modal } from "@/components/ui/Modal";

type Step = {
  id: string;
  subject: string;
  topic: string;
};

const SUBJECTS = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology"];

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  Mathematics: [
    "M1: Indices, Logarithms and Variations",
    "M2: Sequence and Series (AP & GP)",
    "M3: Quadratic and Simultaneous Equations",
    "M4: Calculus (Basic Differentiation & Integration)",
  ],
  "English Language": [
    "E1: Lexis and Structure (Synonyms & Antonyms)",
    "E2: Concord and Grammatical Rules",
    "E3: Sentence Structure and Clauses",
    "E4: Comprehension and Summary Strategies",
  ],
  Physics: [
    "P1: Mechanics (Motion, Force, and Momentum)",
    "P2: Heat Energy and Thermodynamics",
    "P3: Waves and Optics (Reflection & Refraction)",
    "P4: Current Electricity and Circuits",
  ],
  Chemistry: [
    "C1: Atomic Structure and Chemical Bonding",
    "C2: Stoichiometry and Chemical Equations",
    "C3: Rates of Reaction and Equilibrium",
    "C4: Organic Chemistry Fundamentals",
  ],
  Biology: [
    "B1: Cell Structure and Functions",
    "B2: Plant and Animal Nutrition",
    "B3: Transport and Respiratory Systems",
    "B4: Genetics and Heredity",
  ],
};

// Round-robin: M1, E1, P1, C1, B1, M2, E2, ... → 20 steps
const INITIAL_STEPS: Step[] = [0, 1, 2, 3].flatMap((round) =>
  SUBJECTS.map((subject, i) => ({
    id: String(round * SUBJECTS.length + i + 1),
    subject,
    topic: TOPICS_BY_SUBJECT[subject][round],
  }))
);

const PROGRAMME_NAMES: Record<string, string> = {
  "univ-pathway": "University Pathway Programme",
  "jss3-ss1": "JSS3 → SS1",
  "primary-secondary": "Primary → Secondary",
};

const DEFAULT_STEP = { subject: SUBJECTS[0], topic: TOPICS_BY_SUBJECT[SUBJECTS[0]][0] };

const fieldClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)]";

export default function ProgrammeBuilderPage() {
  const params = useParams();
  const progId = params.id as string;
  const progName = PROGRAMME_NAMES[progId] ?? "Programme";

  const [status, setStatus] = useState<"draft" | "published" | "locked">("published");
  const [isMounted, setIsMounted] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);

  // Add / edit modal
  const [showModal, setShowModal] = useState(false);
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState(DEFAULT_STEP);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const next = Array.from(steps);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setSteps(next);
  };

  const openModal = (step?: Step) => {
    if (step) {
      setEditStepId(step.id);
      setStepForm({ subject: step.subject, topic: step.topic });
    } else {
      setEditStepId(null);
      setStepForm(DEFAULT_STEP);
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const saveStep = () => {
    if (!stepForm.subject || !stepForm.topic) return;

    if (editStepId) {
      setSteps((prev) => prev.map((s) => (s.id === editStepId ? { ...s, ...stepForm } : s)));
    } else {
      // Unique id, so deleting steps never causes duplicate ids
      setSteps((prev) => [...prev, { id: `step-${Date.now()}`, ...stepForm }]);
    }
    closeModal();
  };

  const deleteStep = (id: string) => {
    if (confirm("Delete this step from the sequence?")) {
      setSteps((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Changing the subject must also reset the topic, otherwise the topic
  // <select> holds a value that isn't in the new subject's list.
  const onSubjectChange = (subject: string) => {
    setStepForm({ subject, topic: TOPICS_BY_SUBJECT[subject][0] });
  };

  if (!isMounted) {
    return (
      <AdminShell
        title="Programme Builder"
        subtitle={`Arqademy • ${progName}`}
        onLogout={() => (window.location.href = "/admin/login")}
      >
        <div className="max-w-5xl mx-auto animate-pulse bg-[var(--surface)] h-96 rounded-[var(--r-card)]" />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Programme Builder"
      subtitle={`Arqademy • ${progName}`}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
          <div>
            <Link href="/admin/programmes" className="text-[12px] font-bold text-[var(--brand)]">
              ← Back to Programmes
            </Link>
            <h1 className="text-4xl font-heading font-semibold tracking-[-0.04em] mt-2">
              {progName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="px-5 py-3 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm font-semibold"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="locked">Locked</option>
            </select>

            <button onClick={() => openModal()} className="btn ghost small">
              <Plus className="w-4 h-4" />
              Add New Step
            </button>

            <button className="btn teal small">Save Programme</button>
          </div>
        </div>

        {/* Master sequence header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h3 className="font-heading text-2xl">
            Program Model • {steps.length}-Step Master Sequence
          </h3>
          <div className="text-xs text-[var(--ink-3)] font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--ok)]" />
            Editable • Drag to reorder
          </div>
        </div>

        {/* Sortable list */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="steps">
            {(dropProvided) => (
              <div
                {...dropProvided.droppableProps}
                ref={dropProvided.innerRef}
                className="card border border-[var(--line)] overflow-hidden"
              >
                {steps.map((step, index) => (
                  <Draggable key={step.id} draggableId={step.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`px-6 py-5 flex items-center justify-between border-b border-[var(--line)] last:border-0 transition ${
                          snapshot.isDragging
                            ? "bg-[var(--surface)] shadow-[var(--shadow-lg)]"
                            : "hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <div className="flex items-center gap-6 min-w-0">
                          <div
                            {...dragProvided.dragHandleProps}
                            className="text-[var(--ink-3)] hover:text-[var(--brand)] cursor-grab active:cursor-grabbing p-1"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center font-heading text-base font-semibold bg-[var(--surface-3)] text-[var(--ink-3)]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--ink)]">{step.subject}</div>
                            <div className="text-[11px] text-[var(--ink-3)] mt-0.5 truncate">
                              {step.topic}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-none">
                          <button
                            onClick={() => openModal(step)}
                            title="Edit step"
                            aria-label="Edit step"
                            className="p-2 rounded-[var(--r-ctl)] text-[var(--ink-3)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStep(step.id)}
                            title="Delete step"
                            aria-label="Delete step"
                            className="p-2 rounded-[var(--r-ctl)] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add / edit modal */}
        <Modal
          open={showModal}
          onClose={closeModal}
          title={editStepId ? "Edit Step" : "Add New Step"}
          className="max-w-lg"
          footer={
            <>
              <button onClick={closeModal} className="btn ghost small">
                Cancel
              </button>
              <button onClick={saveStep} className="btn teal small">
                {editStepId ? "Update Step" : "Add Step"}
              </button>
            </>
          }
        >
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                Subject
              </label>
              <select
                value={stepForm.subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className={fieldClass}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2">
                Topic
              </label>
              <select
                value={stepForm.topic}
                onChange={(e) => setStepForm({ ...stepForm, topic: e.target.value })}
                className={fieldClass}
              >
                {TOPICS_BY_SUBJECT[stepForm.subject].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        {/* Info */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-[var(--ink-3)]">
          <div>✅ {SUBJECTS.length} subjects • 4 topics each</div>
          <div>✅ Drag any step to change order</div>
          <div>✅ Use the pencil to change a step&apos;s subject or topic</div>
        </div>

        <div className="mt-10 text-center text-[12px] text-[var(--ink-3)]">
          This is the <strong>editable Program Model</strong>. Change the order any way you like.
          The student will follow exactly this sequence.
        </div>
      </div>
    </AdminShell>
  );
}