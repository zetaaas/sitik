import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { actOnModeration, listModerationQueue } from '@/lib/api';

export const ModerationPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const { data: items = [], isFetching } = useQuery({ queryKey: ['moderation'], queryFn: listModerationQueue });

  const mutation = useMutation({
    mutationFn: (payload: { status: 'approved' | 'rejected' | 'returned' }) =>
      actOnModeration(selected!, { ...payload, reason }),
    onSuccess: () => {
      setSelected(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('navigation.moderation')}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('dashboard.moderationQueue')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className={`cursor-pointer rounded border border-gray-200 p-3 ${
                  selected === item.id ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => setSelected(item.id)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-primary">{item.target_type}</p>
                  <span className="text-xs text-gray-500">#{item.target_id}</span>
                </div>
                <p className="text-xs text-gray-500">{item.status}</p>
              </li>
            ))}
            {!isFetching && items.length === 0 && <li className="text-sm text-gray-400">—</li>}
          </ul>
        </section>
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('moderation.action')}</h2>
          {selected ? (
            <div className="space-y-4">
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={4}
                placeholder={t('moderation.reason') ?? ''}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-white"
                  onClick={() => mutation.mutate({ status: 'approved' })}
                  disabled={mutation.isPending}
                >
                  {t('moderation.approve')}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-4 py-2 text-white"
                  onClick={() => mutation.mutate({ status: 'rejected' })}
                  disabled={mutation.isPending}
                >
                  {t('moderation.reject')}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-yellow-500 px-4 py-2 text-white"
                  onClick={() => mutation.mutate({ status: 'returned' })}
                  disabled={mutation.isPending}
                >
                  {t('moderation.return')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('moderation.selectItem')}</p>
          )}
        </section>
      </div>
    </div>
  );
};
