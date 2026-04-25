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

  const handleGoogleSignIn = () => {
    toast({
      title: "Google Sign-In",
      description:
        "Google sign-in requires Lovable Cloud to be enabled. Ask in chat to enable it and we'll connect Google for admin login.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
     <div className="flex flex-1">
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

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.84 3.45 14.66 2.5 12 2.5 6.86 2.5 2.7 6.66 2.7 11.8s4.16 9.3 9.3 9.3c5.37 0 8.93-3.78 8.93-9.1 0-.61-.07-1.08-.16-1.55H12z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Mobile demo credentials */}
          <div className="mt-6 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground lg:hidden">
            <p className="mb-1 font-semibold text-foreground">Demo Credentials:</p>
            <p>Admin: admin@ethicalindia.edu / admin123</p>
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
     <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
       © 2026 <span className="font-bold text-foreground">Ethical India</span>. All rights reserved.
     </footer>
    </div>
  );
};

export default Login;
