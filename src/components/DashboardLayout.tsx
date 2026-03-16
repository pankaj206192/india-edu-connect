import { ReactNode, useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Menu, X, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "student";
  navItems: NavItem[];
  title: string;
}

const DashboardLayout = ({ children, role, navItems, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-hero text-primary-foreground transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary-foreground/10 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-display text-lg font-bold">Ethical India</span>
          </div>
          <button className="lg:hidden text-primary-foreground/70 hover:text-primary-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-2 shrink-0">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
            {role} Panel
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 overflow-y-auto sidebar-scroll">
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
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-primary-foreground/10 p-3 shrink-0">
          {user && (
            <div className="mb-2 px-3">
              <p className="text-sm font-medium text-primary-foreground/90 truncate">{user.name}</p>
              <p className="text-xs text-primary-foreground/50 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground flex-1">{title}</h1>
          {role === "admin" && (() => {
            const itemsWithBadges = navItems.filter(item => item.badge && item.badge > 0);
            const totalBadges = itemsWithBadges.reduce((sum, item) => sum + (item.badge || 0), 0);
            return (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {totalBadges > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-count-up">
                      {totalBadges}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      {totalBadges === 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">All caught up!</p>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {itemsWithBadges.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No pending notifications
                        </div>
                      ) : (
                        itemsWithBadges.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setBellOpen(false); }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                          >
                            <span className="text-secondary">{item.icon}</span>
                            <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {item.badge}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
