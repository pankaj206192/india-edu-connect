import { Navigate } from "react-router-dom";
import { useAuth, Role } from "@/lib/auth";

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !allowedRoles.includes(user.role)) return <Navigate to={`/dashboard/${user.role}`} replace />;
  
  return <>{children}</>;
}
