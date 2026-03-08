import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Menu, X, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "staff" | "student";
  navItems: NavItem[];
  title: string;
}

const DashboardLayout = ({ children, role, navItems, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleColors: Record<string, string> = {
    admin: "bg-gradient-hero",
    staff: "bg-gradient-hero",
    student: "bg-gradient-hero",
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${roleColors[role]} text-primary-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary-foreground/10">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-display text-lg font-bold">Ethical India</span>
          </div>
          <button className="lg:hidden text-primary-foreground/70 hover:text-primary-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-2">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
            {role} Panel
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-primary-foreground/10 p-3">
          <button
            onClick={() => navigate("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
