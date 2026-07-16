import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import type { UserRole } from '../../types';
interface P { children: React.ReactNode; allowedRoles?: UserRole[]; }
export default function ProtectedRoute({ children, allowedRoles }: P) {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/" state={{ from: location }} replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
