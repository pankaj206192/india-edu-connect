import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StaffDashboard from "./pages/dashboard/StaffDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import { ManageStaff, ManageStudents, AdminTests, AdminResults, AdminCertificates, AdminSettings } from "./pages/dashboard/AdminPages";
import { StaffTests, CreateTest, StaffStudents, StaffResults } from "./pages/dashboard/StaffPages";
import { StudentTests, TestHistory, StudentCertificates, TestAttempt } from "./pages/dashboard/StudentPages";
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
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/staff" element={<ManageStaff />} />
          <Route path="/dashboard/admin/students" element={<ManageStudents />} />
          <Route path="/dashboard/admin/tests" element={<AdminTests />} />
          <Route path="/dashboard/admin/results" element={<AdminResults />} />
          <Route path="/dashboard/admin/certificates" element={<AdminCertificates />} />
          <Route path="/dashboard/admin/settings" element={<AdminSettings />} />

          {/* Staff Routes */}
          <Route path="/dashboard/staff" element={<StaffDashboard />} />
          <Route path="/dashboard/staff/tests" element={<StaffTests />} />
          <Route path="/dashboard/staff/create-test" element={<CreateTest />} />
          <Route path="/dashboard/staff/students" element={<StaffStudents />} />
          <Route path="/dashboard/staff/results" element={<StaffResults />} />

          {/* Student Routes */}
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/student/tests" element={<StudentTests />} />
          <Route path="/dashboard/student/history" element={<TestHistory />} />
          <Route path="/dashboard/student/certificates" element={<StudentCertificates />} />
          <Route path="/dashboard/student/test-attempt" element={<TestAttempt />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
