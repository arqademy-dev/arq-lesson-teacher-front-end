// ============================================================
// Types
// ============================================================
export type MasterStep = {
  id: string;
  subject: string;
  topic: string;
};

/** 5 = Friday, 6 = Saturday (Mon = 1) */
export type QuizDay = 5 | 6;

export type PlanConfig = {
  weeks: number;
  quizDay: QuizDay;
  quizSize: number;
};

export type PlanDay = {
  week: number;
  day: number; // 1 = Monday
  dayName: string;
  type: "learning" | "revision" | "quiz";
  /** learning: the topics of the day. quiz: every topic taught that week. */
  topics: MasterStep[];
  quizSize?: number;
};

export type StudentPlan = {
  studentId: string;
  programmeId: string;
  programmeName: string;
  config: PlanConfig;
  days: PlanDay[];
  createdAt: string;
};

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const topicCode = (topic: string) => topic.split(":")[0];

// ============================================================
// The generator (pure, no React, easy to test)
//
// Each week = learning days from Monday up to the day before the quiz,
// then the quiz on Friday or Saturday.
//   quiz on Friday   -> Mon-Thu learn (4 days)
//   quiz on Saturday -> Mon-Fri learn (5 days)
//
// Topics are spread evenly across ALL learning days in order, so:
//   more topics than days  -> some days carry 2 topics
//   fewer topics than days -> some days become revision days
// ============================================================
export function generatePlan(steps: MasterStep[], config: PlanConfig): PlanDay[] {
  const { weeks, quizDay, quizSize } = config;
  const learningPerWeek = quizDay - 1;
  const totalLearningDays = weeks * learningPerWeek;
  const total = steps.length;

  const days: PlanDay[] = [];

  for (let week = 1; week <= weeks; week++) {
    const weekTopics: MasterStep[] = [];

    for (let d = 1; d <= learningPerWeek; d++) {
      const n = (week - 1) * learningPerWeek + d; // 1-based learning day across the whole plan
      const from = Math.ceil(((n - 1) * total) / totalLearningDays);
      const to = Math.ceil((n * total) / totalLearningDays);
      const topics = steps.slice(from, to);

      weekTopics.push(...topics);
      days.push({
        week,
        day: d,
        dayName: DAY_NAMES[d - 1],
        type: topics.length ? "learning" : "revision",
        topics,
      });
    }

    days.push({
      week,
      day: quizDay,
      dayName: DAY_NAMES[quizDay - 1],
      type: "quiz",
      topics: weekTopics,
      quizSize,
    });
  }

  return days;
}

// ============================================================
// Sample programme model (in the real app this comes from the
// programme the student is enrolled in: /admin/programmes/[id]).
// Works for any length: 20, 40, ...
// ============================================================
const SEQUENCE: [string, string[]][] = [
  ["Mathematics", [
    "M1: Indices, Logarithms and Variations",
    "M2: Sequence and Series (AP & GP)",
    "M3: Quadratic and Simultaneous Equations",
    "M4: Calculus (Basic Differentiation & Integration)",
  ]],
  ["English Language", [
    "E1: Lexis and Structure (Synonyms & Antonyms)",
    "E2: Concord and Grammatical Rules",
    "E3: Sentence Structure and Clauses",
    "E4: Comprehension and Summary Strategies",
  ]],
  ["Physics", [
    "P1: Mechanics (Motion, Force, and Momentum)",
    "P2: Heat Energy and Thermodynamics",
    "P3: Waves and Optics (Reflection & Refraction)",
    "P4: Current Electricity and Circuits",
  ]],
  ["Chemistry", [
    "C1: Atomic Structure and Chemical Bonding",
    "C2: Stoichiometry and Chemical Equations",
    "C3: Rates of Reaction and Equilibrium",
    "C4: Organic Chemistry Fundamentals",
  ]],
  ["Biology", [
    "B1: Cell Structure and Functions",
    "B2: Plant and Animal Nutrition",
    "B3: Transport and Respiratory Systems",
    "B4: Genetics and Heredity",
  ]],
];

export const SAMPLE_PROGRAMME = {
  id: "univ-pathway",
  name: "University Pathway Programme",
  steps: [0, 1, 2, 3].flatMap((round) =>
    SEQUENCE.map(([subject, topics], i) => ({
      id: `step-${round * SEQUENCE.length + i + 1}`,
      subject,
      topic: topics[round],
    }))
  ) as MasterStep[],
};

// ============================================================
// Storage. localStorage stands in for your database so the sample
// works on its own. Swap these three for server actions (Drizzle).
// ============================================================
const storageKey = (studentId: string) => `arqademy:plan:${studentId}`;

export function loadPlan(studentId: string): StudentPlan | null {
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    return raw ? (JSON.parse(raw) as StudentPlan) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: StudentPlan) {
  try {
    localStorage.setItem(storageKey(plan.studentId), JSON.stringify(plan));
  } catch {
    /* ignore */
  }
}

export function clearPlan(studentId: string) {
  try {
    localStorage.removeItem(storageKey(studentId));
  } catch {
    /* ignore */
  }
}