import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isAfter } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { listModerationQueue, listUsers, listLiveSessions } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    enabled: !!user && user.role === 'admin',
  });

  const { data: moderation } = useQuery({
    queryKey: ['moderation'],
    queryFn: listModerationQueue,
    enabled: !!user && ['moderator', 'admin'].includes(user.role),
  });

  const { data: sessions } = useQuery({ queryKey: ['live-sessions'], queryFn: listLiveSessions });

  const pendingVolunteers = useMemo(
    () => users?.filter((item) => item.volunteer_status === 'pending') ?? [],
    [users],
  );

  const upcomingLive = useMemo(
    () =>
      (sessions ?? [])
        .filter((session) => isAfter(new Date(session.scheduled_for), new Date()))
        .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
        .slice(0, 5),
    [sessions],
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-primary">{t('dashboard.pendingVolunteers')}</h2>
        <p className="mt-2 text-4xl font-bold text-accent">{pendingVolunteers.length}</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {pendingVolunteers.slice(0, 5).map((volunteer) => (
            <li key={volunteer.id} className="flex items-center justify-between">
              <span>{volunteer.email}</span>
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">pending</span>
            </li>
          ))}
          {pendingVolunteers.length === 0 && <li className="text-sm text-gray-400">—</li>}
        </ul>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-primary">{t('dashboard.moderationQueue')}</h2>
        <p className="mt-2 text-4xl font-bold text-accent">{moderation?.length ?? 0}</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {(moderation ?? []).slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <span>{item.target_type}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">#{item.target_id}</span>
            </li>
          ))}
          {(moderation?.length ?? 0) === 0 && <li className="text-sm text-gray-400">—</li>}
        </ul>
      </section>

      <section className="rounded-lg bg-white p-6 shadow md:col-span-2 xl:col-span-1">
        <h2 className="text-lg font-semibold text-primary">{t('dashboard.upcomingLive')}</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-600">
          {upcomingLive.map((session) => (
            <li key={session.id} className="rounded border border-gray-200 p-3">
              <p className="font-semibold text-primary">{session.title}</p>
              <p>{format(new Date(session.scheduled_for), 'dd.MM.yyyy HH:mm')}</p>
              <p className="text-xs text-gray-500">ID: {session.conference_id}</p>
            </li>
          ))}
          {upcomingLive.length === 0 && <li className="text-sm text-gray-400">—</li>}
        </ul>
      </section>
    </div>
  );
};
