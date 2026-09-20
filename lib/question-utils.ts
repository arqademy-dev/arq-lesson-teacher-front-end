import type { Question, Subject } from "@/lib/question-bank";

/** Append a question to the end of a topic. */
export function insertQuestion(
  subjects: Subject[],
  subjectId: string,
  topicId: string,
  question: Question
): Subject[] {
  return subjects.map((s) =>
    s.id !== subjectId
      ? s
      : {
          ...s,
          topics: s.topics.map((t) =>
            t.id !== topicId ? t : { ...t, questions: [...t.questions, question] }
          ),
        }
  );
}

/** Remove a question wherever it currently lives. */
export function removeQuestion(subjects: Subject[], questionId: string): Subject[] {
  return subjects.map((s) => ({
    ...s,
    topics: s.topics.map((t) => ({
      ...t,
      questions: t.questions.filter((q) => q.id !== questionId),
    })),
  }));
}

/** Replace a question in place (keeps its position in the topic). */
export function replaceQuestion(subjects: Subject[], question: Question): Subject[] {
  return subjects.map((s) => ({
    ...s,
    topics: s.topics.map((t) => ({
      ...t,
      questions: t.questions.map((q) => (q.id === question.id ? question : q)),
    })),
  }));
}