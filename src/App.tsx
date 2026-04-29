import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import { ManageStudents, AdminTests, AdminResults, AdminCertificates, AdminSettings, CreateTest, AdminRetakeRequests, AdminBatches, AdminFeedback, AdminLiveTest, AdminGuestResults } from "./pages/dashboard/AdminPages";
import { StudentTests, TestHistory, StudentCertificates, TestAttempt, StudentProfile, StudentHelp } from "./pages/dashboard/StudentPages";
import { GuestTests, GuestStart, GuestTestAttempt } from "./pages/GuestPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><ManageStudents /></ProtectedRoute>} />
          <Route path="/dashboard/admin/batches" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBatches /></ProtectedRoute>} />
          <Route path="/dashboard/admin/tests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTests /></ProtectedRoute>} />
          <Route path="/dashboard/admin/create-test" element={<ProtectedRoute allowedRoles={["admin"]}><CreateTest /></ProtectedRoute>} />
          <Route path="/dashboard/admin/edit-test" element={<ProtectedRoute allowedRoles={["admin"]}><CreateTest /></ProtectedRoute>} />
          <Route path="/dashboard/admin/results" element={<ProtectedRoute allowedRoles={["admin"]}><AdminResults /></ProtectedRoute>} />
          <Route path="/dashboard/admin/certificates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCertificates /></ProtectedRoute>} />
          <Route path="/dashboard/admin/retake-requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRetakeRequests /></ProtectedRoute>} />
          <Route path="/dashboard/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
          <Route path="/dashboard/admin/feedback" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFeedback /></ProtectedRoute>} />
          <Route path="/dashboard/admin/live-test" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLiveTest /></ProtectedRoute>} />
          <Route path="/dashboard/admin/guest-results" element={<ProtectedRoute allowedRoles={["admin"]}><AdminGuestResults /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
          <Route path="/dashboard/student/tests" element={<ProtectedRoute allowedRoles={["student"]}><StudentTests /></ProtectedRoute>} />
          <Route path="/dashboard/student/history" element={<ProtectedRoute allowedRoles={["student"]}><TestHistory /></ProtectedRoute>} />
          <Route path="/dashboard/student/certificates" element={<ProtectedRoute allowedRoles={["student"]}><StudentCertificates /></ProtectedRoute>} />
          <Route path="/dashboard/student/test-attempt" element={<ProtectedRoute allowedRoles={["student"]}><TestAttempt /></ProtectedRoute>} />
          <Route path="/dashboard/student/help" element={<ProtectedRoute allowedRoles={["student"]}><StudentHelp /></ProtectedRoute>} />

          {/* Guest Routes (public — no role required) */}
          <Route path="/guest/tests" element={<GuestTests />} />
          <Route path="/guest/start" element={<GuestStart />} />
          <Route path="/guest/test-attempt" element={<GuestTestAttempt />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
