import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Shield, Award, Users, ArrowRight, CheckCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
              <BookOpen className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Ethical India</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign In</Button>
            <Button variant="default" onClick={() => navigate("/login")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-card animate-fade-in">
              <Shield className="h-4 w-4 text-secondary" />
              Trusted by 500+ Institutes
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Conduct Online Exams with{" "}
              <span className="text-gradient-primary">Confidence</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
              A complete test management platform for schools and institutes.
              Create exams, evaluate students, and issue certificates — all in one place.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" onClick={() => navigate("/login")}>
                Start Free Trial <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate("/login")}>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">Powerful tools for modern education management</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-background p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-secondary">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">How It Works</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Transform Your Examinations?
          </h2>
          <p className="mb-8 text-primary-foreground/70">
            Join hundreds of institutes already using Ethical India.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate("/login")}>
            Get Started Now <ArrowRight className="ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-secondary" />
            <span className="font-display font-bold text-foreground">Ethical India</span>
          </div>
          <p>© 2026 Ethical India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const features = [
  { icon: <BookOpen className="h-6 w-6" />, title: "Smart Test Creation", description: "Create MCQ, short answer, and long answer tests with custom marks, time limits, and randomization." },
  { icon: <Users className="h-6 w-6" />, title: "Role-Based Access", description: "Admin and Student roles with secure, permission-based access to all features." },
  { icon: <Award className="h-6 w-6" />, title: "Auto Certificates", description: "Generate professional PDF certificates automatically for students who pass their exams." },
  { icon: <Shield className="h-6 w-6" />, title: "Secure Exams", description: "Timer countdown, auto-save, anti-cheating measures, and prevention of multiple submissions." },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Instant Results", description: "Automatic grading for MCQs with detailed analytics and performance tracking." },
  { icon: <ArrowRight className="h-6 w-6" />, title: "Mobile Ready", description: "Fully responsive exam interface that works beautifully on phones, tablets, and desktops." },
];

const steps = [
  { title: "Create Tests", description: "Staff creates exams with various question types and assigns them to students." },
  { title: "Students Attempt", description: "Students take timed exams securely from any device with auto-save." },
  { title: "Results & Certificates", description: "Instant grading, analytics, and downloadable certificates for passing students." },
];

export default Landing;
