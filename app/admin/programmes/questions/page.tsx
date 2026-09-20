"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFormModal } from "@/components/questions/QuestionFormModal";
import { SUBJECTS, type Question, type Subject } from "@/lib/question-bank";
import { insertQuestion, removeQuestion, replaceQuestion } from "@/lib/question-utils";

const ALL_TOPICS = "all";

const selectClass =
  "w-full px-5 py-3 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-[var(--ink)] font-semibold";

const labelClass =
  "block text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] mb-2";

// What the form modal is doing (null = closed). For "edit", subjectId/topicId
// are where the question currently lives.
type FormTarget = {
  mode: "add" | "edit";
  subjectId: string;
  topicId: string;
  question?: Question;
};

export default function AdminQuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [topicId, setTopicId] = useState<string>(ALL_TOPICS);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);

  const currentSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  const visibleTopics =
    topicId === ALL_TOPICS
      ? currentSubject.topics
      : currentSubject.topics.filter((t) => t.id === topicId);

  const totalQuestions = visibleTopics.reduce((sum, t) => sum + t.questions.length, 0);

  const onSubjectChange = (id: string) => {
    setSubjectId(id);
    setTopicId(ALL_TOPICS);
  };

  const handleSave = (targetSubjectId: string, targetTopicId: string, question: Question) => {
    const origin = formTarget;

    setSubjects((prev) => {
      if (origin?.mode === "edit") {
        const stayedPut =
          origin.subjectId === targetSubjectId && origin.topicId === targetTopicId;

        // Same topic: update in place. Different topic: move it to the end of the new one.
        return stayedPut
          ? replaceQuestion(prev, question)
          : insertQuestion(removeQuestion(prev, question.id), targetSubjectId, targetTopicId, question);
      }
      return insertQuestion(prev, targetSubjectId, targetTopicId, question);
    });

    // Jump to where the question now lives so it's visible straight away
    setSubjectId(targetSubjectId);
    setTopicId(targetTopicId);
    setFormTarget(null);
  };

  const handleDelete = (questionId: string) => {
    if (confirm("Delete this question?")) {
      setSubjects((prev) => removeQuestion(prev, questionId));
    }
  };

  return (
    <AdminShell
      title="Questions"
      subtitle="Arqademy Question Bank"
      pendingCount={0}
      onLogout={() => (window.location.href = "/admin/login")}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Filters */}
        <div className="card border border-[var(--line)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Subject</label>
              <select
                value={currentSubject.id}
                onChange={(e) => onSubjectChange(e.target.value)}
                className={selectClass}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className={selectClass}
              >
                <option value={ALL_TOPICS}>All topics ({currentSubject.topics.length})</option>
                {currentSubject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-4 text-xs text-[var(--ink-3)]">
            {totalQuestions} question{totalQuestions === 1 ? "" : "s"} in {currentSubject.name}
            {topicId !== ALL_TOPICS && visibleTopics[0] ? ` • ${visibleTopics[0].name}` : ""}
          </p>
        </div>

        {/* One view card per topic */}
        {visibleTopics.map((topic) => (
          <section key={topic.id} className="card border border-[var(--line)] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="min-w-0">
                <div className="eyebrow text-[var(--brand)]">{currentSubject.name}</div>
                <h3 className="font-heading text-2xl font-semibold mt-1">{topic.name}</h3>
                <p className="text-xs text-[var(--ink-3)] mt-1">
                  {topic.questions.length} question{topic.questions.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                onClick={() =>
                  setFormTarget({ mode: "add", subjectId: currentSubject.id, topicId: topic.id })
                }
                className="btn teal small"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {topic.questions.length === 0 ? (
              <div className="rounded-[var(--r-card)] border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--ink-3)]">
                No questions in this topic yet.
              </div>
            ) : (
              <div className="space-y-5">
                {topic.questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    number={i + 1}
                    onEdit={() =>
                      setFormTarget({
                        mode: "edit",
                        subjectId: currentSubject.id,
                        topicId: topic.id,
                        question: q,
                      })
                    }
                    onDelete={() => handleDelete(q.id)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <QuestionFormModal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        subjects={subjects}
        defaultSubjectId={formTarget?.subjectId ?? currentSubject.id}
        defaultTopicId={formTarget?.topicId ?? currentSubject.topics[0].id}
        question={formTarget?.question}
        onSave={handleSave}
      />
    </AdminShell>
  );
}