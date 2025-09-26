import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { useOffline } from '@/hooks/useOffline';

const linkBase = 'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors';

export const AppLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const isOffline = useOffline();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        {isOffline && <OfflineBanner />}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-lg font-semibold text-primary">
            {t('app.title')}
          </Link>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user && (
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>{user.email}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase">{user.role}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  {t('app.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
        <nav className="bg-gray-50">
          <div className="mx-auto flex max-w-7xl items-center space-x-2 px-4 py-2 sm:px-6 lg:px-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
            >
              {t('navigation.dashboard')}
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
            >
              {t('navigation.projects')}
            </NavLink>
            {user && ['moderator', 'admin'].includes(user.role) && (
              <NavLink
                to="/moderation"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                {t('navigation.moderation')}
              </NavLink>
            )}
            {user && user.role === 'admin' && (
              <NavLink
                to="/users"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                {t('navigation.users')}
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/files"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                {t('navigation.files')}
              </NavLink>
            )}
            <NavLink
              to="/live"
              className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
            >
              {t('navigation.live')}
            </NavLink>
            {user && ['moderator', 'admin'].includes(user.role) && (
              <NavLink
                to="/analytics"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                {t('navigation.analytics')}
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1 bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
