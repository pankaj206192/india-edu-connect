import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, GraduationCap, FileText, BarChart3, Award, Settings, Plus, Trash2, BookOpen, PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersByRole, addUser, getUsers, useAuth, type User } from "@/lib/auth";
import { getTests, saveTest, type Test, type Question as StoreQuestion } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Manage Students", path: "/dashboard/admin/students", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "Tests", path: "/dashboard/admin/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Create Test", path: "/dashboard/admin/create-test", icon: <FileText className="h-4 w-4" /> },
  { label: "Results", path: "/dashboard/admin/results", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/admin/certificates", icon: <Award className="h-4 w-4" /> },
  { label: "Settings", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
];

export { navItems };

function deleteUser(userId: string) {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem("ei_users", JSON.stringify(users));
}

function AddUserDialog({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [extra, setExtra] = useState(""); // subject for staff, class for student

  const handleSubmit = () => {
    if (!name || !email || !password) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (getUsers().some(u => u.email === email)) {
      toast({ title: "Error", description: "Email already exists.", variant: "destructive" });
      return;
    }
    const id = `student-${Date.now()}`;
    addUser({ id, name, email, password, role: "student" });
    toast({ title: "Success", description: "Student added successfully." });
    setName(""); setEmail(""); setPassword(""); setExtra("");
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Input placeholder="Class (optional)" value={extra} onChange={e => setExtra(e.target.value)} />
          <Button className="w-full" onClick={handleSubmit}>Add Student</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ManageStudents = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState(() => getUsersByRole("student"));
  const [search, setSearch] = useState("");

  const refresh = () => setStudents(getUsersByRole("student"));
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (u: User) => {
    deleteUser(u.id);
    refresh();
    toast({ title: "Deleted", description: `${u.name} has been removed.` });
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Manage Students">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search students..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <AddUserDialog onAdded={refresh} />
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No students found.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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

export const AdminTests = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState(() => getTests());
  const [search, setSearch] = useState("");

  const refresh = () => setTests(getTests());

  const handleDelete = (testId: string) => {
    const allTests = getTests().filter(t => t.id !== testId);
    localStorage.setItem("ei_tests", JSON.stringify(allTests));
    refresh();
    toast({ title: "Deleted", description: "Test has been removed." });
  };

  const filtered = tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="admin" navItems={navItems} title="All Tests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search tests..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Questions</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Students</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No tests found.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.questions.length}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.assignedStudentIds.length}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.timeLimitMinutes} min</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === "completed" ? "bg-success/10 text-success" :
                      t.status === "active" ? "bg-info/10 text-info" :
                      "bg-warning/10 text-warning"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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

export const AdminResults = () => {
  const results = [
    { id: 1, student: "Amit Singh", test: "Mathematics Final", score: 85, total: 100, status: "Passed" },
    { id: 2, student: "Sneha Gupta", test: "Mathematics Final", score: 92, total: 100, status: "Passed" },
    { id: 3, student: "Ravi Patel", test: "Physics Quiz", score: 38, total: 100, status: "Failed" },
    { id: 4, student: "Pooja Reddy", test: "English Grammar", score: 76, total: 100, status: "Passed" },
    { id: 5, student: "Karan Mehta", test: "Chemistry Lab", score: 45, total: 100, status: "Failed" },
  ];

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Results">
      <div className="space-y-6">
        <Input placeholder="Search by student or test..." className="max-w-xs" />
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Test</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.student}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.test}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.score}/{r.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === "Passed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {r.status}
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

export const AdminCertificates = () => {
  const certs = [
    { id: "EI-2026-001", student: "Amit Singh", test: "Mathematics Final", score: 85, date: "Mar 8, 2026" },
    { id: "EI-2026-002", student: "Sneha Gupta", test: "Mathematics Final", score: 92, date: "Mar 8, 2026" },
    { id: "EI-2026-003", student: "Pooja Reddy", test: "English Grammar", score: 76, date: "Mar 6, 2026" },
  ];

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Certificates">
      <div className="space-y-6">
        <Input placeholder="Search certificates..." className="max-w-xs" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                <Award className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-medium text-foreground">{c.student}</h3>
              <p className="text-sm text-muted-foreground">{c.test} · Score: {c.score}%</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.date}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full">Download PDF</Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const AdminSettings = () => {
  const { toast } = useToast();

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Settings">
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Pass Percentage</h2>
          <p className="mb-3 text-sm text-muted-foreground">Set the minimum percentage required to pass an exam and receive a certificate.</p>
          <div className="flex items-center gap-3">
            <Input type="number" defaultValue={50} className="w-24" min={0} max={100} />
            <span className="text-sm text-muted-foreground">%</span>
            <Button onClick={() => toast({ title: "Saved", description: "Pass percentage updated." })}>Save</Button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Institute Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Institute Name</label>
              <Input defaultValue="Ethical India Institute" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Contact Email</label>
              <Input defaultValue="admin@ethicalindia.edu" className="mt-1" />
            </div>
            <Button onClick={() => toast({ title: "Saved", description: "Settings updated." })}>Save Changes</Button>
          </div>
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testName, setTestName] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [passPercentage, setPassPercentage] = useState(50);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const students = getUsersByRole("student");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, type: "mcq", text: "", marks: 1, options: ["", "", "", ""], correctAnswer: "" },
  ]);

  const addQuestion = (type: "mcq" | "short" | "long") => {
    setQuestions([...questions, {
      id: Date.now(),
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

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSave = () => {
    if (!testName.trim()) {
      toast({ title: "Error", description: "Please enter a test name.", variant: "destructive" });
      return;
    }
    if (questions.some(q => !q.text.trim())) {
      toast({ title: "Error", description: "All questions must have text.", variant: "destructive" });
      return;
    }
    if (questions.some(q => q.type === "mcq" && q.options.some(o => !o.trim()))) {
      toast({ title: "Error", description: "All MCQ options must be filled.", variant: "destructive" });
      return;
    }
    if (questions.some(q => q.type === "mcq" && (!q.correctAnswer.trim() || !"ABCD".includes(q.correctAnswer)))) {
      toast({ title: "Error", description: "All MCQ questions must have a correct answer (A, B, C, or D).", variant: "destructive" });
      return;
    }
    if (selectedStudents.length === 0) {
      toast({ title: "Error", description: "Please assign at least one student.", variant: "destructive" });
      return;
    }

    const storeQuestions: StoreQuestion[] = questions.map((q, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      type: q.type,
      text: q.text,
      marks: q.marks,
      options: q.options,
      correctAnswer: q.type === "mcq" ? q.options[q.correctAnswer.charCodeAt(0) - 65] || q.correctAnswer : q.correctAnswer,
    }));

    const test: Test = {
      id: `test-${Date.now()}`,
      name: testName,
      creatorId: user?.id || "admin-1",
      creatorName: user?.name || "Admin",
      timeLimitMinutes: timeLimit,
      questions: storeQuestions,
      assignedStudentIds: selectedStudents,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      passPercentage,
    };

    saveTest(test);
    toast({ title: "Test Created!", description: "Your test has been saved and assigned." });
    navigate("/dashboard/admin/tests");
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Create Test">
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
            <div>
              <Label>Pass Percentage</Label>
              <Input type="number" value={passPercentage} onChange={e => setPassPercentage(Number(e.target.value))} className="mt-1" min={0} max={100} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Assign Students</h2>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found. Add students first.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {students.map(s => (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={selectedStudents.includes(s.id)}
                    onCheckedChange={() => toggleStudent(s.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
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
                    <Input value={q.correctAnswer} onChange={e => updateQuestion(q.id, "correctAnswer", e.target.value.toUpperCase())} placeholder="e.g. A" className="mt-1 w-24" maxLength={1} />
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

        <Button variant="hero" size="lg" className="w-full" onClick={handleSave}>
          Save & Publish Test
        </Button>
      </div>
    </DashboardLayout>
  );
};
