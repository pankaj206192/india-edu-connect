import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { FileText, Users, BarChart3, LayoutDashboard, BookOpen, ClipboardList, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", path: "/dashboard/staff", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/staff/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Create Test", path: "/dashboard/staff/create-test", icon: <PlusCircle className="h-4 w-4" /> },
  { label: "Students", path: "/dashboard/staff/students", icon: <Users className="h-4 w-4" /> },
  { label: "Results", path: "/dashboard/staff/results", icon: <BarChart3 className="h-4 w-4" /> },
];

const StaffDashboard = () => {
  return (
    <DashboardLayout role="staff" navItems={navItems} title="Staff Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Tests Created" value={12} icon={<FileText className="h-5 w-5" />} trend="+3 this week" />
          <StatCard title="Students Assigned" value={86} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Avg. Score" value="74%" icon={<BarChart3 className="h-5 w-5" />} trend="+5% improvement" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">My Tests</h2>
            <Button size="sm" variant="hero">
              <PlusCircle className="mr-1 h-4 w-4" /> Create Test
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { name: "Mathematics Final Exam", questions: 30, assigned: 45, status: "Active" },
              { name: "Science Quiz - Chapter 3", questions: 15, assigned: 32, status: "Draft" },
              { name: "English Grammar Test", questions: 25, assigned: 45, status: "Completed" },
            ].map((test) => (
              <div key={test.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">{test.questions} questions · {test.assigned} students</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  test.status === "Active" ? "bg-success/10 text-success" :
                  test.status === "Draft" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {test.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
