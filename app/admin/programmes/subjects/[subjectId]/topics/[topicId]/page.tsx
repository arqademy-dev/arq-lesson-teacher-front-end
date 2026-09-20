// app/admin/programmes/subjects/[subjectId]/topics/[topicId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import Link from "next/link";
import { useState } from "react";
import { Plus, X, Play, FileText } from "lucide-react";

const TOPICS_DATA: Record<string, any> = {
  maths: [
    { id: "m1", name: "M1: Indices, Logarithms and Variations" },
    { id: "m2", name: "M2: Sequence and Series (AP & GP)" },
    { id: "m3", name: "M3: Quadratic and Simultaneous Equations" },
    { id: "m4", name: "M4: Calculus (Basic Differentiation & Integration)" },
  ],
  english: [
    { id: "e1", name: "E1: Lexis and Structure (Synonyms & Antonyms)" },
    { id: "e2", name: "E2: Concord and Grammatical Rules" },
    { id: "e3", name: "E3: Sentence Structure and Clauses" },
    { id: "e4", name: "E4: Comprehension and Summary Strategies" },
  ],
  physics: [
    { id: "p1", name: "P1: Mechanics (Motion, Force, and Momentum)" },
    { id: "p2", name: "P2: Heat Energy and Thermodynamics" },
    { id: "p3", name: "P3: Waves and Optics (Reflection & Refraction)" },
    { id: "p4", name: "P4: Current Electricity and Circuits" },
  ],
  chemistry: [
    { id: "c1", name: "C1: Atomic Structure and Chemical Bonding" },
    { id: "c2", name: "C2: Stoichiometry and Chemical Equations" },
    { id: "c3", name: "C3: Rates of Reaction and Equilibrium" },
    { id: "c4", name: "C4: Organic Chemistry Fundamentals" },
  ],
  biology: [
    { id: "b1", name: "B1: Cell Structure and Functions" },
    { id: "b2", name: "B2: Plant and Animal Nutrition" },
    { id: "b3", name: "B3: Transport and Respiratory Systems" },
    { id: "b4", name: "B4: Genetics and Heredity" },
  ],
};

export default function SingleTopicPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  const topic = TOPICS_DATA[subjectId as keyof typeof TOPICS_DATA]?.find((t: any) => t.id === topicId) || { name: "Unknown Topic" };

  const [resources, setResources] = useState<any[]>([
    {
      id: "r1",
      type: "youtube",
      title: "Introduction to Indices",
      url: "https://youtube.com/watch?v=example",
      timestamp: "0:00",
      questions: [
        {
          id: "q1",
          type: "FIB",
          timestamp: "1:45",
          question: "What does the base of an exponential expression represent?",
          answer: "base",
          feedback: "The base is the number that is raised to a power."
        }
      ]
    }
  ]);

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentResource, setCurrentResource] = useState<any>(null);
  const [newResource, setNewResource] = useState({ type: "youtube", title: "", url: "", timestamp: "" });
  type NewQuestion = {
    type: string;
    timestamp: string;
    question: string;
    answer: string;
    feedback: string;
    option0?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    correct?: number;
  };

  const [newQuestion, setNewQuestion] = useState<NewQuestion>({ type: "FIB", timestamp: "", question: "", answer: "", feedback: "" });

  const addResource = () => {
    const resource = {
      id: `r${Date.now()}`,
      ...newResource,
      questions: [],
    };
    setResources([...resources, resource]);
    setShowResourceModal(false);
  };

  const addQuestion = () => {
    if (!newQuestion.timestamp || !newQuestion.question || !newQuestion.answer) return;

    const updated = resources.map(r => 
      r.id === currentResource.id 
        ? { ...r, questions: [...r.questions, { ...newQuestion, id: `q${Date.now()}` }] }
        : r
    );
    setResources(updated);
    setShowQuestionModal(false);
  };

  return (
    <AdminShell title="Topic" subtitle={`Arqademy • ${topic.name}`} onLogout={() => window.location.href = "/admin/login"}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Link href="/admin/programmes/subjects" className="text-[12px] font-bold text-[var(--brand)]">← Back to Subjects</Link>
            <h1 className="text-4xl font-heading font-semibold tracking-[-0.04em] mt-2">{topic.name}</h1>
          </div>
          <button onClick={() => setShowResourceModal(true)} className="btn teal small flex items-center gap-2 rounded-[var(--r-card)]">
            <Plus className="w-4 h-4" />
            + Add Resource
          </button>
        </div>

        <div className="space-y-8">
          {resources.map((r) => (
            <div key={r.id} className="card border border-[var(--line)] p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    {r.type === "youtube" ? <Play className="w-6 h-6 text-[var(--brand)]" /> : <FileText className="w-6 h-6 text-[var(--brand)]" />}
                    <div>
                      <div className="font-semibold text-xl">{r.title}</div>
                      <div className="text-xs text-[var(--ink-3)] mt-1">{r.type.toUpperCase()} • {r.url}</div>
                    </div>
                  </div>
                  {r.timestamp && <div className="mt-4 inline-block px-4 py-1 bg-[var(--surface-3)] rounded-full text-xs font-medium">Timestamp: {r.timestamp}</div>}
                </div>
                <button onClick={() => { setCurrentResource(r); setShowQuestionModal(true); }} className="btn ghost small">
                  + Add Question at Timestamp
                </button>
              </div>

              {r.questions.length > 0 && (
                <div className="mt-8">
                  <div className="text-sm font-semibold text-[var(--brand)] mb-4">Questions at {r.timestamp || "timestamps"}</div>
                  {r.questions.map((q: any) => (
                    <div key={q.id} className="card border border-[var(--line)] p-6 mb-4">
                      <div className="text-xs text-[var(--ink-3)] mb-1">At {q.timestamp}</div>
                      <div className="font-medium">{q.question}</div>
                      <div className="text-xs text-[var(--ink-3)] mt-2">Answer: <strong>{q.answer}</strong></div>
                      <div className="text-xs text-[var(--ink-3)] mt-1">Feedback: {q.feedback}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-[var(--navy-soft)] bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg border border-[var(--line)]">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--line)]">
              <h3 className="font-heading text-xl">Add Resource</h3>
              <button onClick={() => setShowResourceModal(false)} className="text-[var(--navy-soft)] hover:text-[var(--navy)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value, timestamp: "" })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]">
                <option value="youtube">YouTube Video</option>
                <option value="pdf">PDF Document</option>
                <option value="link">External Link</option>
              </select>
              <input placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
              <input placeholder="URL" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
              <input placeholder="Timestamp (optional)" value={newResource.timestamp} onChange={(e) => setNewResource({ ...newResource, timestamp: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
            </div>
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[var(--line)]">
              <button onClick={() => setShowResourceModal(false)} className="btn ghost small rounded-[var(--r-card)]">Cancel</button>
              <button onClick={addResource} className="btn teal small rounded-[var(--r-card)]">Add Resource</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-[var(--navy-soft)] bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg border border-[var(--line)]">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--line)]">
              <h3 className="font-heading text-xl">Add Question at Timestamp</h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-[var(--navy-soft)] hover:text-[var(--navy)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <select value={newQuestion.type} onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]">
                <option value="FIB">Fill-in-the-Blank</option>
                <option value="OBJ">Objective (Multiple Choice)</option>
              </select>

              <input placeholder="Timestamp" value={newQuestion.timestamp} onChange={(e) => setNewQuestion({ ...newQuestion, timestamp: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
              <input placeholder="Question text" value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />

              {newQuestion.type === "FIB" && <input placeholder="Correct answer" value={newQuestion.answer} onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />}
              {newQuestion.type === "OBJ" && (
                <div className="grid grid-cols-2 gap-4">
                  {["A", "B", "C", "D"].map((letter, i) => (
                    <input key={i} placeholder={`${letter}. Option`} value={newQuestion[`option${i}` as keyof typeof newQuestion] || ""} onChange={(e) => setNewQuestion({ ...newQuestion, [`option${i}` as keyof typeof newQuestion]: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
                  ))}
                  <select value={newQuestion.correct || ""} onChange={(e) => setNewQuestion({ ...newQuestion, correct: Number(e.target.value) })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]">
                    <option value="">Correct answer</option>
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                  </select>
                </div>
              )}

              <input placeholder="Feedback" value={newQuestion.feedback} onChange={(e) => setNewQuestion({ ...newQuestion, feedback: e.target.value })} className="w-full px-5 py-4 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)]" />
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[var(--line)]">
              <button onClick={() => setShowQuestionModal(false)} className="btn ghost small rounded-[var(--r-card)]">Cancel</button>
              <button onClick={addQuestion} className="btn teal small rounded-[var(--r-card)]">Add Question</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}