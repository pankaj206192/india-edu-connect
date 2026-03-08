import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, GraduationCap, FileText, BarChart3, Award, Settings, Plus, Trash2, BookOpen, PlusCircle, Pencil, RotateCcw, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersByRole, addUser, getUsers, updateUser, useAuth, type User } from "@/lib/auth";
import { getTests, saveTest, getAttempts, getCertificates, saveCertificate, getRetakeRequests, approveRetake, rejectRetake, type Test, type Question as StoreQuestion, type Certificate } from "@/lib/store";
import { generateCertificatePDF } from "@/lib/pdf";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useSearchParams } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Manage Students", path: "/dashboard/admin/students", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "Tests", path: "/dashboard/admin/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Create Test", path: "/dashboard/admin/create-test", icon: <FileText className="h-4 w-4" /> },
  { label: "Results", path: "/dashboard/admin/results", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Retake Requests", path: "/dashboard/admin/retake-requests", icon: <RotateCcw className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/admin/certificates", icon: <Award className="h-4 w-4" /> },
  { label: "Settings", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
];

export { navItems };

function deleteUser(userId: string) {
  // Remove user
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem("ei_users", JSON.stringify(users));

  // Remove attempts
  const attempts = JSON.parse(localStorage.getItem("ei_attempts") || "[]");
  localStorage.setItem("ei_attempts", JSON.stringify(attempts.filter((a: any) => a.studentId !== userId)));

  // Remove certificates
  const certs = JSON.parse(localStorage.getItem("ei_certificates") || "[]");
  localStorage.setItem("ei_certificates", JSON.stringify(certs.filter((c: any) => c.studentId !== userId)));

  // Remove retake requests
  const retakes = JSON.parse(localStorage.getItem("ei_retake_requests") || "[]");
  localStorage.setItem("ei_retake_requests", JSON.stringify(retakes.filter((r: any) => r.studentId !== userId)));

  // Remove from test assignments
  const tests = JSON.parse(localStorage.getItem("ei_tests") || "[]");
  const updatedTests = tests.map((t: any) => ({
    ...t,
    assignedStudentIds: (t.assignedStudentIds || []).filter((id: string) => id !== userId),
  }));
  localStorage.setItem("ei_tests", JSON.stringify(updatedTests));
}

function AddUserDialog({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [mobile, setMobile] = useState("");

  const handleSubmit = () => {
    if (!name || !email || !password || !gender || !mobile) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast({ title: "Error", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }
    const users = getUsers();
    if (users.some(u => u.email === email)) {
      toast({ title: "Error", description: "Email already exists.", variant: "destructive" });
      return;
    }
    if (users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) {
      toast({ title: "Error", description: "A student with this name already exists.", variant: "destructive" });
      return;
    }
    if (users.some(u => u.mobile === mobile)) {
      toast({ title: "Error", description: "Mobile number already in use.", variant: "destructive" });
      return;
    }
    const id = `student-${Date.now()}`;
    addUser({ id, name, email, password, role: "student", gender: gender as "male" | "female" | "other", mobile });
    toast({ title: "Success", description: "Student added successfully." });
    setName(""); setEmail(""); setPassword(""); setGender(""); setMobile("");
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
          <Input placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password *" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female" | "other")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Mobile Number (10 digits) *" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          <Button className="w-full" onClick={handleSubmit}>Add Student</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ student, onUpdated }: { student: User; onUpdated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState(student.password);
  const [gender, setGender] = useState<string>(student.gender || "");
  const [mobile, setMobile] = useState(student.mobile || "");

  const handleSave = () => {
    if (!name || !email || !password || !gender || !mobile) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast({ title: "Error", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }
    const users = getUsers();
    if (users.find(u => u.email === email && u.id !== student.id)) {
      toast({ title: "Error", description: "Email already in use by another user.", variant: "destructive" });
      return;
    }
    if (users.find(u => u.name.toLowerCase() === name.trim().toLowerCase() && u.id !== student.id)) {
      toast({ title: "Error", description: "A student with this name already exists.", variant: "destructive" });
      return;
    }
    if (users.find(u => u.mobile === mobile && u.id !== student.id)) {
      toast({ title: "Error", description: "Mobile number already in use.", variant: "destructive" });
      return;
    }
    updateUser(student.id, { name, email, password, gender: gender as "male" | "female" | "other", mobile });
    toast({ title: "Updated", description: `${name}'s details have been updated.` });
    setOpen(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Edit Student">
          <Pencil className="h-4 w-4 text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password *" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Mobile Number (10 digits) *" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          <Button className="w-full" onClick={handleSave}>Save Changes</Button>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Gender</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Mobile</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No students found.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{s.gender || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.mobile || "—"}</td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                    <EditUserDialog student={s} onUpdated={refresh} />
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
  const navigate = useNavigate();
  const [tests, setTests] = useState(() => getTests());
  const [search, setSearch] = useState("");
  const [assignTest, setAssignTest] = useState<Test | null>(null);
  const allStudents = getUsersByRole("student");

  const refresh = () => setTests(getTests());

  const handleDelete = (testId: string) => {
    const allTests = getTests().filter(t => t.id !== testId);
    localStorage.setItem("ei_tests", JSON.stringify(allTests));
    refresh();
    toast({ title: "Deleted", description: "Test has been removed." });
  };

  const handleAssignSave = (studentIds: string[]) => {
    if (!assignTest) return;
    const updated = { ...assignTest, assignedStudentIds: studentIds };
    saveTest(updated);
    refresh();
    setAssignTest(null);
    toast({ title: "Updated", description: "Student assignments updated." });
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
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/admin/edit-test?id=${t.id}`)} title="Edit Test">
                      <Pencil className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAssignTest(t)} title="Assign Students">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </Button>
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

      <Dialog open={!!assignTest} onOpenChange={(open) => { if (!open) setAssignTest(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Students to "{assignTest?.name}"</DialogTitle>
          </DialogHeader>
          {assignTest && (
            <AssignStudentsContent
              key={assignTest.id}
              initialSelected={assignTest.assignedStudentIds}
              allStudents={allStudents}
              onSave={handleAssignSave}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function AssignStudentsContent({ initialSelected, allStudents, onSave }: {
  initialSelected: string[];
  allStudents: User[];
  onSave: (studentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(selected.length === allStudents.length ? [] : allStudents.map(s => s.id));
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selected.length} of {allStudents.length} selected</p>
        <Button variant="outline" size="sm" onClick={selectAll}>
          {selected.length === allStudents.length ? "Deselect All" : "Select All"}
        </Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {allStudents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No students found. Add students first.</p>
        )}
        {allStudents.map(s => (
          <label key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
            <div>
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
          </label>
        ))}
      </div>
      <Button className="w-full" onClick={() => onSave(selected)}>Save Assignments</Button>
    </div>
  );
}

export const AdminResults = () => {
  const [attempts, setAttempts] = useState(() => getAttempts());
  const tests = getTests();
  const [search, setSearch] = useState("");

  const enriched = attempts.map(a => {
    const test = tests.find(t => t.id === a.testId);
    return { ...a, testName: test?.name || "Unknown Test" };
  });

  const filtered = enriched.filter(r =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Results">
      <div className="space-y-6">
        <Input placeholder="Search by student or test..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Test</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Percentage</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No results yet. Students need to attempt tests first.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.testName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.score}/{r.totalMarks}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.percentage}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {r.passed ? "Passed" : "Failed"}
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
  const { toast } = useToast();
  const [certs, setCerts] = useState(() => getCertificates());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const refresh = () => setCerts(getCertificates());

  const allStudents = getUsers();
  const filtered = certs
    .filter(c => filter === "all" || c.status === filter)
    .filter(c => {
      const q = search.toLowerCase();
      const student = allStudents.find(u => u.id === c.studentId);
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.testName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (student?.email?.toLowerCase().includes(q) ?? false) ||
        (student?.mobile?.includes(q) ?? false)
      );
    });

  const handleApprove = (cert: Certificate) => {
    saveCertificate({ ...cert, status: "approved" });
    refresh();
    toast({ title: "Approved", description: `Certificate for ${cert.studentName} has been approved.` });
  };

  const handleReject = (cert: Certificate) => {
    saveCertificate({ ...cert, status: "rejected" });
    refresh();
    toast({ title: "Rejected", description: `Certificate for ${cert.studentName} has been rejected.` });
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Certificates">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search certificates..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f} ({certs.filter(c => f === "all" || c.status === f).length})
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No {filter !== "all" ? filter : ""} certificates found.</p>
          )}
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.status === "pending" ? "bg-warning/10 text-warning" :
                  c.status === "approved" ? "bg-success/10 text-success" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {c.status}
                </span>
              </div>
              <h3 className="font-medium text-foreground">{c.studentName}</h3>
              <p className="text-sm text-muted-foreground">{c.testName} · Score: {c.percentage}%</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</p>
              {c.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(c)}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(c)}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </div>
              )}
              {c.status === "rejected" && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="w-full text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(c)}>
                    <Check className="mr-1 h-3 w-3" /> Approve Certificate
                  </Button>
                </div>
              )}
              {c.status === "approved" && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => generateCertificatePDF(c)}>Download PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(c)}>
                    <X className="mr-1 h-3 w-3" /> Revoke
                  </Button>
                </div>
              )}
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
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const existingTest = editId ? getTests().find(t => t.id === editId) : null;
  const isEditing = !!existingTest;

  const loadQuestions = (): Question[] => {
    if (!existingTest) return [{ id: 1, type: "mcq", text: "", marks: 1, options: ["", "", "", ""], correctAnswer: "" }];
    return existingTest.questions.map((q, idx) => {
      const correctLetter = q.type === "mcq" && q.options.includes(q.correctAnswer)
        ? String.fromCharCode(65 + q.options.indexOf(q.correctAnswer))
        : q.correctAnswer;
      return {
        id: idx + 1,
        type: q.type,
        text: q.text,
        marks: q.marks,
        options: q.type === "mcq" ? (q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill("")]) : q.options,
        correctAnswer: correctLetter,
      };
    });
  };

  const [testName, setTestName] = useState(existingTest?.name || "");
  const [timeLimit, setTimeLimit] = useState(existingTest?.timeLimitMinutes || 60);
  const [passPercentage, setPassPercentage] = useState(existingTest?.passPercentage || 50);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(existingTest?.assignedStudentIds || []);
  const students = getUsersByRole("student");
  const [questions, setQuestions] = useState<Question[]>(loadQuestions);

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
      id: existingTest ? (existingTest.questions[idx]?.id || `q-${Date.now()}-${idx}`) : `q-${Date.now()}-${idx}`,
      type: q.type,
      text: q.text,
      marks: q.marks,
      options: q.options,
      correctAnswer: q.type === "mcq" ? q.options[q.correctAnswer.charCodeAt(0) - 65] || q.correctAnswer : q.correctAnswer,
    }));

    const test: Test = {
      id: existingTest?.id || `test-${Date.now()}`,
      name: testName,
      creatorId: existingTest?.creatorId || user?.id || "admin-1",
      creatorName: existingTest?.creatorName || user?.name || "Admin",
      timeLimitMinutes: timeLimit,
      questions: storeQuestions,
      assignedStudentIds: selectedStudents,
      status: existingTest?.status || "active",
      createdAt: existingTest?.createdAt || new Date().toISOString().split("T")[0],
      passPercentage,
    };

    saveTest(test);
    toast({ title: isEditing ? "Test Updated!" : "Test Created!", description: isEditing ? "Your changes have been saved." : "Your test has been saved and assigned." });
    navigate("/dashboard/admin/tests");
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title={isEditing ? "Edit Test" : "Create Test"}>
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
          {isEditing ? "Save Changes" : "Save & Publish Test"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export const AdminRetakeRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState(() => getRetakeRequests());
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const refresh = () => setRequests(getRetakeRequests());

  const filtered = requests.filter(r => filter === "all" || r.status === filter);

  const handleApprove = (id: string) => {
    approveRetake(id);
    refresh();
    toast({ title: "Approved", description: "Retake approved. Student can now reattempt the test." });
  };

  const handleReject = (id: string) => {
    rejectRetake(id);
    refresh();
    toast({ title: "Rejected", description: "Retake request has been rejected." });
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Retake Requests">
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f} {f !== "all" && `(${requests.filter(r => r.status === f).length})`}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <RotateCcw className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} retake requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <div key={req.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{req.studentName}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        req.status === "pending" ? "bg-warning/10 text-warning" :
                        req.status === "approved" ? "bg-success/10 text-success" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Test: <span className="text-foreground">{req.testName}</span></p>
                    <p className="text-sm text-muted-foreground mb-1">Reason: <span className="text-foreground italic">"{req.reason}"</span></p>
                    <p className="text-xs text-muted-foreground">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(req.id)}>
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
