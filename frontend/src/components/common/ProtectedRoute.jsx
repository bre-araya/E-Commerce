import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

// adminOnly prop defaults to false
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();

  // Still checking localStorage token — show spinner
  if (loading) return <Spinner />;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not admin, and this route needs admin
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  // All checks passed — render the child route
  return <Outlet />;
}