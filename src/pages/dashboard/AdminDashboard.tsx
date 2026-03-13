import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { GraduationCap, FileText, Award, LayoutDashboard, UserPlus, BookOpen, Settings, BarChart3, RotateCcw, Users, Camera, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getUsersByRole } from "@/lib/auth";
import { getTests, getAttempts, getCertificates, getRetakeRequests, getFeedbacks, getPendingReviewAttempts } from "@/lib/store";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const students = getUsersByRole("student");
  const tests = getTests();
  const attempts = getAttempts();
  const certs = getCertificates();
  const approvedCerts = certs.filter(c => c.status === "approved");
  const pendingRetakes = getRetakeRequests().filter(r => r.status === "pending").length;
  const pendingCerts = certs.filter(c => c.status === "pending").length;
  const feedbackCount = getFeedbacks().length;
  const newResults = attempts.length;
  const pendingGrading = getPendingReviewAttempts().length;

  const navItems = [
    { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Manage Students", path: "/dashboard/admin/students", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Batches", path: "/dashboard/admin/batches", icon: <Users className="h-4 w-4" /> },
    { label: "Tests", path: "/dashboard/admin/tests", icon: <FileText className="h-4 w-4" /> },
    { label: "Create Test", path: "/dashboard/admin/create-test", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Results", path: "/dashboard/admin/results", icon: <BarChart3 className="h-4 w-4" />, badge: newResults },
    { label: "Retake Requests", path: "/dashboard/admin/retake-requests", icon: <RotateCcw className="h-4 w-4" />, badge: pendingRetakes },
    { label: "Certificates", path: "/dashboard/admin/certificates", icon: <Award className="h-4 w-4" />, badge: pendingCerts },
    { label: "Feedback", path: "/dashboard/admin/feedback", icon: <FileText className="h-4 w-4" />, badge: feedbackCount },
    { label: "Settings", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
  ];

  // Pass/fail analytics per test
  const testAnalytics = tests.slice(-5).map(t => {
    const testAttempts = attempts.filter(a => a.testId === t.id);
    const passed = testAttempts.filter(a => a.passed).length;
    const failed = testAttempts.filter(a => !a.passed).length;
    const total = passed + failed;
    return {
      name: t.name,
      passed: total > 0 ? Math.round((passed / total) * 100) : 0,
      failed: total > 0 ? Math.round((failed / total) * 100) : 0,
      total,
    };
  }).filter(t => t.total > 0);

  return (
    <DashboardLayout role="admin" navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={students.length} icon={<GraduationCap className="h-5 w-5" />} />
          <StatCard title="Tests Created" value={tests.length} icon={<FileText className="h-5 w-5" />} />
          <StatCard title="Certificates Issued" value={approvedCerts.length} icon={<Award className="h-5 w-5" />} />
          <StatCard title="Total Attempts" value={attempts.length} icon={<BarChart3 className="h-5 w-5" />} />
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/dashboard/admin/students")}>
              <UserPlus className="h-5 w-5 text-secondary" />
              <span>Add Student</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/dashboard/admin/create-test")}>
              <BookOpen className="h-5 w-5 text-secondary" />
              <span>Create Test</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/dashboard/admin/certificates")}>
              <Award className="h-5 w-5 text-secondary" />
              <span>View Certificates</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate("/dashboard/admin/results")}>
              <BarChart3 className="h-5 w-5 text-secondary" />
              <span>View Results</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Pass / Fail Analytics</h2>
            <div className="space-y-3">
              {testAnalytics.length === 0 && (
                <p className="text-sm text-muted-foreground">No test attempts yet.</p>
              )}
              {testAnalytics.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-success font-medium">{item.passed}% Pass</span>
                    <span className="text-destructive font-medium">{item.failed}% Fail</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Recent Tests</h2>
            <div className="space-y-3">
              {tests.length === 0 && (
                <p className="text-sm text-muted-foreground">No tests created yet.</p>
              )}
              {tests.slice(-5).reverse().map((test) => (
                <div key={test.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.createdAt}</p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                    {test.assignedStudentIds.length} students
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;