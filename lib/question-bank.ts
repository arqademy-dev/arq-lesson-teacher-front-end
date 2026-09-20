export type Question = {
  id: string;
  text: string;
  options: string[];
  /** index into `options` */
  correct: number;
  feedback: string;
};

export type Topic = {
  id: string;
  name: string;
  questions: Question[];
};

export type Subject = {
  id: string;
  name: string;
  topics: Topic[];
};

// Seed data. Replace with an API call when the backend is ready.
export const SUBJECTS: Subject[] = [
  {
    id: "maths",
    name: "Mathematics",
    topics: [
      {
        id: "m1",
        name: "M1: Indices, Logarithms and Variations",
        questions: [
          { id: "q1", text: "If x + 3 = 7, what is x?", options: ["2", "3", "4", "5"], correct: 2, feedback: "Subtract 3 from both sides." },
          { id: "q2", text: "Simplify 3^4 × 3^2", options: ["3^6", "3^8", "3^12", "9^3"], correct: 0, feedback: "Add the exponents when multiplying the same base." },
        ],
      },
      {
        id: "m2",
        name: "M2: Sequence and Series (AP & GP)",
        questions: [
          { id: "q3", text: "Find the 5th term of the AP: 2, 5, 8, ...", options: ["11", "13", "14", "15"], correct: 2, feedback: "a = 2, d = 3, so T5 = 2 + 4(3) = 14." },
          { id: "q4", text: "Sum of the first 4 terms of the GP: 1, 3, 9, ...", options: ["40", "43", "82", "85"], correct: 0, feedback: "1 + 3 + 9 + 27 = 40, or S = a(rⁿ − 1)/(r − 1)." },
        ],
      },
      {
        id: "m3",
        name: "M3: Quadratic and Simultaneous Equations",
        questions: [
          { id: "q5", text: "Solve: x² - 5x + 6 = 0", options: ["x = 2 or x = 3", "x = 1 or x = 6", "x = -2 or x = -3", "x = 1 or x = 2"], correct: 0, feedback: "Factorise: (x - 2)(x - 3) = 0." },
        ],
      },
      {
        id: "m4",
        name: "M4: Calculus (Basic Differentiation & Integration)",
        questions: [
          { id: "q6", text: "Differentiate x² + 3x + 2", options: ["2x + 3", "2x + 3x", "2x + 1", "2x + 2"], correct: 0, feedback: "d/dx of x² is 2x, of 3x is 3, of a constant is 0." },
        ],
      },
    ],
  },
  {
    id: "english",
    name: "English Language",
    topics: [
      {
        id: "e1",
        name: "E1: Lexis and Structure (Synonyms & Antonyms)",
        questions: [
          { id: "q7", text: "Synonym of 'benevolent'", options: ["Kind", "Cruel", "Angry", "Sad"], correct: 0, feedback: "Benevolent means kind and generous." },
          { id: "q8", text: "Antonym of 'generous'", options: ["Mean", "Kind", "Helpful", "Friendly"], correct: 0, feedback: "Mean (stingy) is the opposite of generous." },
        ],
      },
      {
        id: "e2",
        name: "E2: Concord and Grammatical Rules",
        questions: [
          { id: "q9", text: "Choose the correct sentence:", options: ["She go to school.", "She goes to school.", "She went to school yesterday."], correct: 1, feedback: "Third person singular takes -s in the simple present." },
        ],
      },
      {
        id: "e3",
        name: "E3: Sentence Structure and Clauses",
        questions: [
          { id: "q10", text: "Which is a complex sentence?", options: ["I ran.", "Because I ran, I was late.", "I ran and I jumped."], correct: 1, feedback: "It has one independent clause and one dependent clause." },
        ],
      },
      {
        id: "e4",
        name: "E4: Comprehension and Summary Strategies",
        questions: [
          { id: "q11", text: "A good summary should:", options: ["Copy the passage word for word", "Restate the main points briefly in your own words", "Add your personal opinions", "Include every detail"], correct: 1, feedback: "Summaries are short and capture only the main points." },
        ],
      },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    topics: [
      {
        id: "p1",
        name: "P1: Mechanics (Motion, Force, and Momentum)",
        questions: [
          { id: "q12", text: "Newton's First Law states:", options: ["Force equals mass times acceleration.", "Objects at rest stay at rest unless acted on by a force.", "Action equals reaction."], correct: 1, feedback: "The first law is the law of inertia." },
        ],
      },
      {
        id: "p2",
        name: "P2: Heat Energy and Thermodynamics",
        questions: [
          { id: "q13", text: "The SI unit of heat is:", options: ["Joule", "Newton", "Watt", "Kelvin"], correct: 0, feedback: "Heat is energy, so it is measured in joules." },
        ],
      },
      {
        id: "p3",
        name: "P3: Waves and Optics (Reflection & Refraction)",
        questions: [
          { id: "q14", text: "Angle of incidence equals angle of reflection in:", options: ["Refraction", "Reflection", "Diffraction", "Interference"], correct: 1, feedback: "This is the law of reflection." },
        ],
      },
      {
        id: "p4",
        name: "P4: Current Electricity and Circuits",
        questions: [
          { id: "q15", text: "Ohm's Law is:", options: ["V = IR", "I = VR", "R = VI", "P = VI"], correct: 0, feedback: "Voltage = Current × Resistance." },
        ],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    topics: [
      {
        id: "c1",
        name: "C1: Atomic Structure and Chemical Bonding",
        questions: [
          { id: "q16", text: "Proton number of carbon is:", options: ["6", "12", "8", "14"], correct: 0, feedback: "Carbon's atomic number is 6." },
        ],
      },
      {
        id: "c2",
        name: "C2: Stoichiometry and Chemical Equations",
        questions: [
          { id: "q17", text: "Balance: H₂ + O₂ → H₂O", options: ["2H₂ + O₂ → 2H₂O", "H₂ + O₂ → 2H₂O", "2H₂ + 2O₂ → 2H₂O"], correct: 0, feedback: "Two H₂ and one O₂ give two H₂O." },
        ],
      },
      {
        id: "c3",
        name: "C3: Rates of Reaction and Equilibrium",
        questions: [
          { id: "q18", text: "Le Chatelier's Principle states:", options: ["The system shifts to oppose a change", "The system stays the same", "The system speeds up"], correct: 0, feedback: "Equilibrium shifts to reduce the effect of the change." },
        ],
      },
      {
        id: "c4",
        name: "C4: Organic Chemistry Fundamentals",
        questions: [
          { id: "q19", text: "The functional group of an alcohol is:", options: ["-OH", "-COOH", "-CHO", "-NH₂"], correct: 0, feedback: "Alcohols contain the hydroxyl (-OH) group." },
        ],
      },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    topics: [
      {
        id: "b1",
        name: "B1: Cell Structure and Functions",
        questions: [
          { id: "q20", text: "The powerhouse of the cell is:", options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], correct: 0, feedback: "Mitochondria produce ATP." },
        ],
      },
      {
        id: "b2",
        name: "B2: Plant and Animal Nutrition",
        questions: [
          { id: "q21", text: "Photosynthesis mainly occurs in:", options: ["Roots", "Woody stems", "Leaves", "Flowers"], correct: 2, feedback: "Leaves have the most chlorophyll." },
        ],
      },
      {
        id: "b3",
        name: "B3: Transport and Respiratory Systems",
        questions: [
          { id: "q22", text: "Blood vessels that carry blood away from the heart are:", options: ["Arteries", "Veins", "Capillaries"], correct: 0, feedback: "Arteries carry blood away from the heart." },
        ],
      },
      {
        id: "b4",
        name: "B4: Genetics and Heredity",
        questions: [
          { id: "q23", text: "DNA is found in:", options: ["Mitochondria only", "Nucleus only", "Both nucleus and mitochondria", "Cytoplasm only"], correct: 2, feedback: "Mitochondria have their own small DNA as well." },
        ],
      },
    ],
  },
];

