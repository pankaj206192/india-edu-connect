import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { GraduationCap, FileText, Award, LayoutDashboard, UserPlus, BookOpen, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Manage Students", path: "/dashboard/admin/students", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "Tests", path: "/dashboard/admin/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Create Test", path: "/dashboard/admin/create-test", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Results", path: "/dashboard/admin/results", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/admin/certificates", icon: <Award className="h-4 w-4" /> },
  { label: "Settings", path: "/dashboard/admin/settings", icon: <Settings className="h-4 w-4" /> },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout role="admin" navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={248} icon={<GraduationCap className="h-5 w-5" />} trend="+12 this month" />
          <StatCard title="Tests Created" value={45} icon={<FileText className="h-5 w-5" />} trend="+5 this week" />
          <StatCard title="Certificates Issued" value={186} icon={<Award className="h-5 w-5" />} trend="+28 this month" />
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
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Pass / Fail Analytics</h2>
            <div className="space-y-3">
              {[
                { test: "Mathematics Final", passed: 85, failed: 15 },
                { test: "Science Midterm", passed: 72, failed: 28 },
                { test: "English Grammar", passed: 91, failed: 9 },
              ].map((item) => (
                <div key={item.test} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium text-foreground">{item.test}</span>
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
              {[
                { name: "Physics Chapter 5", date: "Mar 7, 2026", students: 32 },
                { name: "History Quiz", date: "Mar 6, 2026", students: 45 },
                { name: "Chemistry Lab", date: "Mar 5, 2026", students: 28 },
              ].map((test) => (
                <div key={test.name} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.date}</p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                    {test.students} students
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
