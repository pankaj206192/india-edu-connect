import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Clock, Camera, EyeOff, AlertTriangle, CheckCircle, LogOut,
} from "lucide-react";
import {
  getGuestTests, getTests, hasGuestAttempted, saveGuestAttempt,
  saveCameraSnapshot, removeCameraSnapshot,
  type Test, type GuestAttempt,
} from "@/lib/store";

// ---- Guest session helpers ----
// One session per browser tab/window so multiple guests can co-exist.
const GUEST_SESSION_KEY = "ei_guest_session";

interface GuestSession {
  id: string; // unique id for this guest session
  loggedInAt: string;
}

export function getGuestSession(): GuestSession | null {
  const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function startGuestSession(): GuestSession {
  const existing = getGuestSession();
  if (existing) return existing;
  const session: GuestSession = {
    id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function endGuestSession() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
}

// ---- Guest layout (no sidebar — guests are anonymous) ----
function GuestShell({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" />
          <span className="font-display text-base font-bold text-foreground">Ethical India · Guest</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground">{title}</span>
          <Button variant="outline" size="sm" onClick={() => { endGuestSession(); navigate("/login"); }}>
            <LogOut className="mr-1 h-4 w-4" /> Exit
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
        © 2026 <span className="font-bold text-foreground">Ethical India</span>. All rights reserved.
      </footer>
    </div>
  );
}

function requireGuest(navigate: ReturnType<typeof useNavigate>): GuestSession | null {
  const s = getGuestSession();
  if (!s) {
    navigate("/login", { replace: true });
    return null;
  }
  return s;
}

// ---- Page: list of guest tests ----
export const GuestTests = () => {
  const navigate = useNavigate();
  const [, force] = useState(0);
  useEffect(() => { if (!requireGuest(navigate)) return; }, [navigate]);
  const session = getGuestSession();
  if (!session) return null;

  const tests = getGuestTests();

  return (
    <GuestShell title="Available Tests">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h1 className="font-display text-xl font-bold text-foreground">Welcome, Guest</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a test below. You'll fill your details before starting. Each test can be taken once per session.
          </p>
        </div>

        {tests.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No guest tests are available right now.</p>
          </div>
        )}

        {tests.map(t => {
          const taken = hasGuestAttempted(session.id, t.id);
          return (
            <div key={t.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.timeLimitMinutes} min · {t.questions.length} questions
                    {t.liveCameraEnabled ? " · Camera proctored" : ""}
                  </p>
                </div>
              </div>
              {taken ? (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success shrink-0">Already submitted</span>
              ) : (
                <Button
                  variant="hero"
                  className="w-full sm:w-auto shrink-0"
                  onClick={() => navigate(`/guest/start?testId=${t.id}`)}
                >
                  Start Test
                </Button>
              )}
            </div>
          );
        })}
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => force(x => x + 1)}
        >
          Refresh list
        </button>
      </div>
    </GuestShell>
  );
};

// ---- Page: details form before exam ----
export const GuestStart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const testId = params.get("testId") || "";
  useEffect(() => { if (!requireGuest(navigate)) return; }, [navigate]);

  const test = getTests().find(t => t.id === testId);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  if (!test || !test.isGuestTest) {
    return (
      <GuestShell title="Test not found">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-card">
          <p className="text-muted-foreground">This test is not available for guests.</p>
          <Button className="mt-4" onClick={() => navigate("/guest/tests")}>Back to tests</Button>
        </div>
      </GuestShell>
    );
  }

  const handleStart = () => {
    if (!name.trim() || !mobile.trim() || !email.trim() || !gender) {
      toast({ title: "Missing details", description: "Please fill all fields to continue.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toast({ title: "Invalid mobile", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    // Stash details for the attempt page
    sessionStorage.setItem("ei_guest_pending_details", JSON.stringify({
      name: name.trim(), mobile: mobile.trim(), email: email.trim().toLowerCase(), gender,
    }));
    navigate(`/guest/test-attempt?testId=${test.id}`);
  };

  return (
    <GuestShell title="Your Details">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">{test.name}</h2>
          <p className="text-sm text-muted-foreground">
            {test.timeLimitMinutes} min · {test.questions.length} questions
            {test.liveCameraEnabled ? " · Camera proctored" : ""}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div>
            <Label className="text-sm font-medium">Full Name *</Label>
            <Input className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="As per ID" />
          </div>
          <div>
            <Label className="text-sm font-medium">Mobile Number *</Label>
            <Input
              className="mt-1"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit number"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Email ID *</Label>
            <Input className="mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-sm font-medium">Gender *</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female" | "other")}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            By starting the test you agree to be monitored. Tab switches{test.liveCameraEnabled ? ", camera feed" : ""}, and screenshot attempts are logged.
          </div>

          <Button variant="hero" className="w-full" onClick={handleStart}>Start Test</Button>
        </div>
      </div>
    </GuestShell>
  );
};

// ---- Page: the actual exam (mirrors student TestAttempt but writes to guest store) ----
export const GuestTestAttempt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const session = getGuestSession();
  const detailsRaw = sessionStorage.getItem("ei_guest_pending_details");
  const details = detailsRaw ? JSON.parse(detailsRaw) as { name: string; mobile: string; email: string; gender: "male" | "female" | "other" } : null;

  const [test, setTest] = useState<Test | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; totalMarks: number; percentage: number; passed: boolean } | null>(null);

  const tabSwitchRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Guard
  useEffect(() => {
    if (!session) { navigate("/login", { replace: true }); return; }
    if (!details) { navigate("/guest/tests", { replace: true }); return; }
  }, [navigate, session, details]);

  // Load + shuffle test
  useEffect(() => {
    const testId = params.get("testId");
    if (!testId) return;
    const found = getTests().find(t => t.id === testId);
    if (!found || !found.isGuestTest) { navigate("/guest/tests", { replace: true }); return; }
    if (session && hasGuestAttempted(session.id, found.id)) {
      navigate("/guest/tests", { replace: true });
      return;
    }
    const shuffled = { ...found, questions: [...found.questions] };
    for (let i = shuffled.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled.questions[i], shuffled.questions[j]] = [shuffled.questions[j], shuffled.questions[i]];
    }
    setTest(shuffled);
    setTimeLeft(found.timeLimitMinutes * 60);
  }, [params, navigate, session]);

  // Camera (mirrors StudentPages logic so admin Live Test view sees guest feeds too)
  useEffect(() => {
    if (!test || !session || !details || test.liveCameraEnabled !== true) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120, facingMode: "user" } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraActive(true);
        const capture = () => {
          if (videoRef.current && !submitted) {
            const canvas = document.createElement("canvas");
            canvas.width = 160; canvas.height = 120;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 160, 120);
              const image = canvas.toDataURL("image/jpeg", 0.5);
              saveCameraSnapshot({
                studentId: session.id, // reuse field; guest id distinguishes itself
                studentName: `${details.name} (Guest)`,
                testId: test.id,
                testName: test.name,
                image,
                timestamp: new Date().toISOString(),
              });
            }
          }
        };
        setTimeout(capture, 800);
        cameraIntervalRef.current = setInterval(capture, 2000);
      } catch {
        setCameraError(true);
        toast({ title: "Camera Required", description: "Please allow camera access for this proctored exam.", variant: "destructive" });
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (cameraIntervalRef.current) clearInterval(cameraIntervalRef.current);
      if (session && test) removeCameraSnapshot(session.id, test.id);
    };
  }, [test, session, details, submitted, toast]);

  // Cleanup snapshot on tab close
  useEffect(() => {
    if (!test || !session || test.liveCameraEnabled !== true) return;
    const handler = () => removeCameraSnapshot(session.id, test.id);
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [test, session]);

  // Block navigation
  useEffect(() => {
    if (!test || submitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have an active exam. Please submit before leaving.";
    };
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast({ title: "⚠️ Exam Active", description: "Please submit before navigating away.", variant: "destructive" });
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [test, submitted, toast]);

  // Tab switch detection
  useEffect(() => {
    if (!test || submitted) return;
    const onVis = () => {
      if (document.hidden) {
        tabSwitchRef.current += 1;
        toast({ title: "⚠️ Tab Switch Detected!", description: `Warning: Tab switching is monitored. Count: ${tabSwitchRef.current}`, variant: "destructive" });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [test, submitted, toast]);

  // Screenshot / screen-cast protection
  useEffect(() => {
    if (!test || submitted) return;
    const onVis = () => { document.body.style.filter = document.hidden ? "blur(30px)" : "none"; };
    const onBlur = () => { document.body.style.filter = "blur(30px)"; };
    const onFocus = () => { document.body.style.filter = "none"; };
    const style = document.createElement("style");
    style.textContent = `@media print { body { display: none !important; } } body { -webkit-touch-callout: none; }`;
    document.head.appendChild(style);
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const isScreenshot =
        k === "PrintScreen" ||
        (e.shiftKey && (e.metaKey || e.getModifierState("OS") || e.getModifierState("Meta")) && k.toLowerCase() === "s") ||
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(k));
      if (isScreenshot) {
        e.preventDefault();
        document.body.style.filter = "blur(30px)";
        try { navigator.clipboard.writeText(""); } catch { /* ignore */ }
        setTimeout(() => { document.body.style.filter = "none"; }, 2500);
        toast({ title: "⚠️ Screenshot Blocked", description: "Screenshots are not allowed during the exam.", variant: "destructive" });
      }
    };
    const md: any = navigator.mediaDevices as any;
    const original = md && md.getDisplayMedia ? md.getDisplayMedia.bind(md) : null;
    if (md && original) {
      md.getDisplayMedia = () => {
        toast({ title: "⚠️ Screen Sharing Blocked", description: "Screen sharing is not allowed during the exam.", variant: "destructive" });
        document.body.style.filter = "blur(30px)";
        setTimeout(() => { document.body.style.filter = "none"; }, 2500);
        return Promise.reject(new DOMException("Screen capture is disabled during the exam.", "NotAllowedError"));
      };
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKey);
      document.body.style.filter = "none";
      style.remove();
      if (md && original) md.getDisplayMedia = original;
    };
  }, [test, submitted, toast]);

  const submitTest = useCallback(() => {
    if (!test || !session || !details || submitted) return;
    setSubmitted(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (cameraIntervalRef.current) clearInterval(cameraIntervalRef.current);
    removeCameraSnapshot(session.id, test.id);

    let score = 0;
    let totalMarks = 0;
    for (const q of test.questions) {
      totalMarks += q.marks;
      if (q.type === "mcq") {
        if (answers[q.id] === q.correctAnswer) score += q.marks;
      } else {
        // For guest tests we keep grading automatic-ish: keyword match on subjective
        const a = (answers[q.id] || "").toLowerCase();
        const kw = q.correctAnswer.toLowerCase();
        if (a && kw && a.includes(kw)) score += q.marks;
        else if (a.length > 10) score += Math.floor(q.marks * 0.4);
      }
    }
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = percentage >= test.passPercentage;

    const attempt: GuestAttempt = {
      id: `gattempt-${Date.now()}`,
      guestSessionId: session.id,
      testId: test.id,
      testName: test.name,
      guestName: details.name,
      guestMobile: details.mobile,
      guestEmail: details.email,
      guestGender: details.gender,
      answers,
      score,
      totalMarks,
      percentage,
      passed,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: (test.timeLimitMinutes * 60) - timeLeft,
      tabSwitchCount: tabSwitchRef.current,
    };
    saveGuestAttempt(attempt);
    setResult({ score, totalMarks, percentage, passed });
    sessionStorage.removeItem("ei_guest_pending_details");
  }, [test, session, details, answers, submitted, timeLeft]);

  // Countdown
  useEffect(() => {
    if (!test || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); submitTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, submitted, timeLeft, submitTest]);

  if (!session || !details) return null;

  if (!test) {
    return (
      <GuestShell title="Test">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading test…</p>
        </div>
      </GuestShell>
    );
  }

  if (test.liveCameraEnabled && cameraError && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card text-center">
          <Camera className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Camera Access Required</h2>
          <p className="text-sm text-muted-foreground mb-4">This is a proctored exam. You must allow camera access to proceed.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Result screen
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-card text-center">
          {result.passed ? (
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          ) : (
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-destructive" />
          )}
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            {result.passed ? "🎉 You Passed!" : "Test Submitted"}
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Score: <span className="font-bold text-foreground">{result.score}/{result.totalMarks}</span> ({result.percentage}%)
          </p>
          <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-medium ${
            result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {result.passed ? "PASSED" : "FAILED"}
          </span>
          {tabSwitchRef.current > 0 && (
            <p className="mt-3 text-xs text-destructive">Tab switches detected: {tabSwitchRef.current}</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Your result has been recorded. Guests do not receive certificates.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/guest/tests")}>Back to tests</Button>
            <Button onClick={() => { endGuestSession(); navigate("/login"); }}>Exit</Button>
          </div>
        </div>
      </div>
    );
  }

  const q = test.questions[currentQ];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 120;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display text-base sm:text-lg font-bold text-foreground truncate min-w-0 flex-1">
            {test.name} <span className="text-xs font-normal text-muted-foreground">— {details.name}</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {test.liveCameraEnabled && (
              <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ${cameraActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                <Camera className="h-3.5 w-3.5" />
                {cameraActive ? "Live" : "Off"}
              </div>
            )}
            {tabSwitchRef.current > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
                <EyeOff className="h-3.5 w-3.5" />
                {tabSwitchRef.current}
              </div>
            )}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
              isLowTime ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"
            }`}>
              <Clock className="h-4 w-4" />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4 space-y-6">
        {test.liveCameraEnabled && cameraActive && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg overflow-hidden border-2 border-border shadow-lg">
            <video ref={videoRef} autoPlay muted playsInline className="w-32 h-24 object-cover bg-black" />
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-secondary" />
            Question {currentQ + 1} of {test.questions.length}
          </div>
          <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{test.questions.length} answered</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">{q.type}</span>
            <span className="text-xs text-muted-foreground">{q.marks} marks</span>
          </div>
          <h3 className="mb-4 text-lg font-medium text-foreground">{q.text}</h3>

          {q.type === "mcq" && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                    answers[q.id] === opt
                      ? "border-secondary bg-secondary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-secondary/50"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "short" && (
            <Input value={answers[q.id] || ""} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Type your answer..." />
          )}

          {q.type === "long" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Write your detailed answer..."
              className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" className="w-full sm:w-auto" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>Previous</Button>
          <div className="flex gap-1 flex-wrap justify-center order-last sm:order-none">
            {test.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                  i === currentQ ? "bg-primary text-primary-foreground" :
                  answers[test.questions[i].id] !== undefined ? "bg-success/20 text-success" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {currentQ < test.questions.length - 1 ? (
            <Button className="w-full sm:w-auto" onClick={() => setCurrentQ(currentQ + 1)}>Next</Button>
          ) : (
            <Button variant="hero" className="w-full sm:w-auto" onClick={submitTest} disabled={submitted}>Submit Test</Button>
          )}
        </div>
      </div>
    </div>
  );
};