import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { FileText, Award, Clock, LayoutDashboard, BookOpen, History, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", path: "/dashboard/student", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", path: "/dashboard/student/profile", icon: <User className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/student/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Test History", path: "/dashboard/student/history", icon: <History className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/student/certificates", icon: <Award className="h-4 w-4" /> },
];

const StudentDashboard = () => {
  return (
    <DashboardLayout role="student" navItems={navItems} title="Student Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Pending Tests" value={3} icon={<Clock className="h-5 w-5" />} />
          <StatCard title="Completed Tests" value={8} icon={<FileText className="h-5 w-5" />} />
          <StatCard title="Certificates" value={5} icon={<Award className="h-5 w-5" />} />
        </div>

        {/* Upcoming Tests */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Upcoming Tests</h2>
          <div className="space-y-3">
            {[
              { name: "Mathematics Final Exam", date: "Mar 10, 2026", time: "60 min", questions: 30 },
              { name: "Science Quiz", date: "Mar 12, 2026", time: "30 min", questions: 15 },
              { name: "English Grammar", date: "Mar 15, 2026", time: "45 min", questions: 25 },
            ].map((test) => (
              <div key={test.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.date} · {test.time} · {test.questions} questions</p>
                  </div>
                </div>
                <Button size="sm" variant="hero">Start Test</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Recent Results</h2>
          <div className="space-y-3">
            {[
              { name: "History Quiz", score: 85, total: 100, status: "Passed" },
              { name: "Physics Chapter 5", score: 42, total: 100, status: "Failed" },
              { name: "Chemistry Lab", score: 92, total: 100, status: "Passed" },
            ].map((result) => (
              <div key={result.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">{result.name}</p>
                  <p className="text-xs text-muted-foreground">Score: {result.score}/{result.total}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    result.status === "Passed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {result.status}
                  </span>
                  {result.status === "Passed" && (
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
