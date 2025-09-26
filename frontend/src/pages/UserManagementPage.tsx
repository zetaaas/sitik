import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { listUsers, updateUserRole } from '@/lib/api';
import type { UserRole, VolunteerStatus } from '@/lib/types';

const roles: UserRole[] = ['guest', 'volunteer', 'moderator', 'admin'];
const statuses: VolunteerStatus[] = ['pending', 'approved', 'banned'];

export const UserManagementPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const mutation = useMutation({
    mutationFn: ({ userId, role, status }: { userId: number; role: UserRole; status: VolunteerStatus }) =>
      updateUserRole(userId, { role, volunteer_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('navigation.users')}</h1>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('users.email')}</th>
              <th className="px-4 py-3">{t('users.role')}</th>
              <th className="px-4 py-3">{t('users.status')}</th>
              <th className="px-4 py-3">{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      mutation.mutate({ userId: user.id, role: event.target.value as UserRole, status: user.volunteer_status })
                    }
                    className="rounded-md border border-gray-300 px-2 py-1"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.volunteer_status}
                    onChange={(event) =>
                      mutation.mutate({ userId: user.id, role: user.role, status: event.target.value as VolunteerStatus })
                    }
                    className="rounded-md border border-gray-300 px-2 py-1"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">
                  {t('users.createdAt')}: {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
