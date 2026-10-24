import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

export default function AdminRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const notified = useRef(false);
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (user && !isAdmin && !notified.current) {
      notified.current = true;
      toast.error('Administrator access is required for that page.');
    }
  }, [user, isAdmin]);

  if (isLoading) return <Loader label="Checking administrator access..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
