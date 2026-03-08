import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, History, Award, BookOpen, Download, Clock, CheckCircle, RotateCcw, User as UserIcon, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUsers, updateUser, type User } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import {
  getTestsForStudent, hasAttempted, getAttemptsForStudent,
  getCertificatesForStudent, gradeTest, saveAttempt, saveCertificate,
  generateCertificateId, getTests, type Test,
  hasRetakeRequest, saveRetakeRequest, getRetakeRequestsForStudent,
} from "@/lib/store";
import { generateCertificatePDF } from "@/lib/pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const navItems = [
  { label: "Dashboard", path: "/dashboard/student", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", path: "/dashboard/student/profile", icon: <UserIcon className="h-4 w-4" /> },
  { label: "My Tests", path: "/dashboard/student/tests", icon: <FileText className="h-4 w-4" /> },
  { label: "Test History", path: "/dashboard/student/history", icon: <History className="h-4 w-4" /> },
  { label: "Certificates", path: "/dashboard/student/certificates", icon: <Award className="h-4 w-4" /> },
];

export const StudentTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const tests = getTestsForStudent(user.id);
  const pendingTests = tests.filter(t => !hasAttempted(user.id, t.id));

  return (
    <DashboardLayout role="student" navItems={navItems} title="My Tests">
      <div className="space-y-4">
        {pendingTests.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-success" />
            <h3 className="font-display text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No pending tests right now.</p>
          </div>
        )}
        {pendingTests.map(test => (
          <div key={test.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{test.name}</h3>
                <p className="text-sm text-muted-foreground">{test.timeLimitMinutes} min · {test.questions.length} questions</p>
              </div>
            </div>
            <Button variant="hero" onClick={() => navigate(`/dashboard/student/test-attempt?testId=${test.id}`)}>
              Start Test
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export const TestHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [retakeReason, setRetakeReason] = useState("");
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<{ attemptId: string; testId: string; testName: string } | null>(null);
  const [, setRefresh] = useState(0);
  if (!user) return null;

  const attempts = getAttemptsForStudent(user.id);
  const retakeRequests = getRetakeRequestsForStudent(user.id);

  const handleRetakeRequest = () => {
    if (!selectedAttempt || !retakeReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for retake.", variant: "destructive" });
      return;
    }
    saveRetakeRequest({
      id: `retake-${Date.now()}`,
      testId: selectedAttempt.testId,
      studentId: user.id,
      studentName: user.name,
      testName: selectedAttempt.testName,
      attemptId: selectedAttempt.attemptId,
      reason: retakeReason.trim(),
      status: "pending",
      requestedAt: new Date().toISOString(),
    });
    toast({ title: "Request Sent", description: "Your retake request has been submitted for admin approval." });
    setRetakeDialogOpen(false);
    setRetakeReason("");
    setSelectedAttempt(null);
    setRefresh(r => r + 1);
  };

  const getRetakeStatus = (testId: string) => {
    const req = retakeRequests.find(r => r.testId === testId);
    if (!req) return null;
    return req.status;
  };

  return (
    <DashboardLayout role="student" navItems={navItems} title="Test History">
      <div className="space-y-6">
        {attempts.length === 0 ? (
          <p className="text-muted-foreground">No tests attempted yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => {
                  const test = getTests().find(t => t.id === a.testId);
                  const retakeStatus = getRetakeStatus(a.testId);
                  const hasPending = hasRetakeRequest(user.id, a.testId);
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{test?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(a.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.score}/{a.totalMarks} ({a.percentage}%)</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          a.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                          {a.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!a.passed && !hasPending && retakeStatus !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAttempt({ attemptId: a.id, testId: a.testId, testName: test?.name || "Unknown" });
                              setRetakeDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" /> Request Retake
                          </Button>
                        )}
                        {hasPending && (
                          <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Pending</span>
                        )}
                        {retakeStatus === "rejected" && !hasPending && (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={retakeDialogOpen} onOpenChange={setRetakeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Retake — {selectedAttempt?.testName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-foreground">Reason for retake</label>
              <textarea
                value={retakeReason}
                onChange={e => setRetakeReason(e.target.value)}
                placeholder="Explain why you'd like to retake this test..."
                className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button className="w-full" onClick={handleRetakeRequest}>Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export const StudentCertificates = () => {
  const { user } = useAuth();
  if (!user) return null;

  const certs = getCertificatesForStudent(user.id);
  const approvedCerts = certs.filter(c => c.status === "approved");
  const pendingCerts = certs.filter(c => c.status === "pending");
  const rejectedCerts = certs.filter(c => c.status === "rejected");

  return (
    <DashboardLayout role="student" navItems={navItems} title="My Certificates">
      <div className="space-y-6">
        {certs.length === 0 && (
          <p className="text-muted-foreground">No certificates yet. Pass a test to earn one!</p>
        )}

        {pendingCerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Approval</h3>
            {pendingCerts.map(c => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card opacity-75">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Pending</span>
                </div>
                <h3 className="font-medium text-foreground">{c.testName}</h3>
                <p className="text-sm text-muted-foreground">Score: {c.percentage}% · {new Date(c.issuedAt).toLocaleDateString()}</p>
                <p className="mt-2 text-xs text-muted-foreground italic">Awaiting admin approval to issue certificate.</p>
              </div>
            ))}
          </div>
        )}

        {approvedCerts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approvedCerts.map(c => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                  <Award className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-medium text-foreground">{c.testName}</h3>
                <p className="text-sm text-muted-foreground">Score: {c.percentage}% · {new Date(c.issuedAt).toLocaleDateString()}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => generateCertificatePDF(c)}
                >
                  <Download className="mr-1 h-4 w-4" /> Download PDF
                </Button>
              </div>
            ))}
          </div>
        )}

        {rejectedCerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-destructive">Rejected</h3>
            {rejectedCerts.map(c => (
              <div key={c.id} className="rounded-xl border border-destructive/30 bg-card p-5 shadow-card opacity-75">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Rejected</span>
                </div>
                <h3 className="font-medium text-foreground">{c.testName}</h3>
                <p className="text-sm text-muted-foreground">Score: {c.percentage}% · {new Date(c.issuedAt).toLocaleDateString()}</p>
                <p className="mt-2 text-xs text-destructive/80 italic">This certificate has been rejected by admin.</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const TestAttempt = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [test, setTest] = useState<Test | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Load test from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get("testId");
    if (testId) {
      const found = getTests().find(t => t.id === testId);
      if (found) {
        setTest(found);
        setTimeLeft(found.timeLimitMinutes * 60);
      }
    }
  }, []);

  const submitTest = useCallback(() => {
    if (!test || !user || submitted) return;
    setSubmitted(true);

    const { score, totalMarks } = gradeTest(test, answers);
    const percentage = Math.round((score / totalMarks) * 100);
    const passed = percentage >= test.passPercentage;

    const attempt = {
      id: `attempt-${Date.now()}`,
      testId: test.id,
      studentId: user.id,
      studentName: user.name,
      answers,
      score,
      totalMarks,
      percentage,
      passed,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: (test.timeLimitMinutes * 60) - timeLeft,
    };

    saveAttempt(attempt);

    if (passed) {
      const cert: import("@/lib/store").Certificate = {
        id: generateCertificateId(),
        attemptId: attempt.id,
        testId: test.id,
        testName: test.name,
        studentId: user.id,
        studentName: user.name,
        score,
        percentage,
        issuedAt: new Date().toISOString(),
        status: "pending" as const,
      };
      saveCertificate(cert);
    }

    toast({
      title: passed ? "🎉 Test Passed!" : "Test Submitted",
      description: `You scored ${score}/${totalMarks} (${percentage}%). ${passed ? "Certificate pending admin approval." : "Better luck next time."}`,
    });

    navigate("/dashboard/student/history");
  }, [test, user, answers, submitted, timeLeft, toast, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!test || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, submitted, timeLeft, submitTest]);

  if (!test || !user) {
    return (
      <DashboardLayout role="student" navItems={navItems} title="Test">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Test not found or already submitted.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/student/tests")}>Back to Tests</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (hasAttempted(user.id, test.id) && !submitted) {
    return (
      <DashboardLayout role="student" navItems={navItems} title="Test">
        <div className="text-center py-12">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-success" />
          <p className="text-foreground font-medium">You have already attempted this test.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/student/history")}>View History</Button>
        </div>
      </DashboardLayout>
    );
  }

  const q = test.questions[currentQ];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 120;

  return (
    <DashboardLayout role="student" navItems={navItems} title={`Test: ${test.name}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-secondary" />
            Question {currentQ + 1} of {test.questions.length}
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
            isLowTime ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"
          }`}>
            <Clock className="h-4 w-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        {/* Question */}
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
            <Input
              value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Type your answer..."
            />
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

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
            Previous
          </Button>
          <div className="flex gap-1 flex-wrap justify-center">
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
            <Button onClick={() => setCurrentQ(currentQ + 1)}>Next</Button>
          ) : (
            <Button variant="hero" onClick={submitTest} disabled={submitted}>
              Submit Test
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const StudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  const latestUser = getUsers().find(u => u.id === user.id) || user;

  const fields = [
    { label: "Full Name", value: latestUser.name },
    { label: "Email Address", value: latestUser.email },
    { label: "Gender", value: latestUser.gender ? latestUser.gender.charAt(0).toUpperCase() + latestUser.gender.slice(1) : "—" },
    { label: "Mobile Number", value: latestUser.mobile || "—" },
  ];

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    updateUser(user.id, { password: newPassword });
    toast({ title: "Success", description: "Your password has been updated." });
    setResettingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <DashboardLayout role="student" navItems={navItems} title="My Profile">
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden border-2 border-border">
              {latestUser.photo ? (
                <img src={latestUser.photo} alt={latestUser.name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{latestUser.name}</h2>
              <p className="text-sm text-muted-foreground">Student</p>
            </div>
          </div>
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.label} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</span>
                <div className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground">
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          {/* Reset Password */}
          {!resettingPassword ? (
            <Button variant="outline" className="w-full" onClick={() => setResettingPassword(true)}>
              <KeyRound className="mr-2 h-4 w-4" /> Reset Password
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-semibold text-foreground">Reset Password</h3>
              <Input placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!newPassword || newPassword !== confirmPassword}
                  onClick={handleResetPassword}
                >
                  {!newPassword ? "Enter password" : newPassword !== confirmPassword ? "Passwords don't match" : "Update Password"}
                </Button>
                <Button variant="outline" onClick={() => { setResettingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground italic">Other profile details are managed by the admin.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};
