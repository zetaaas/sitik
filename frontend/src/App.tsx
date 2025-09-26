import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ModerationPage } from '@/pages/ModerationPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { FilesPage } from '@/pages/FilesPage';
import { LiveSessionsPage } from '@/pages/LiveSessionsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="live" element={<LiveSessionsPage />} />
          <Route element={<ProtectedRoute roles={['moderator', 'admin']} />}>
            <Route path="moderation" element={<ModerationPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
