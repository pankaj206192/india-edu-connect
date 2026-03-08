import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, PlusCircle, Users, BarChart3, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "Dashboard", path: "/dashboard/staff", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/staff/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Create Test", path: "/dashboard/staff/create-test", icon: <PlusCircle className="h-4 w-4" /> },
  { label: "Students", path: "/dashboard/staff/students", icon: <Users className="h-4 w-4" /> },
  { label: "Results", path: "/dashboard/staff/results", icon: <BarChart3 className="h-4 w-4" /> },
];

export const StaffTests = () => {
  const tests = [
    { id: 1, name: "Mathematics Final Exam", questions: 30, assigned: 45, status: "Active", date: "Mar 10, 2026" },
    { id: 2, name: "Science Quiz - Chapter 3", questions: 15, assigned: 32, status: "Draft", date: "Mar 12, 2026" },
    { id: 3, name: "English Grammar Test", questions: 25, assigned: 45, status: "Completed", date: "Mar 5, 2026" },
    { id: 4, name: "Algebra Basics", questions: 20, assigned: 38, status: "Active", date: "Mar 8, 2026" },
  ];

  return (
    <DashboardLayout role="staff" navItems={navItems} title="My Tests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search tests..." className="max-w-xs" />
          <Button variant="hero" onClick={() => window.location.href = "/dashboard/staff/create-test"}>
            <PlusCircle className="mr-1 h-4 w-4" /> Create Test
          </Button>
        </div>
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <BookOpen className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{test.name}</p>
                  <p className="text-xs text-muted-foreground">{test.questions} questions · {test.assigned} students · {test.date}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                test.status === "Active" ? "bg-success/10 text-success" :
                test.status === "Draft" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>{test.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

interface Question {
  id: number;
  type: "mcq" | "short" | "long";
  text: string;
  marks: number;
  options: string[];
  correctAnswer: string;
}

export const CreateTest = () => {
  const { toast } = useToast();
  const [testName, setTestName] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: "mcq", text: "", marks: 1, options: ["", "", "", ""], correctAnswer: "" },
  ]);

  const addQuestion = (type: "mcq" | "short" | "long") => {
    setQuestions([...questions, {
      id: questions.length + 1,
      type,
      text: "",
      marks: 1,
      options: type === "mcq" ? ["", "", "", ""] : [],
      correctAnswer: "",
    }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: number, field: string, value: string | number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: number, optIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOptions = [...q.options];
      newOptions[optIndex] = value;
      return { ...q, options: newOptions };
    }));
  };

  return (
    <DashboardLayout role="staff" navItems={navItems} title="Create Test">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Test Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Test Name</Label>
              <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Mathematics Final Exam" className="mt-1" />
            </div>
            <div>
              <Label>Time Limit (minutes)</Label>
              <Input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="mt-1" min={1} />
            </div>
          </div>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-foreground">Question {idx + 1} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{q.type}</span></h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Marks:</Label>
                  <Input type="number" value={q.marks} onChange={e => updateQuestion(q.id, "marks", Number(e.target.value))} className="h-8 w-16" min={1} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Question Text</Label>
                <Input value={q.text} onChange={e => updateQuestion(q.id, "text", e.target.value)} placeholder="Enter your question..." className="mt-1" />
              </div>
              {q.type === "mcq" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <Input value={opt} onChange={e => updateOption(q.id, i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Correct Answer (A, B, C, or D)</Label>
                    <Input value={q.correctAnswer} onChange={e => updateQuestion(q.id, "correctAnswer", e.target.value)} placeholder="e.g. A" className="mt-1 w-24" />
                  </div>
                </div>
              )}
              {(q.type === "short" || q.type === "long") && (
                <div>
                  <Label>Expected Answer / Keywords</Label>
                  <Input value={q.correctAnswer} onChange={e => updateQuestion(q.id, "correctAnswer", e.target.value)} placeholder="Enter expected answer..." className="mt-1" />
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => addQuestion("mcq")}>+ MCQ</Button>
          <Button variant="outline" onClick={() => addQuestion("short")}>+ Short Answer</Button>
          <Button variant="outline" onClick={() => addQuestion("long")}>+ Long Answer</Button>
        </div>

        <Button variant="hero" size="lg" className="w-full" onClick={() => toast({ title: "Test Created!", description: "Your test has been saved. Connect Cloud to persist data." })}>
          Save & Publish Test
        </Button>
      </div>
    </DashboardLayout>
  );
};

export const StaffStudents = () => {
  const students = [
    { id: 1, name: "Amit Singh", email: "amit@student.edu", testsCompleted: 5, avgScore: 78 },
    { id: 2, name: "Sneha Gupta", email: "sneha@student.edu", testsCompleted: 4, avgScore: 88 },
    { id: 3, name: "Ravi Patel", email: "ravi@student.edu", testsCompleted: 6, avgScore: 65 },
    { id: 4, name: "Pooja Reddy", email: "pooja@student.edu", testsCompleted: 3, avgScore: 72 },
  ];

  return (
    <DashboardLayout role="staff" navItems={navItems} title="My Students">
      <div className="space-y-6">
        <Input placeholder="Search students..." className="max-w-xs" />
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tests Done</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.testsCompleted}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${s.avgScore >= 50 ? "text-success" : "text-destructive"}`}>{s.avgScore}%</span>
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

export const StaffResults = () => {
  const results = [
    { id: 1, student: "Amit Singh", test: "Mathematics Final", score: 85, total: 100, date: "Mar 8, 2026" },
    { id: 2, student: "Sneha Gupta", test: "Mathematics Final", score: 92, total: 100, date: "Mar 8, 2026" },
    { id: 3, student: "Ravi Patel", test: "Physics Quiz", score: 38, total: 100, date: "Mar 7, 2026" },
  ];

  return (
    <DashboardLayout role="staff" navItems={navItems} title="Student Results">
      <div className="space-y-6">
        <Input placeholder="Search results..." className="max-w-xs" />
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Test</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.student}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.test}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.score}/{r.total}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.score >= 50 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {r.score >= 50 ? "Passed" : "Failed"}
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
