import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Users, GraduationCap, FileText, BarChart3, Award, Settings, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersByRole, addUser, getUsers, type User } from "@/lib/auth";

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

function AddUserDialog({ role, onAdded }: { role: "staff" | "student"; onAdded: () => void }) {
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
    const id = `${role}-${Date.now()}`;
    addUser({ id, name, email, password, role });
    toast({ title: "Success", description: `${role === "staff" ? "Staff" : "Student"} added successfully.` });
    setName(""); setEmail(""); setPassword(""); setExtra("");
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add {role === "staff" ? "Staff" : "Student"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New {role === "staff" ? "Staff Member" : "Student"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Input placeholder={role === "staff" ? "Subject (optional)" : "Class (optional)"} value={extra} onChange={e => setExtra(e.target.value)} />
          <Button className="w-full" onClick={handleSubmit}>Add {role === "staff" ? "Staff" : "Student"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ManageStaff = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState(() => getUsersByRole("staff"));
  const [search, setSearch] = useState("");

  const refresh = () => setStaff(getUsersByRole("staff"));
  const filtered = staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (u: User) => {
    deleteUser(u.id);
    refresh();
    toast({ title: "Deleted", description: `${u.name} has been removed.` });
  };

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Manage Staff">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search staff..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <AddUserDialog role="staff" onAdded={refresh} />
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
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No staff found.</td></tr>
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
          <AddUserDialog role="student" onAdded={refresh} />
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
  const tests = [
    { id: 1, name: "Mathematics Final Exam", creator: "Dr. Priya Sharma", students: 45, date: "Mar 10, 2026", status: "Scheduled" },
    { id: 2, name: "Physics Chapter 5 Quiz", creator: "Mr. Rahul Verma", students: 32, date: "Mar 7, 2026", status: "Completed" },
    { id: 3, name: "English Grammar Test", creator: "Ms. Anjali Patel", students: 45, date: "Mar 5, 2026", status: "Completed" },
    { id: 4, name: "Chemistry Lab Practical", creator: "Dr. Suresh Kumar", students: 28, date: "Mar 12, 2026", status: "Draft" },
  ];

  return (
    <DashboardLayout role="admin" navItems={navItems} title="All Tests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search tests..." className="max-w-xs" />
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Created By</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Students</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.creator}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.students}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === "Completed" ? "bg-success/10 text-success" :
                      t.status === "Scheduled" ? "bg-info/10 text-info" :
                      "bg-warning/10 text-warning"
                    }`}>{t.status}</span>
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
