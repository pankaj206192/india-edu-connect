import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, History, Award, BookOpen, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "Dashboard", path: "/dashboard/student", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/student/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Test History", path: "/dashboard/student/history", icon: <History className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/student/certificates", icon: <Award className="h-4 w-4" /> },
];

export const StudentTests = () => {
  const tests = [
    { id: 1, name: "Mathematics Final Exam", date: "Mar 10, 2026", time: "60 min", questions: 30, status: "Pending" },
    { id: 2, name: "Science Quiz", date: "Mar 12, 2026", time: "30 min", questions: 15, status: "Pending" },
    { id: 3, name: "English Grammar", date: "Mar 15, 2026", time: "45 min", questions: 25, status: "Pending" },
  ];

  return (
    <DashboardLayout role="student" navItems={navItems} title="My Tests">
      <div className="space-y-4">
        {tests.map(test => (
          <div key={test.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{test.name}</h3>
                <p className="text-sm text-muted-foreground">{test.date} · {test.time} · {test.questions} questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">{test.status}</span>
              <Button variant="hero" onClick={() => window.location.href = "/dashboard/student/test-attempt"}>Start Test</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export const TestHistory = () => {
  const history = [
    { id: 1, name: "History Quiz", date: "Mar 3, 2026", score: 85, total: 100, status: "Passed" },
    { id: 2, name: "Physics Chapter 5", date: "Mar 1, 2026", score: 42, total: 100, status: "Failed" },
    { id: 3, name: "Chemistry Lab", date: "Feb 28, 2026", score: 92, total: 100, status: "Passed" },
    { id: 4, name: "Biology Midterm", date: "Feb 25, 2026", score: 78, total: 100, status: "Passed" },
    { id: 5, name: "Geography Test", date: "Feb 20, 2026", score: 35, total: 100, status: "Failed" },
  ];

  return (
    <DashboardLayout role="student" navItems={navItems} title="Test History">
      <div className="space-y-6">
        <Input placeholder="Search tests..." className="max-w-xs" />
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{h.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{h.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.score}/{h.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${h.status === "Passed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export const StudentCertificates = () => {
  const { toast } = useToast();
  const certs = [
    { id: "EI-2026-001", test: "History Quiz", score: 85, date: "Mar 3, 2026" },
    { id: "EI-2026-003", test: "Chemistry Lab", score: 92, date: "Feb 28, 2026" },
    { id: "EI-2026-004", test: "Biology Midterm", score: 78, date: "Feb 25, 2026" },
  ];

  return (
    <DashboardLayout role="student" navItems={navItems} title="My Certificates">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map(c => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
              <Award className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-medium text-foreground">{c.test}</h3>
            <p className="text-sm text-muted-foreground">Score: {c.score}% · {c.date}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => toast({ title: "Coming soon", description: "PDF certificate generation requires Cloud." })}
            >
              <Download className="mr-1 h-4 w-4" /> Download PDF
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export const TestAttempt = () => {
  const { toast } = useToast();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questions = [
    { id: 0, type: "mcq", text: "What is the value of π (pi) to two decimal places?", options: ["3.14", "3.16", "3.12", "3.18"], marks: 2 },
    { id: 1, type: "mcq", text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], marks: 2 },
    { id: 2, type: "short", text: "Define photosynthesis in one sentence.", options: [], marks: 5 },
    { id: 3, type: "mcq", text: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], marks: 2 },
    { id: 4, type: "long", text: "Explain Newton's three laws of motion with examples.", options: [], marks: 10 },
  ];

  const q = questions[currentQ];

  return (
    <DashboardLayout role="student" navItems={navItems} title="Test: Mathematics Final Exam">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-secondary" />
            Question {currentQ + 1} of {questions.length}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-bold text-destructive">
            <Clock className="h-4 w-4" />
            58:42
          </div>
        </div>

        {/* Question */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">{q.type}</span>
            <span className="text-xs text-muted-foreground">{q.marks} marks</span>
          </div>
          <h3 className="mb-4 text-lg font-medium text-foreground">{q.text}</h3>

          {q.type === "mcq" && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                    answers[q.id] === opt
                      ? "border-secondary bg-secondary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-secondary/50"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "short" && (
            <Input
              value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Type your answer..."
            />
          )}

          {q.type === "long" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Write your detailed answer..."
              className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
            Previous
          </Button>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                  i === currentQ ? "bg-primary text-primary-foreground" :
                  answers[i] !== undefined ? "bg-success/20 text-success" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)}>Next</Button>
          ) : (
            <Button
              variant="hero"
              onClick={() => toast({ title: "Test Submitted!", description: "Your answers have been recorded." })}
            >
              Submit Test
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
