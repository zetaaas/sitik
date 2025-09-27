import { Navigate, Outlet } from 'react-router-dom';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useAuth } from '@/context/AuthContext';

export const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
