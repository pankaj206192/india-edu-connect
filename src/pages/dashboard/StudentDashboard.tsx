import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { FileText, Award, Clock, LayoutDashboard, BookOpen, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getTestsForStudent, hasAttempted, getAttemptsForStudent, getCertificatesForStudent } from "@/lib/store";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard/student", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", path: "/dashboard/student/profile", icon: <User className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/student/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Test History", path: "/dashboard/student/history", icon: <History className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/student/certificates", icon: <Award className="h-4 w-4" /> },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const allTests = getTestsForStudent(user.id);
  const pendingTests = allTests.filter(t => !hasAttempted(user.id, t.id));
  const attempts = getAttemptsForStudent(user.id);
  const certs = getCertificatesForStudent(user.id).filter(c => c.status === "approved");

  return (
    <DashboardLayout role="student" navItems={navItems} title="Student Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Pending Tests" value={pendingTests.length} icon={<Clock className="h-5 w-5" />} />
          <StatCard title="Completed Tests" value={attempts.length} icon={<FileText className="h-5 w-5" />} />
          <StatCard title="Certificates" value={certs.length} icon={<Award className="h-5 w-5" />} />
        </div>

        {/* Upcoming Tests */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Pending Tests</h2>
          <div className="space-y-3">
            {pendingTests.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending tests. You're all caught up!</p>
            )}
            {pendingTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.timeLimitMinutes} min · {test.questions.length} questions</p>
                  </div>
                </div>
                <Button size="sm" variant="hero" onClick={() => navigate(`/dashboard/student/test-attempt?testId=${test.id}`)}>Start Test</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Recent Results</h2>
          <div className="space-y-3">
            {attempts.length === 0 && (
              <p className="text-sm text-muted-foreground">No test results yet.</p>
            )}
            {attempts.slice(-5).reverse().map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">{a.testId}</p>
                  <p className="text-xs text-muted-foreground">Score: {a.score}/{a.totalMarks} ({a.percentage}%)</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {a.passed ? "Passed" : "Failed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;