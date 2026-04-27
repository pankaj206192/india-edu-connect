import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, GraduationCap, FileText, BarChart3, Award, Settings, Plus, Trash2, BookOpen, PlusCircle, Pencil, RotateCcw, Check, X, Upload, ImageIcon, Eye, EyeOff, Users, Clock, MessageSquare, Camera, AlertTriangle, Download, CheckCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersByRole, addUser, getUsers, updateUser, useAuth, type User } from "@/lib/auth";
import { getTests, saveTest, getAttempts, getCertificates, saveCertificate, getRetakeRequests, approveRetake, rejectRetake, getSettings, saveSettings, getBatches, saveBatch, deleteBatch, getFeedbacks, updateAttempt, getTabSwitchLogs, getCameraSnapshots, getActiveCameraSnapshots, generateCertificateId, getPendingReviewAttempts, markFeedbackReviewed, markAllFeedbackReviewed, getReviewedFeedbackIds, markResultReviewed, markAllResultsReviewed, getReviewedResultIds, getUnreviewedFeedbackCount, getUnreviewedResultCount, type Test, type Question as StoreQuestion, type Certificate, type Batch, type Attempt } from "@/lib/store";
import { generateCertificatePDF } from "@/lib/pdf";
import { exportCSV } from "@/lib/csv";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useSearchParams } from "react-router-dom";

function getAdminNavItems() {
  const pendingRetakes = getRetakeRequests().filter(r => r.status === "pending").length;
  const pendingCerts = getCertificates().filter(c => c.status === "pending").length;
  const unreviewedFeedback = getUnreviewedFeedbackCount();
  const pendingGrading = getPendingReviewAttempts().length;
  const unreviewedResults = getUnreviewedResultCount();

  return [
    { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Manage Students", path: "/dashboard/admin/students", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Batches", path: "/dashboard/admin/batches", icon: <Users className="h-4 w-4" /> },
    { label: "Tests", path: "/dashboard/admin/tests", icon: <FileText className="h-4 w-4" /> },
    { label: "Create Test", path: "/dashboard/admin/create-test", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Results", path: "/dashboard/admin/results", icon: <BarChart3 className="h-4 w-4" />, badge: (pendingGrading || unreviewedResults) || undefined },
    { label: "Live Test", path: "/dashboard/admin/live-test", icon: <Camera className="h-4 w-4" /> },
    { label: "Retake Requests", path: "/dashboard/admin/retake-requests", icon: <RotateCcw className="h-4 w-4" />, badge: pendingRetakes || undefined },
    { label: "Certificates", path: "/dashboard/admin/certificates", icon: <Award className="h-4 w-4" />, badge: pendingCerts || undefined },
    { label: "Feedback", path: "/dashboard/admin/feedback", icon: <MessageSquare className="h-4 w-4" />, badge: unreviewedFeedback || undefined },
    { label: "Settings", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
  ];
}

export { getAdminNavItems };

function deleteUser(userId: string) {
  // Remove user
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem("ei_users", JSON.stringify(users));

  // Remove attempts
  const attempts = JSON.parse(localStorage.getItem("ei_attempts") || "[]");
  const removedAttemptIds = new Set(attempts.filter((a: any) => a.studentId === userId).map((a: any) => a.id));
  localStorage.setItem("ei_attempts", JSON.stringify(attempts.filter((a: any) => a.studentId !== userId)));

  // Remove certificates
  const certs = JSON.parse(localStorage.getItem("ei_certificates") || "[]");
  localStorage.setItem("ei_certificates", JSON.stringify(certs.filter((c: any) => c.studentId !== userId)));

  // Remove retake requests
  const retakes = JSON.parse(localStorage.getItem("ei_retake_requests") || "[]");
  localStorage.setItem("ei_retake_requests", JSON.stringify(retakes.filter((r: any) => r.studentId !== userId)));

  // Remove feedback
  const feedbacks = JSON.parse(localStorage.getItem("ei_feedback") || "[]");
  localStorage.setItem("ei_feedback", JSON.stringify(feedbacks.filter((f: any) => f.studentId !== userId)));

  // Remove tab-switch logs
  const tabLogs = JSON.parse(localStorage.getItem("ei_tab_switches") || "[]");
  localStorage.setItem("ei_tab_switches", JSON.stringify(tabLogs.filter((l: any) => l.studentId !== userId)));

  // Remove camera snapshots
  const snaps = JSON.parse(localStorage.getItem("ei_camera_snapshots") || "[]");
  localStorage.setItem("ei_camera_snapshots", JSON.stringify(snaps.filter((s: any) => s.studentId !== userId)));

  // Clean up reviewed-tracking entries for removed attempts/feedback
  const reviewedResults: string[] = JSON.parse(localStorage.getItem("ei_reviewed_results") || "[]");
  localStorage.setItem("ei_reviewed_results", JSON.stringify(reviewedResults.filter(id => !removedAttemptIds.has(id))));
  const removedFeedbackIds = new Set(feedbacks.filter((f: any) => f.studentId === userId).map((f: any) => f.id));
  const reviewedFeedback: string[] = JSON.parse(localStorage.getItem("ei_reviewed_feedbacks") || "[]");
  localStorage.setItem("ei_reviewed_feedbacks", JSON.stringify(reviewedFeedback.filter(id => !removedFeedbackIds.has(id))));

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
  const [photo, setPhoto] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const batches = getBatches();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be less than 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

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
    addUser({ id, name, email, password, role: "student", gender: gender as "male" | "female" | "other", mobile, photo: photo || undefined, batchId: batchId || undefined });
    toast({ title: "Success", description: "Student added successfully." });
    setName(""); setEmail(""); setPassword(""); setGender(""); setMobile(""); setPhoto(""); setBatchId("");
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
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              {photo ? (
                <img src={photo} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="mr-1 h-3 w-3" /> Upload Photo</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
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
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Batch (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Batch</SelectItem>
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} — {b.timings}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<string>(student.gender || "");
  const [mobile, setMobile] = useState(student.mobile || "");
  const [photo, setPhoto] = useState<string>(student.photo || "");
  const [batchId, setBatchId] = useState<string>(student.batchId || "");
  const batches = getBatches();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be less than 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

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
    updateUser(student.id, { name, email, password, gender: gender as "male" | "female" | "other", mobile, photo: photo || undefined, batchId: batchId && batchId !== "none" ? batchId : undefined });
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
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              {photo ? (
                <img src={photo} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="mr-1 h-3 w-3" /> {photo ? "Change Photo" : "Upload Photo"}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {photo && (
              <Button variant="ghost" size="sm" onClick={() => setPhoto("")} className="text-destructive">Remove</Button>
            )}
          </div>
          <Input placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input readOnly value={password} type={showPassword ? "text" : "password"} className="pr-10 bg-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => { setResettingPassword(!resettingPassword); setNewPassword(""); setConfirmPassword(""); }}>
                Reset
              </Button>
            </div>
          </div>
          {resettingPassword && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
              <Label className="text-xs font-medium">New Password</Label>
              <Input placeholder="Enter new password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Label className="text-xs font-medium">Confirm Password</Label>
              <Input placeholder="Confirm new password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <Button
                size="sm"
                className="w-full"
                disabled={!newPassword || newPassword !== confirmPassword}
                onClick={() => {
                  setPassword(newPassword);
                  setResettingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  toast({ title: "Password Updated", description: "Click 'Save Changes' to apply." });
                }}
              >
                {!newPassword ? "Enter new password" : newPassword !== confirmPassword ? "Passwords don't match" : "Confirm Reset"}
              </Button>
            </div>
          )}
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
          <Select value={batchId || "none"} onValueChange={(v) => setBatchId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Batch (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Batch</SelectItem>
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} — {b.timings}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  const [filterYear, setFilterYear] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const batches = getBatches();

  const refresh = () => setStudents(getUsersByRole("student"));

  const batchYearOf = (b?: Batch) => {
    if (!b) return "";
    if (b.monthYear) return b.monthYear.slice(0, 4);
    return b.createdAt ? new Date(b.createdAt).getFullYear().toString() : "";
  };

  const availableYears = Array.from(new Set(
    batches.map(b => batchYearOf(b)).filter(Boolean)
  )).sort((a, b) => Number(b) - Number(a));

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const batch = s.batchId ? batches.find(b => b.id === s.batchId) : undefined;
    const batchName = batch?.name.toLowerCase() || "";
    const batchYear = batchYearOf(batch);
    const matchesSearch = !q || (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      batchName.includes(q)
    );
    const matchesYear = !filterYear || batchYear === filterYear;
    return matchesSearch && matchesYear;
  });

  const handleDelete = () => {
    if (!deleteTarget || deleteConfirmText !== "delete") return;
    deleteUser(deleteTarget.id);
    refresh();
    toast({ title: "Deleted", description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Manage Students">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap min-w-0">
            <Input placeholder="Search by name, email, or batch..." className="w-full sm:max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={filterYear || "all"} onValueChange={v => setFilterYear(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Batch year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || filterYear) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterYear(""); }}>Clear</Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" onClick={() => {
              const rows = filtered.map(s => {
                const b = s.batchId ? batches.find(x => x.id === s.batchId) : undefined;
                const my = b?.monthYear || (b?.createdAt ? b.createdAt.slice(0, 7) : "");
                const myLabel = my ? new Date(my + "-01").toLocaleString(undefined, { month: "long", year: "numeric" }) : "";
                return [
                  s.name, s.email, s.gender || "", s.mobile || "",
                  b?.name || "",
                  b?.timings || "",
                  myLabel,
                ];
              });
              exportCSV("students.csv", ["Name", "Email", "Gender", "Mobile", "Batch", "Batch Timing", "Batch Month/Year"], rows);
            }}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <AddUserDialog onAdded={refresh} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Photo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Gender</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Mobile</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Batch</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No students found.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                      {s.photo ? (
                        <img src={s.photo} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{s.gender || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.mobile || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {(() => {
                      if (!s.batchId) return <span>—</span>;
                      const b = batches.find(x => x.id === s.batchId);
                      if (!b) return <span>—</span>;
                      const my = b.monthYear || (b.createdAt ? b.createdAt.slice(0, 7) : "");
                      const myLabel = my ? new Date(my + "-01").toLocaleString(undefined, { month: "short", year: "numeric" }) : "";
                      return (
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">{b.name}</span>
                          {b.timings && <span className="text-xs text-muted-foreground">{b.timings}</span>}
                          {myLabel && <span className="text-xs text-muted-foreground">{myLabel}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditUserDialog student={s} onUpdated={refresh} />
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This will permanently remove all their data including test attempts, certificates, and retake requests.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Type <span className="font-mono text-destructive">delete</span> to confirm</label>
              <Input
                className="mt-1"
                placeholder="Type delete"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toLowerCase())}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirmText !== "delete"}
                onClick={handleDelete}
              >
                Delete Student
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const refresh = () => setTests(getTests());

  const handleDelete = () => {
    if (!deleteTarget || deleteConfirmText !== "delete") return;
    const allTests = getTests().filter(t => t.id !== deleteTarget.id);
    localStorage.setItem("ei_tests", JSON.stringify(allTests));
    refresh();
    toast({ title: "Deleted", description: "Test has been removed." });
    setDeleteTarget(null);
    setDeleteConfirmText("");
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
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="All Tests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search tests..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/admin/edit-test?id=${t.id}`)} title="Edit Test">
                        <Pencil className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setAssignTest(t)} title="Assign Students">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

      {/* Delete Test Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This action cannot be undone.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Type <span className="font-mono text-destructive">delete</span> to confirm</label>
              <Input className="mt-1" placeholder="Type delete" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value.toLowerCase())} />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" disabled={deleteConfirmText !== "delete"} onClick={handleDelete}>Delete Test</Button>
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancel</Button>
            </div>
          </div>
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
  const [mode, setMode] = useState<"direct" | "batch">("direct");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const batches = getBatches();

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const displayedStudents = mode === "batch" && selectedBatchId
    ? allStudents.filter(s => s.batchId === selectedBatchId)
    : allStudents;

  const selectAllDisplayed = () => {
    const displayedIds = displayedStudents.map(s => s.id);
    const allSelected = displayedIds.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...displayedIds])]);
    }
  };

  const allDisplayedSelected = displayedStudents.length > 0 && displayedStudents.every(s => selected.includes(s.id));

  return (
    <div className="space-y-4 pt-2">
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === "direct" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("direct"); setSelectedBatchId(""); }}
        >
          All Students
        </Button>
        <Button
          variant={mode === "batch" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("batch")}
        >
          By Batch
        </Button>
      </div>

      {/* Batch Selector */}
      {mode === "batch" && (
        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a batch..." />
          </SelectTrigger>
          <SelectContent>
            {batches.length === 0 && (
              <SelectItem value="none" disabled>No batches created</SelectItem>
            )}
            {batches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name} — {b.timings}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selected.length} selected total · {displayedStudents.length} shown</p>
        <Button variant="outline" size="sm" onClick={selectAllDisplayed}>
          {allDisplayedSelected ? "Deselect Shown" : "Select Shown"}
        </Button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {displayedStudents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {mode === "batch" && !selectedBatchId ? "Select a batch above." : "No students found."}
          </p>
        )}
        {displayedStudents.map(s => (
          <label key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
            {s.batchId && (
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {batches.find(b => b.id === s.batchId)?.name || ""}
              </span>
            )}
          </label>
        ))}
      </div>
      <Button className="w-full" onClick={() => onSave(selected)}>Save Assignments</Button>
    </div>
  );
}

export const AdminResults = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState(() => getAttempts());
  const tests = getTests();
  const allUsers = getUsers();
  const batches = getBatches();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [gradeAttempt, setGradeAttempt] = useState<Attempt | null>(null);
  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [reviewedIds, setReviewedIds] = useState(() => getReviewedResultIds());
  const tabSwitchLogs = getTabSwitchLogs();

  const refresh = () => setAttempts(getAttempts());

  const handleMarkRead = (attemptId: string) => {
    markResultReviewed(attemptId);
    setReviewedIds(getReviewedResultIds());
  };

  const enriched = attempts.map(a => {
    const test = tests.find(t => t.id === a.testId);
    const tabLog = tabSwitchLogs.find(l => l.attemptId === a.id);
    const student = allUsers.find(u => u.id === a.studentId);
    const batch = student?.batchId ? batches.find(b => b.id === student.batchId) : undefined;
    return {
      ...a,
      testName: test?.name || "Unknown Test",
      tabSwitches: tabLog?.count || a.tabSwitchCount || 0,
      batchName: batch?.name || "",
      batchTimings: batch?.timings || "",
      batchYear: batch?.createdAt ? new Date(batch.createdAt).getFullYear() : null,
    };
  });

  const filtered = enriched.filter(r => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.testName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    const d = new Date(r.submittedAt);
    const submitted = d.getTime();
    if (fromDate && submitted < new Date(fromDate).getTime()) return false;
    if (toDate && submitted > new Date(toDate).getTime() + 86400000 - 1) return false;
    if (filterMonth && (d.getMonth() + 1).toString() !== filterMonth) return false;
    if (filterYear && d.getFullYear().toString() !== filterYear) return false;
    return true;
  });

  const availableYears = Array.from(new Set(attempts.map(a => new Date(a.submittedAt).getFullYear()))).sort((a, b) => b - a);
  const monthOptions = [
    ["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"],
    ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
  ];

  const openGrading = (attempt: Attempt) => {
    setGradeAttempt(attempt);
    // Auto-mark as read when admin opens the result detail
    if (!reviewedIds.has(attempt.id)) {
      markResultReviewed(attempt.id);
      setReviewedIds(getReviewedResultIds());
    }
    // Pre-fill with existing manual scores or 0
    const test = tests.find(t => t.id === attempt.testId);
    if (test) {
      const scores: Record<string, number> = {};
      test.questions.forEach(q => {
        if (q.type === "short" || q.type === "long") {
          scores[q.id] = attempt.manualScores?.[q.id] ?? 0;
        }
      });
      setManualScores(scores);
    }
  };

  const handleFinalizeGrade = () => {
    if (!gradeAttempt) return;
    const test = tests.find(t => t.id === gradeAttempt.testId);
    if (!test) return;

    // Calculate total score: MCQ auto + manual scores
    let totalScore = 0;
    let totalMarks = 0;
    for (const q of test.questions) {
      totalMarks += q.marks;
      if (q.type === "mcq") {
        if (gradeAttempt.answers[q.id] === q.correctAnswer) totalScore += q.marks;
      } else {
        totalScore += Math.min(manualScores[q.id] || 0, q.marks);
      }
    }
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const passed = percentage >= test.passPercentage;

    updateAttempt(gradeAttempt.id, {
      score: totalScore,
      percentage,
      passed,
      gradingStatus: "graded",
      manualScores,
    });

    // Create certificate if passed and enabled
    if (passed && test.certificateEnabled !== false) {
      saveCertificate({
        id: generateCertificateId(),
        attemptId: gradeAttempt.id,
        testId: test.id,
        testName: test.name,
        studentId: gradeAttempt.studentId,
        studentName: gradeAttempt.studentName,
        score: totalScore,
        percentage,
        issuedAt: new Date().toISOString(),
        status: "pending",
      });
    }

    toast({ title: "Graded", description: `${gradeAttempt.studentName}'s test has been graded. Score: ${totalScore}/${totalMarks} (${percentage}%)` });
    setGradeAttempt(null);
    refresh();
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Results">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap min-w-0">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input placeholder="Student or test..." className="w-full sm:w-56" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" className="w-full sm:w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" className="w-full sm:w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={filterMonth} onValueChange={v => setFilterMonth(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={filterYear} onValueChange={v => setFilterYear(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(fromDate || toDate || filterMonth || filterYear) && (
              <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); setFilterMonth(""); setFilterYear(""); }}>
                <X className="mr-1 h-3 w-3" /> Clear filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => {
              markAllResultsReviewed();
              setReviewedIds(getReviewedResultIds());
              toast({ title: "Done", description: "All results marked as reviewed." });
            }}>
              <CheckCheck className="mr-1 h-4 w-4" /> Mark All Reviewed
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const rows = filtered.map(r => [
                r.studentName,
                r.batchName,
                r.batchTimings,
                r.batchYear ? r.batchYear.toString() : "",
                r.testName,
                r.gradingStatus === "pending_review" ? "Pending" : `${r.score}/${r.totalMarks}`,
                r.gradingStatus === "pending_review" ? "" : `${r.percentage}%`,
                r.gradingStatus === "pending_review" ? "Needs Grading" : r.passed ? "Passed" : "Failed",
                r.tabSwitches,
                `${new Date(r.submittedAt).toLocaleDateString()} ${new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              ]);
              exportCSV(
                "results.csv",
                ["Student", "Batch", "Batch Timing", "Batch Year", "Test", "Score", "Percentage", "Status", "Tab Switches", "Submitted"],
                rows,
              );
            }}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Batch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Test</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">%</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tab Switches</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No results match the filters.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className={`border-b border-border last:border-0 ${!reviewedIds.has(r.id) && r.gradingStatus !== "pending_review" ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <span className="inline-flex items-center gap-2">
                      {!reviewedIds.has(r.id) && r.gradingStatus !== "pending_review" && (
                        <span className="h-2 w-2 rounded-full bg-primary" title="Unread" />
                      )}
                      {r.studentName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {r.batchName ? (
                      <div className="flex flex-col">
                        <span className="text-foreground">{r.batchName}</span>
                        {r.batchTimings && <span className="text-xs text-muted-foreground">{r.batchTimings}</span>}
                        {r.batchYear && <span className="text-xs text-muted-foreground">Year: {r.batchYear}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.testName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.gradingStatus === "pending_review" ? <span className="text-warning">Pending</span> : `${r.score}/${r.totalMarks}`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {r.gradingStatus === "pending_review" ? "—" : `${r.percentage}%`}
                  </td>
                  <td className="px-4 py-3">
                    {r.gradingStatus === "pending_review" ? (
                      <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Needs Grading</span>
                    ) : (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {r.passed ? "Passed" : "Failed"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {r.tabSwitches > 0 ? (
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" /> {r.tabSwitches}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    <div className="flex flex-col leading-tight">
                      <span>{new Date(r.submittedAt).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.gradingStatus === "pending_review" ? (
                        <Button size="sm" variant="outline" onClick={() => openGrading(r)}>
                          <Pencil className="mr-1 h-3 w-3" /> Grade
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => openGrading(r)}>
                          <Eye className="mr-1 h-3 w-3" /> View Analysis
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Dialog */}
      <Dialog open={!!gradeAttempt} onOpenChange={(o) => { if (!o) setGradeAttempt(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade: {gradeAttempt?.studentName} — {tests.find(t => t.id === gradeAttempt?.testId)?.name}</DialogTitle>
          </DialogHeader>
          {gradeAttempt && (() => {
            const test = tests.find(t => t.id === gradeAttempt.testId);
            if (!test) return null;
            // Compute analysis summary
            let mcqCorrect = 0, mcqWrong = 0, mcqTotal = 0, subjectiveTotal = 0;
            test.questions.forEach(q => {
              if (q.type === "mcq") {
                mcqTotal++;
                if (gradeAttempt.answers[q.id] === q.correctAnswer) mcqCorrect++;
                else mcqWrong++;
              } else {
                subjectiveTotal++;
              }
            });
            return (
              <div className="space-y-4 pt-2">
                {/* Analysis summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-lg font-semibold text-foreground">
                      {gradeAttempt.gradingStatus === "pending_review" ? "—" : `${gradeAttempt.score}/${gradeAttempt.totalMarks}`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className="text-lg font-semibold text-foreground">
                      {gradeAttempt.gradingStatus === "pending_review" ? "—" : `${gradeAttempt.percentage}%`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-success/5 p-3">
                    <p className="text-xs text-muted-foreground">MCQ Correct</p>
                    <p className="text-lg font-semibold text-success">{mcqCorrect}<span className="text-sm text-muted-foreground">/{mcqTotal}</span></p>
                  </div>
                  <div className="rounded-lg border border-border bg-destructive/5 p-3">
                    <p className="text-xs text-muted-foreground">MCQ Wrong</p>
                    <p className="text-lg font-semibold text-destructive">{mcqWrong}<span className="text-sm text-muted-foreground">/{mcqTotal}</span></p>
                  </div>
                </div>
                {subjectiveTotal > 0 && (
                  <p className="text-xs text-muted-foreground">{subjectiveTotal} subjective question{subjectiveTotal > 1 ? "s" : ""} (manually graded)</p>
                )}
                {gradeAttempt.tabSwitchCount && gradeAttempt.tabSwitchCount > 0 && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Tab switches detected: {gradeAttempt.tabSwitchCount}
                  </div>
                )}
                {test.questions.map((q, idx) => {
                  const studentAnswer = gradeAttempt.answers[q.id] || "(no answer)";
                  const isMcq = q.type === "mcq";
                  const isMcqCorrect = isMcq && studentAnswer === q.correctAnswer;
                  return (
                    <div key={q.id} className="rounded-lg border border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Q{idx + 1}: {q.text}</span>
                        <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5 capitalize">{q.type} · {q.marks} marks</span>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Student's Answer:</p>
                        <p className="text-sm text-foreground">{studentAnswer}</p>
                      </div>
                      {isMcq ? (
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isMcqCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {isMcqCorrect ? `✓ Correct (${q.marks} marks)` : `✗ Wrong (0 marks)`}
                          </span>
                          {!isMcqCorrect && <span className="text-xs text-muted-foreground">Correct: {q.correctAnswer}</span>}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Expected keywords: <span className="text-foreground">{q.correctAnswer}</span></p>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs shrink-0">Marks (0-{q.marks}):</Label>
                            <Input
                              type="number"
                              min={0}
                              max={q.marks}
                              value={manualScores[q.id] ?? 0}
                              onChange={e => setManualScores({ ...manualScores, [q.id]: Math.min(q.marks, Math.max(0, Number(e.target.value))) })}
                              className="h-8 w-20"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {gradeAttempt.gradingStatus === "pending_review" && (
                  <Button className="w-full" onClick={handleFinalizeGrade}>
                    <Check className="mr-2 h-4 w-4" /> Finalize & Save Grade
                  </Button>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
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
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Certificates">
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
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => getSettings());
  const [logo, setLogo] = useState<string>(settings.logo || "");
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);
  const [adminName, setAdminName] = useState(user?.name || "");
  const [adminEmail, setAdminEmail] = useState(user?.email || "");
  const [adminMobile, setAdminMobile] = useState(user?.mobile || "");
  const [editingProfile, setEditingProfile] = useState(false);

  // Student Help page contact (separate from admin login / personal details)
  const [helpEmail, setHelpEmail] = useState<string>(settings.helpEmail || "");
  const [helpPhone, setHelpPhone] = useState<string>(settings.helpPhone || "");
  const [confirmClearHelp, setConfirmClearHelp] = useState(false);

  // Institute details
  const [instituteName, setInstituteName] = useState<string>(settings.instituteName || "");
  const [contactEmail, setContactEmail] = useState<string>(settings.contactEmail || "");

  const handleSaveProfile = () => {
    if (!adminName || !adminEmail || !adminMobile) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(adminMobile)) {
      toast({ title: "Error", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }
    if (user) {
      updateUser(user.id, { name: adminName, email: adminEmail, mobile: adminMobile });
      // Update session
      const updated = getUsers().find(u => u.id === user.id);
      if (updated) localStorage.setItem("ei_session", JSON.stringify(updated));
    }
    setEditingProfile(false);
    toast({ title: "Saved", description: "Admin profile updated. Refresh to see changes everywhere." });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Logo must be less than 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (logo) {
        // Existing logo — confirm replacement
        setPendingLogo(dataUrl);
      } else {
        setLogo(dataUrl);
        const updated = { ...getSettings(), logo: dataUrl };
        saveSettings(updated);
        toast({ title: "Saved", description: "Logo uploaded successfully." });
      }
    };
    reader.readAsDataURL(file);
    // Reset input so selecting same file again still triggers change
    e.target.value = "";
  };

  const confirmLogoChange = () => {
    if (!pendingLogo) return;
    setLogo(pendingLogo);
    const updated = { ...getSettings(), logo: pendingLogo };
    saveSettings(updated);
    setPendingLogo(null);
    toast({ title: "Updated", description: "Logo changed successfully." });
  };

  const performRemoveLogo = () => {
    setLogo("");
    const updated = { ...getSettings(), logo: undefined };
    saveSettings(updated);
    setConfirmRemoveLogo(false);
    toast({ title: "Removed", description: "Logo has been removed." });
  };

  const handleSaveInstitute = () => {
    const updated = { ...getSettings(), instituteName, contactEmail };
    saveSettings(updated);
    setSettings(updated);
    toast({ title: "Saved", description: "Institute details updated." });
  };

  const handleSaveHelpContact = () => {
    if (helpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(helpEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (helpPhone && !/^\d{10}$/.test(helpPhone)) {
      toast({ title: "Error", description: "Phone number must be 10 digits.", variant: "destructive" });
      return;
    }
    const updated = {
      ...getSettings(),
      helpEmail: helpEmail || undefined,
      helpPhone: helpPhone || undefined,
    };
    saveSettings(updated);
    setSettings(updated);
    toast({ title: "Saved", description: "Student Help contact updated." });
  };

  const handleClearHelpContact = () => {
    setHelpEmail("");
    setHelpPhone("");
    const updated = { ...getSettings(), helpEmail: undefined, helpPhone: undefined };
    saveSettings(updated);
    setSettings(updated);
    setConfirmClearHelp(false);
    toast({ title: "Cleared", description: "Help page will fall back to your admin profile contact." });
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Admin Profile */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground">Admin Profile</h2>
            {!editingProfile && (
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
            )}
          </div>
          {editingProfile ? (
            <div className="space-y-3">
              <Input placeholder="Name" value={adminName} onChange={e => setAdminName(e.target.value)} />
              <Input placeholder="Email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              <Input placeholder="Mobile (10 digits)" value={adminMobile} onChange={e => setAdminMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile}>Save</Button>
                <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {adminName?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-medium text-foreground">{adminName}</p>
                <p className="text-sm text-muted-foreground">{adminEmail}</p>
                <p className="text-sm text-muted-foreground">{adminMobile || "No mobile added"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Logo Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Institute Logo</h2>
          <p className="mb-3 text-sm text-muted-foreground">Upload your institute logo. It will appear on certificates and branding.</p>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
              {logo ? (
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="mr-1 h-3 w-3" /> {logo ? "Change Logo" : "Upload Logo"}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {logo && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveLogo(true)} className="text-destructive justify-start">
                  <Trash2 className="mr-1 h-3 w-3" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Confirm change logo */}
        <AlertDialog open={!!pendingLogo} onOpenChange={(o) => { if (!o) setPendingLogo(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change institute logo?</AlertDialogTitle>
              <AlertDialogDescription>
                The current logo will be replaced with the new one. This will update branding everywhere it appears.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {pendingLogo && (
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <p className="mb-1 text-xs text-muted-foreground">Current</p>
                  <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={logo} alt="Current logo" className="h-full w-full object-contain" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-xs text-muted-foreground">New</p>
                  <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={pendingLogo} alt="New logo" className="h-full w-full object-contain" />
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLogoChange}>Replace logo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm remove logo */}
        <AlertDialog open={confirmRemoveLogo} onOpenChange={setConfirmRemoveLogo}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove institute logo?</AlertDialogTitle>
              <AlertDialogDescription>
                The logo will be removed from certificates, the student Help page, and other branding. You can upload a new one anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performRemoveLogo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove logo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              <Input value={instituteName} onChange={(e) => setInstituteName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Contact Email</label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleSaveInstitute}>Save Changes</Button>
          </div>
        </div>

        {/* Student Help Page Contact */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-foreground">Student Help Page Contact</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            These details are shown to students on the <span className="font-medium text-foreground">Help</span> page.
            They are independent from your admin login and personal profile — leave fields blank to fall back to your admin profile.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Support Email (visible to students)</label>
              <Input
                type="email"
                placeholder="support@yourinstitute.com"
                value={helpEmail}
                onChange={(e) => setHelpEmail(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">Optional. If empty, your admin profile email will be shown.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Support Phone (visible to students)</label>
              <Input
                placeholder="10-digit phone number"
                value={helpPhone}
                onChange={(e) => setHelpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">Optional. If empty, your admin profile mobile will be shown.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveHelpContact}>Save Help Contact</Button>
              {(settings.helpEmail || settings.helpPhone) && (
                <Button variant="outline" onClick={() => setConfirmClearHelp(true)}>Clear & Use Admin Profile</Button>
              )}
            </div>
          </div>
        </div>

        {/* Confirm clear help contact */}
        <AlertDialog open={confirmClearHelp} onOpenChange={setConfirmClearHelp}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Student Help contact?</AlertDialogTitle>
              <AlertDialogDescription>
                The custom support email and phone will be removed. Students will instead see your
                admin profile email{user?.mobile ? " and mobile" : ""} on the Help page. You can set
                a dedicated support contact again anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHelpContact}>Clear & Use Admin Profile</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
  const initHours = Math.floor((existingTest?.timeLimitMinutes || 60) / 60);
  const initMinutes = (existingTest?.timeLimitMinutes || 60) % 60;
  const [timeLimitHours, setTimeLimitHours] = useState(initHours);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initMinutes);
  const timeLimit = timeLimitHours * 60 + timeLimitMinutes;
  const [passPercentage, setPassPercentage] = useState(existingTest?.passPercentage || 50);
  const [certificateEnabled, setCertificateEnabled] = useState(existingTest?.certificateEnabled !== false);
  const [liveCameraEnabled, setLiveCameraEnabled] = useState(existingTest?.liveCameraEnabled || false);
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
      certificateEnabled,
      liveCameraEnabled,
    };

    saveTest(test);
    toast({ title: isEditing ? "Test Updated!" : "Test Created!", description: isEditing ? "Your changes have been saved." : "Your test has been saved and assigned." });
    navigate("/dashboard/admin/tests");
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title={isEditing ? "Edit Test" : "Create Test"}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Test Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Test Name</Label>
              <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Mathematics Final Exam" className="mt-1" />
            </div>
            <div>
              <Label>Time Limit</Label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1">
                  <Input type="number" value={timeLimitHours} onChange={e => setTimeLimitHours(Math.max(0, Number(e.target.value)))} min={0} placeholder="0" />
                  <span className="mt-0.5 block text-xs text-muted-foreground">Hours</span>
                </div>
                <span className="text-muted-foreground font-medium">:</span>
                <div className="flex-1">
                  <Input type="number" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(Math.max(0, Math.min(59, Number(e.target.value))))} min={0} max={59} placeholder="0" />
                  <span className="mt-0.5 block text-xs text-muted-foreground">Minutes</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Pass Percentage</Label>
              <Input type="number" value={passPercentage} onChange={e => setPassPercentage(Number(e.target.value))} className="mt-1" min={0} max={100} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certificateEnabled}
                  onChange={e => setCertificateEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Issue certificate for passing students</span>
              </label>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveCameraEnabled}
                  onChange={e => setLiveCameraEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Enable live camera proctoring</span>
              </label>
              {liveCameraEnabled && (
                <span className="text-xs text-muted-foreground">(Students must allow camera access to take this test)</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Assign Students</h2>
          <CreateTestAssignStudents
            students={students}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            toggleStudent={toggleStudent}
          />
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
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Retake Requests">
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
                  {req.status === "rejected" && (
                    <div className="shrink-0">
                      <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(req.id)}>
                        <Check className="mr-1 h-3 w-3" /> Approve
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

export const AdminBatches = () => {
  const { toast } = useToast();
  const [batches, setBatches] = useState(() => getBatches());
  const [open, setOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [name, setName] = useState("");
  const [timings, setTimings] = useState("");
  const [monthYear, setMonthYear] = useState("");
  const [assignBatch, setAssignBatch] = useState<Batch | null>(null);
  const allStudents = getUsersByRole("student");

  const refresh = () => setBatches(getBatches());

  const handleSave = () => {
    if (!name.trim() || !timings.trim() || !monthYear) {
      toast({ title: "Error", description: "Please fill name, timings, and month/year.", variant: "destructive" });
      return;
    }
    const nameN = name.trim().toLowerCase();
    const timingsN = timings.trim().toLowerCase();
    const duplicate = batches.find(b =>
      (!editBatch || b.id !== editBatch.id) &&
      b.name.trim().toLowerCase() === nameN &&
      b.timings.trim().toLowerCase() === timingsN &&
      (b.monthYear || "") === monthYear
    );
    if (duplicate) {
      toast({ title: "Duplicate batch", description: "This batch already exists with the same name, timings, and month/year.", variant: "destructive" });
      return;
    }
    if (editBatch) {
      saveBatch({ ...editBatch, name: name.trim(), timings: timings.trim(), monthYear });
      toast({ title: "Updated", description: "Batch updated successfully." });
    } else {
      saveBatch({ id: `batch-${Date.now()}`, name: name.trim(), timings: timings.trim(), monthYear, createdAt: new Date().toISOString().split("T")[0] });
      toast({ title: "Created", description: "Batch created successfully." });
    }
    setName(""); setTimings(""); setMonthYear(""); setOpen(false); setEditBatch(null);
    refresh();
  };

  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDelete = () => {
    if (!deleteTarget || deleteConfirmText !== "delete") return;
    deleteBatch(deleteTarget.id);
    refresh();
    toast({ title: "Deleted", description: "Batch has been removed." });
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const handleAssignStudents = (studentIds: string[]) => {
    if (!assignBatch) return;
    // Remove batch from students no longer assigned
    const allUsers = getUsers();
    allUsers.forEach(u => {
      if (u.role === "student") {
        if (studentIds.includes(u.id)) {
          updateUser(u.id, { batchId: assignBatch.id });
        } else if (u.batchId === assignBatch.id) {
          updateUser(u.id, { batchId: undefined });
        }
      }
    });
    setAssignBatch(null);
    toast({ title: "Updated", description: "Students assigned to batch." });
  };

  const openEdit = (batch: Batch) => {
    setEditBatch(batch);
    setName(batch.name);
    setTimings(batch.timings);
    setMonthYear(batch.monthYear || (batch.createdAt ? batch.createdAt.slice(0, 7) : ""));
    setOpen(true);
  };

  const openCreate = () => {
    setEditBatch(null);
    setName("");
    setTimings("");
    setMonthYear("");
    setOpen(true);
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Manage Batches">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Batch
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batch Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timings</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Month/Year</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Students</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No batches created yet.</td></tr>
              )}
              {batches.map((b) => {
                const studentCount = allStudents.filter(s => s.batchId === b.id).length;
                const my = b.monthYear || (b.createdAt ? b.createdAt.slice(0, 7) : "");
                const myLabel = my ? new Date(my + "-01").toLocaleString(undefined, { month: "long", year: "numeric" }) : "—";
                return (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {b.timings}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{myLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{studentCount} students</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{b.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setAssignBatch(b)} title="Assign Students">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)} title="Edit Batch">
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setEditBatch(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBatch ? "Edit Batch" : "Create New Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm font-medium">Batch Name *</Label>
              <Input className="mt-1" placeholder="e.g. Morning Batch A" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Timings *</Label>
              <Input className="mt-1" placeholder="e.g. Mon-Fri 9:00 AM - 12:00 PM" value={timings} onChange={e => setTimings(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Month & Year *</Label>
              <Input type="month" className="mt-1" value={monthYear} onChange={e => setMonthYear(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Used to identify the batch year (e.g. April 2026).</p>
            </div>
            <Button className="w-full" onClick={handleSave}>{editBatch ? "Update Batch" : "Create Batch"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={!!assignBatch} onOpenChange={(o) => { if (!o) setAssignBatch(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Students to "{assignBatch?.name}"</DialogTitle>
          </DialogHeader>
          {assignBatch && (
            <BatchAssignStudents
              key={assignBatch.id}
              batchId={assignBatch.id}
              allStudents={allStudents}
              onSave={handleAssignStudents}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Batch Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete batch <span className="font-medium text-foreground">{deleteTarget?.name}</span>? Students in this batch will be unassigned.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Type <span className="font-mono text-destructive">delete</span> to confirm</label>
              <Input className="mt-1" placeholder="Type delete" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value.toLowerCase())} />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" disabled={deleteConfirmText !== "delete"} onClick={handleDelete}>Delete Batch</Button>
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function BatchAssignStudents({ batchId, allStudents, onSave }: {
  batchId: string;
  allStudents: User[];
  onSave: (studentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    allStudents.filter(s => s.batchId === batchId).map(s => s.id)
  );

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

function CreateTestAssignStudents({ students, selectedStudents, setSelectedStudents, toggleStudent }: {
  students: User[];
  selectedStudents: string[];
  setSelectedStudents: (ids: string[]) => void;
  toggleStudent: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"direct" | "batch">("direct");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const batches = getBatches();

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.mobile || "").includes(q);
    const matchesBatch = mode === "direct" || !selectedBatchId || s.batchId === selectedBatchId;
    return matchesSearch && matchesBatch;
  });

  const selectAllFiltered = () => {
    const filteredIds = filtered.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudents([...new Set([...selectedStudents, ...filteredIds])]);
    }
  };

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students found. Add students first.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant={mode === "direct" ? "default" : "outline"} size="sm" onClick={() => { setMode("direct"); setSelectedBatchId(""); }}>All Students</Button>
        <Button variant={mode === "batch" ? "default" : "outline"} size="sm" onClick={() => setMode("batch")}>By Batch</Button>
      </div>
      {mode === "batch" && (
        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a batch..." />
          </SelectTrigger>
          <SelectContent>
            {batches.length === 0 && <SelectItem value="none" disabled>No batches created</SelectItem>}
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} — {b.timings}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Input placeholder="Search by name, email, or mobile..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selectedStudents.length} selected · {filtered.length} shown</p>
        <Button variant="outline" size="sm" onClick={selectAllFiltered}>
          {filtered.length > 0 && filtered.every(s => selectedStudents.includes(s.id)) ? "Deselect Shown" : "Select Shown"}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto">
        {filtered.length === 0 && <p className="col-span-2 text-sm text-muted-foreground text-center py-4">No students match your filters.</p>}
        {filtered.map(s => (
          <label key={s.id} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
            <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
              <p className="text-xs text-muted-foreground truncate">{s.email} · {s.mobile || ""}</p>
            </div>
            {s.batchId && (
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground shrink-0">
                {batches.find(b => b.id === s.batchId)?.name || ""}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export const AdminFeedback = () => {
  const { toast } = useToast();
  const [feedbacks] = useState(() => getFeedbacks());
  const [reviewedIds, setReviewedIds] = useState(() => getReviewedFeedbackIds());
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("");
  const [filterTest, setFilterTest] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const batches = getBatches();
  const tests = getTests();
  const allStudents = getUsers();

  const filtered = feedbacks.filter(f => {
    const q = search.toLowerCase();
    const student = allStudents.find(u => u.id === f.studentId);
    const matchesSearch = !q || f.studentName.toLowerCase().includes(q) || f.testName.toLowerCase().includes(q) || (student?.email || "").toLowerCase().includes(q);
    const matchesBatch = !filterBatch || f.batchId === filterBatch;
    const matchesTest = !filterTest || f.testId === filterTest;
    const d = new Date(f.submittedAt);
    const matchesMonth = !filterMonth || (d.getMonth() + 1).toString() === filterMonth;
    const matchesYear = !filterYear || d.getFullYear().toString() === filterYear;
    return matchesSearch && matchesBatch && matchesTest && matchesMonth && matchesYear;
  });

  const availableYears = Array.from(new Set(feedbacks.map(f => new Date(f.submittedAt).getFullYear()))).sort((a, b) => b - a);
  const months = [
    ["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"],
    ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
  ];

  const handleMarkRead = (id: string) => {
    markFeedbackReviewed(id);
    setReviewedIds(getReviewedFeedbackIds());
  };

  const handleMarkAllRead = () => {
    markAllFeedbackReviewed();
    setReviewedIds(getReviewedFeedbackIds());
    toast({ title: "Done", description: "All feedback marked as reviewed." });
  };

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Student Feedback">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <Input placeholder="Search by student or test name..." className="w-full lg:w-64" value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={filterBatch} onValueChange={v => setFilterBatch(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTest} onValueChange={v => setFilterTest(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Tests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {tests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={v => setFilterMonth(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={v => setFilterYear(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" /> Mark All Read
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const rows = filtered.map(f => {
                const batch = batches.find(b => b.id === f.batchId);
                return [f.studentName, f.testName, batch?.name || "", f.feedback, new Date(f.submittedAt).toLocaleDateString()];
              });
              exportCSV("feedback.csv", ["Student", "Test", "Batch", "Feedback", "Date"], rows);
            }}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No feedback found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(fb => {
              const batch = batches.find(b => b.id === fb.batchId);
              const isRead = reviewedIds.has(fb.id);
              return (
                <div
                  key={fb.id}
                  onClick={() => { if (!isRead) handleMarkRead(fb.id); }}
                  className={`rounded-xl border bg-card p-5 shadow-card transition-colors ${isRead ? "border-border opacity-75" : "border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10"}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{fb.studentName}</h3>
                        {!isRead && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Test: <span className="text-foreground">{fb.testName}</span>
                        {batch && <span className="ml-2 text-xs rounded-full bg-muted px-2 py-0.5">{batch.name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.submittedAt).toLocaleDateString()} {new Date(fb.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isRead && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(fb.id)} title="Mark as read">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 italic">"{fb.feedback}"</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const AdminLiveTest = () => {
  const [snapshots, setSnapshots] = useState(() => getActiveCameraSnapshots());
  const tests = getTests();
  const [selectedTest, setSelectedTest] = useState<string>("");

  // Auto-refresh every 1 second so feeds appear truly live and disappear quickly
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshots(getActiveCameraSnapshots());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeTests = tests.filter(t => t.liveCameraEnabled && t.status === "active");

  const filteredSnapshots = selectedTest
    ? snapshots.filter(s => s.testId === selectedTest)
    : snapshots;

  return (
    <DashboardLayout role="admin" navItems={getAdminNavItems()} title="Live Test Monitoring">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={selectedTest} onValueChange={v => setSelectedTest(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="All Proctored Tests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {activeTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Live · refreshing every second · {filteredSnapshots.length} active feed{filteredSnapshots.length === 1 ? "" : "s"}</p>
        </div>

        {filteredSnapshots.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <Camera className="mx-auto mb-3 h-16 w-16 text-muted-foreground" />
            <h3 className="font-display text-lg font-bold text-foreground mb-1">No Active Camera Feeds</h3>
            <p className="text-sm text-muted-foreground">Live camera feeds appear only while students are actively taking a proctored exam.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSnapshots.map((s, idx) => (
              <div key={`${s.studentId}-${s.testId}-${idx}`} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="relative rounded-lg overflow-hidden bg-black mb-2">
                  <img src={s.image} alt={s.studentName} className="w-full h-auto" />
                  <div className="absolute top-1 right-1 rounded bg-success/90 px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{s.studentName}</p>
                <p className="text-xs text-muted-foreground truncate">{s.testName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
