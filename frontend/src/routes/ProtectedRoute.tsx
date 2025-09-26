import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/types';

interface Props {
  roles?: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({ roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
