// Offline data store using localStorage

export interface Question {
  id: string;
  type: "mcq" | "short" | "long";
  text: string;
  marks: number;
  options: string[];
  correctAnswer: string; // For MCQ: the option text. For short: keyword(s).
}

export interface Test {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  timeLimitMinutes: number;
  questions: Question[];
  assignedStudentIds: string[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  passPercentage: number;
}

export interface Attempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>; // questionId -> answer
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeTakenSeconds: number;
}

export interface Certificate {
  id: string;
  attemptId: string;
  testId: string;
  testName: string;
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  issuedAt: string;
}

const TESTS_KEY = "ei_tests";
const ATTEMPTS_KEY = "ei_attempts";
const CERTIFICATES_KEY = "ei_certificates";
const SETTINGS_KEY = "ei_settings";

// ---- Settings ----
export function getSettings(): { passPercentage: number; instituteName: string; contactEmail: string } {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    const defaults = { passPercentage: 50, instituteName: "Ethical India Institute", contactEmail: "admin@ethicalindia.edu" };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

export function saveSettings(settings: { passPercentage: number; instituteName: string; contactEmail: string }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Tests ----
function getSeedTests(): Test[] {
  return [
    {
      id: "test-1",
      name: "Mathematics Final Exam",
      creatorId: "staff-1",
      creatorName: "Dr. Priya Sharma",
      timeLimitMinutes: 60,
      passPercentage: 50,
      assignedStudentIds: ["student-1", "student-2", "student-3"],
      status: "active",
      createdAt: "2026-03-01",
      questions: [
        { id: "q1", type: "mcq", text: "What is the value of π (pi) to two decimal places?", marks: 2, options: ["3.14", "3.16", "3.12", "3.18"], correctAnswer: "3.14" },
        { id: "q2", type: "mcq", text: "What is 15 × 12?", marks: 2, options: ["170", "180", "190", "160"], correctAnswer: "180" },
        { id: "q3", type: "mcq", text: "What is the square root of 144?", marks: 2, options: ["10", "11", "12", "14"], correctAnswer: "12" },
        { id: "q4", type: "short", text: "Define a prime number in one sentence.", marks: 5, options: [], correctAnswer: "prime" },
        { id: "q5", type: "mcq", text: "What is 2^10?", marks: 2, options: ["512", "1024", "2048", "256"], correctAnswer: "1024" },
        { id: "q6", type: "long", text: "Explain the Pythagorean theorem and give two real-world applications.", marks: 10, options: [], correctAnswer: "pythagorean" },
      ],
    },
    {
      id: "test-2",
      name: "Science Quiz",
      creatorId: "staff-2",
      creatorName: "Mr. Rahul Verma",
      timeLimitMinutes: 30,
      passPercentage: 50,
      assignedStudentIds: ["student-1", "student-2"],
      status: "active",
      createdAt: "2026-03-05",
      questions: [
        { id: "q7", type: "mcq", text: "Which planet is known as the Red Planet?", marks: 2, options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: "Mars" },
        { id: "q8", type: "mcq", text: "What is the chemical symbol for water?", marks: 2, options: ["H2O", "CO2", "NaCl", "O2"], correctAnswer: "H2O" },
        { id: "q9", type: "short", text: "Define photosynthesis in one sentence.", marks: 5, options: [], correctAnswer: "photosynthesis" },
        { id: "q10", type: "mcq", text: "What gas do plants absorb from the atmosphere?", marks: 2, options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: "Carbon Dioxide" },
      ],
    },
    {
      id: "test-3",
      name: "English Grammar",
      creatorId: "staff-1",
      creatorName: "Dr. Priya Sharma",
      timeLimitMinutes: 45,
      passPercentage: 50,
      assignedStudentIds: ["student-1", "student-3"],
      status: "active",
      createdAt: "2026-03-08",
      questions: [
        { id: "q11", type: "mcq", text: "Which is the correct spelling?", marks: 2, options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"], correctAnswer: "Accommodate" },
        { id: "q12", type: "mcq", text: "Choose the correct past tense of 'go'.", marks: 2, options: ["Goed", "Gone", "Went", "Going"], correctAnswer: "Went" },
        { id: "q13", type: "short", text: "What is a noun? Give an example.", marks: 3, options: [], correctAnswer: "noun" },
      ],
    },
  ];
}

export function getTests(): Test[] {
  const raw = localStorage.getItem(TESTS_KEY);
  if (!raw) {
    const seed = getSeedTests();
    localStorage.setItem(TESTS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

export function saveTest(test: Test) {
  const tests = getTests();
  const idx = tests.findIndex(t => t.id === test.id);
  if (idx >= 0) tests[idx] = test;
  else tests.push(test);
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
}

export function getTestsForStudent(studentId: string): Test[] {
  return getTests().filter(t => t.status === "active" && t.assignedStudentIds.includes(studentId));
}

export function getTestsForStaff(staffId: string): Test[] {
  return getTests().filter(t => t.creatorId === staffId);
}

// ---- Attempts ----
export function getAttempts(): Attempt[] {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveAttempt(attempt: Attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function getAttemptsForStudent(studentId: string): Attempt[] {
  return getAttempts().filter(a => a.studentId === studentId);
}

export function getAttemptForTest(studentId: string, testId: string): Attempt | undefined {
  return getAttempts().find(a => a.studentId === studentId && a.testId === testId);
}

export function hasAttempted(studentId: string, testId: string): boolean {
  return !!getAttemptForTest(studentId, testId);
}

// ---- Grading ----
export function gradeTest(test: Test, answers: Record<string, string>): { score: number; totalMarks: number } {
  let score = 0;
  let totalMarks = 0;
  for (const q of test.questions) {
    totalMarks += q.marks;
    if (q.type === "mcq") {
      if (answers[q.id] === q.correctAnswer) score += q.marks;
    } else {
      // For short/long: partial credit if answer contains keyword
      const answer = (answers[q.id] || "").toLowerCase();
      const keyword = q.correctAnswer.toLowerCase();
      if (answer.length > 0 && answer.includes(keyword)) {
        score += q.marks;
      } else if (answer.length > 10) {
        // Give partial credit for effort on long answers
        score += Math.floor(q.marks * 0.4);
      }
    }
  }
  return { score, totalMarks };
}

// ---- Certificates ----
export function getCertificates(): Certificate[] {
  const raw = localStorage.getItem(CERTIFICATES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function getCertificatesForStudent(studentId: string): Certificate[] {
  return getCertificates().filter(c => c.studentId === studentId);
}

export function saveCertificate(cert: Certificate) {
  const certs = getCertificates();
  certs.push(cert);
  localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certs));
}

export function generateCertificateId(): string {
  const num = getCertificates().length + 1;
  return `EI-2026-${String(num).padStart(3, "0")}`;
}
