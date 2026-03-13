// Offline data store using localStorage

// ---- Batches ----
export interface Batch {
  id: string;
  name: string;
  timings: string; // e.g. "Mon-Fri 9:00 AM - 12:00 PM"
  createdAt: string;
}

const BATCHES_KEY = "ei_batches";

export function getBatches(): Batch[] {
  const raw = localStorage.getItem(BATCHES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveBatch(batch: Batch) {
  const batches = getBatches();
  const idx = batches.findIndex(b => b.id === batch.id);
  if (idx >= 0) batches[idx] = batch;
  else batches.push(batch);
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
}

export function deleteBatch(batchId: string) {
  const batches = getBatches().filter(b => b.id !== batchId);
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  // Remove batchId from all users
  const raw = localStorage.getItem("ei_users");
  if (raw) {
    const users = JSON.parse(raw);
    const updated = users.map((u: any) => u.batchId === batchId ? { ...u, batchId: undefined } : u);
    localStorage.setItem("ei_users", JSON.stringify(updated));
  }
}

export function getStudentsByBatch(batchId: string): string[] {
  const raw = localStorage.getItem("ei_users");
  if (!raw) return [];
  return JSON.parse(raw).filter((u: any) => u.batchId === batchId).map((u: any) => u.id);
}


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
  certificateEnabled?: boolean;
  liveCameraEnabled?: boolean;
}

// ---- Feedback ----
export interface Feedback {
  id: string;
  testId: string;
  testName: string;
  studentId: string;
  studentName: string;
  batchId?: string;
  feedback: string;
  submittedAt: string;
}

const FEEDBACK_KEY = "ei_feedback";

export function getFeedbacks(): Feedback[] {
  const raw = localStorage.getItem(FEEDBACK_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveFeedback(fb: Feedback) {
  const feedbacks = getFeedbacks();
  feedbacks.push(fb);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
}

export function getFeedbacksForStudent(studentId: string): Feedback[] {
  return getFeedbacks().filter(f => f.studentId === studentId);
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
  status: "pending" | "approved" | "rejected";
}

const TESTS_KEY = "ei_tests";
const ATTEMPTS_KEY = "ei_attempts";
const CERTIFICATES_KEY = "ei_certificates";
const SETTINGS_KEY = "ei_settings";

// ---- Settings ----
export function getSettings(): { passPercentage: number; instituteName: string; contactEmail: string; logo?: string } {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    const defaults = { passPercentage: 50, instituteName: "Ethical India Institute", contactEmail: "admin@ethicalindia.edu" };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

export function saveSettings(settings: { passPercentage: number; instituteName: string; contactEmail: string; logo?: string }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Tests ----
function getSeedTests(): Test[] {
  return [
    {
      id: "test-1",
      name: "Mathematics Final Exam",
      creatorId: "admin-1",
      creatorName: "Admin User",
      timeLimitMinutes: 60,
      passPercentage: 50,
      certificateEnabled: true,
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
      creatorId: "admin-1",
      creatorName: "Admin User",
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
      creatorId: "admin-1",
      creatorName: "Admin User",
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


// ---- Orphan Cleanup ----
function getValidStudentIds(): Set<string> {
  const raw = localStorage.getItem("ei_users");
  if (!raw) return new Set();
  return new Set(JSON.parse(raw).map((u: any) => u.id));
}

function getValidTestIds(): Set<string> {
  const raw = localStorage.getItem(TESTS_KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw).map((t: any) => t.id));
}

// ---- Attempts ----
export function getAttempts(): Attempt[] {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return [];
  const validStudents = getValidStudentIds();
  const validTests = getValidTestIds();
  return (JSON.parse(raw) as Attempt[]).filter(a => validStudents.has(a.studentId) && validTests.has(a.testId));
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
  const validStudents = getValidStudentIds();
  const validTests = getValidTestIds();
  return (JSON.parse(raw) as Certificate[]).filter(c => validStudents.has(c.studentId) && validTests.has(c.testId));
}

export function getCertificatesForStudent(studentId: string): Certificate[] {
  return getCertificates().filter(c => c.studentId === studentId);
}

export function saveCertificate(cert: Certificate) {
  const certs = getCertificates();
  const idx = certs.findIndex(c => c.id === cert.id);
  if (idx >= 0) certs[idx] = cert;
  else certs.push(cert);
  localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certs));
}

export function generateCertificateId(): string {
  const num = getCertificates().length + 1;
  return `EI-2026-${String(num).padStart(3, "0")}`;
}

// ---- Retake Requests ----
export interface RetakeRequest {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  testName: string;
  attemptId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt?: string;
}

const RETAKE_REQUESTS_KEY = "ei_retake_requests";

export function getRetakeRequests(): RetakeRequest[] {
  const raw = localStorage.getItem(RETAKE_REQUESTS_KEY);
  if (!raw) return [];
  const validStudents = getValidStudentIds();
  const validTests = getValidTestIds();
  return (JSON.parse(raw) as RetakeRequest[]).filter(r => validStudents.has(r.studentId) && validTests.has(r.testId));
}

export function saveRetakeRequest(req: RetakeRequest) {
  const requests = getRetakeRequests();
  const idx = requests.findIndex(r => r.id === req.id);
  if (idx >= 0) requests[idx] = req;
  else requests.push(req);
  localStorage.setItem(RETAKE_REQUESTS_KEY, JSON.stringify(requests));
}

export function getRetakeRequestsForStudent(studentId: string): RetakeRequest[] {
  return getRetakeRequests().filter(r => r.studentId === studentId);
}

export function hasRetakeRequest(studentId: string, testId: string): RetakeRequest | undefined {
  return getRetakeRequests().find(r => r.studentId === studentId && r.testId === testId && r.status === "pending");
}

export function approveRetake(requestId: string) {
  const requests = getRetakeRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return;
  req.status = "approved";
  req.resolvedAt = new Date().toISOString();
  localStorage.setItem(RETAKE_REQUESTS_KEY, JSON.stringify(requests));

  // Remove the student's previous attempt so they can retake
  const attempts = getAttempts().filter(a => !(a.studentId === req.studentId && a.testId === req.testId));
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function rejectRetake(requestId: string) {
  const requests = getRetakeRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return;
  req.status = "rejected";
  req.resolvedAt = new Date().toISOString();
  localStorage.setItem(RETAKE_REQUESTS_KEY, JSON.stringify(requests));
}
