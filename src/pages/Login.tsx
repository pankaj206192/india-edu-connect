import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, Role } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("student");

  const demoCredentials: Record<Role, { email: string; password: string }> = {
    admin: { email: "admin@ethicalindia.edu", password: "admin123" },
    student: { email: "amit@student.edu", password: "student123" },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.success) {
      toast({ title: "Welcome!", description: `Logged in successfully` });
      navigate(`/dashboard/${selectedRole}`);
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  const fillDemo = (role: Role) => {
    setSelectedRole(role);
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden w-1/2 bg-gradient-hero lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/20 backdrop-blur-sm">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mb-4 font-display text-4xl font-bold text-primary-foreground">Ethical India</h1>
          <p className="text-lg text-primary-foreground/70">
            Test Management System for modern education. Conduct exams, track performance, and certify achievements.
          </p>
          <div className="mt-8 rounded-xl bg-primary-foreground/10 p-4 text-left text-sm text-primary-foreground/80">
            <p className="mb-2 font-semibold text-primary-foreground">Demo Credentials:</p>
            <p>Admin: admin@ethicalindia.edu / admin123</p>
            <p>Staff: priya@institute.edu / staff123</p>
            <p>Student: amit@student.edu / student123</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
              <BookOpen className="h-6 w-6 text-secondary" />
              <span className="font-display text-xl font-bold">Ethical India</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Role Quick-Fill */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
            {(["admin", "student"] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => fillDemo(role)}
                className={`rounded-lg py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  selectedRole === role
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@institute.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          {/* Mobile demo credentials */}
          <div className="mt-6 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground lg:hidden">
            <p className="mb-1 font-semibold text-foreground">Demo Credentials:</p>
            <p>Admin: admin@ethicalindia.edu / admin123</p>
            <p>Staff: priya@institute.edu / staff123</p>
            <p>Student: amit@student.edu / student123</p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
