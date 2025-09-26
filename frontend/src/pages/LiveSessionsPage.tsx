import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import {
  approveQuestion,
  createLiveTask,
  fetchSessionQuestions,
  fetchSessionTasks,
  listLiveSessions,
  rejectQuestion,
  submitQuestion,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const LiveSessionsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [task, setTask] = useState({ title: '', description: '' });

  const { data: sessions = [] } = useQuery({ queryKey: ['live-sessions'], queryFn: listLiveSessions });

  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [selectedSession, sessions]);

  const questionsQuery = useQuery({
    queryKey: ['live-questions', selectedSession],
    queryFn: () => fetchSessionQuestions(selectedSession!),
    enabled: selectedSession !== null,
  });

  const tasksQuery = useQuery({
    queryKey: ['live-tasks', selectedSession],
    queryFn: () => fetchSessionTasks(selectedSession!),
    enabled: !!selectedSession,
  });

  const submitQuestionMutation = useMutation({
    mutationFn: () => submitQuestion({ session_id: selectedSession!, text: question }),
    onSuccess: () => {
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['live-questions', selectedSession] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (questionId: number) => approveQuestion(questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-questions', selectedSession] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (questionId: number) => rejectQuestion(questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-questions', selectedSession] }),
  });

  const taskMutation = useMutation({
    mutationFn: () =>
      createLiveTask({ session_id: selectedSession!, title: task.title, description: task.description }),
    onSuccess: () => {
      setTask({ title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['live-tasks', selectedSession] });
    },
  });

  const session = useMemo(() => sessions.find((item) => item.id === selectedSession) ?? null, [sessions, selectedSession]);
  const approvedQuestions = (questionsQuery.data ?? []).filter((item) => item.is_approved);
  const pendingQuestions = (questionsQuery.data ?? []).filter((item) => !item.is_approved);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('live.title')}</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <aside className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('live.sessions')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {sessions.map((item) => (
              <li
                key={item.id}
                className={`cursor-pointer rounded border border-gray-200 p-3 ${
                  selectedSession === item.id ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => setSelectedSession(item.id)}
              >
                <p className="font-medium text-primary">{item.title}</p>
                <p className="text-xs text-gray-500">{format(new Date(item.scheduled_for), 'dd.MM.yyyy HH:mm')}</p>
              </li>
            ))}
          </ul>
        </aside>
        {session && (
          <section className="md:col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="text-lg font-semibold text-primary">{session.title}</h2>
              <p className="text-sm text-gray-600">{session.description}</p>
              <p className="text-xs text-gray-500">ID: {session.conference_id}</p>
              <div className="mt-4 aspect-video overflow-hidden rounded border">
                <iframe
                  title={session.title}
                  src={`https://meet.jit.si/${session.conference_id}`}
                  className="h-full w-full"
                  allow="camera; microphone; fullscreen"
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="text-lg font-semibold text-primary">{t('live.qaTab')}</h3>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">{t('live.approved')}</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {approvedQuestions.map((item) => (
                      <li key={item.id} className="rounded border border-gray-200 p-3">
                        {item.text}
                      </li>
                    ))}
                    {approvedQuestions.length === 0 && <li className="text-sm text-gray-400">—</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">{t('live.pending')}</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {pendingQuestions.map((item) => (
                      <li key={item.id} className="rounded border border-gray-200 p-3">
                        <p>{item.text}</p>
                        {user && ['moderator', 'admin'].includes(user.role) && (
                          <div className="mt-2 flex space-x-2 text-xs">
                            <button
                              type="button"
                              className="rounded bg-emerald-500 px-3 py-1 text-white"
                              onClick={() => approveMutation.mutate(item.id)}
                            >
                              {t('moderation.approve')}
                            </button>
                            <button
                              type="button"
                              className="rounded bg-red-500 px-3 py-1 text-white"
                              onClick={() => rejectMutation.mutate(item.id)}
                            >
                              {t('moderation.reject')}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                    {pendingQuestions.length === 0 && <li className="text-sm text-gray-400">—</li>}
                  </ul>
                </div>
              </div>

              {user && (
                <div className="mt-6 space-y-3">
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={3}
                    placeholder={t('live.questionPlaceholder') ?? ''}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-md bg-accent px-4 py-2 text-white"
                    onClick={() => submitQuestionMutation.mutate()}
                    disabled={submitQuestionMutation.isPending || !question}
                  >
                    {t('live.ask')}
                  </button>
                </div>
              )}
            </div>

            {user && ['moderator', 'admin'].includes(user.role) && (
              <div className="rounded-lg bg-white p-4 shadow">
                <h3 className="text-lg font-semibold text-primary">{t('live.tasks')}</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {(tasksQuery.data ?? []).map((item) => (
                    <li key={item.id} className="rounded border border-gray-200 p-3">
                      <p className="font-medium text-primary">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </li>
                  ))}
                  {(tasksQuery.data?.length ?? 0) === 0 && <li className="text-sm text-gray-400">—</li>}
                </ul>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2"
                    placeholder={t('live.taskTitle') ?? ''}
                    value={task.title}
                    onChange={(event) => setTask((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2"
                    placeholder={t('live.taskDescription') ?? ''}
                    value={task.description}
                    onChange={(event) => setTask((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="rounded-md bg-primary px-4 py-2 text-white md:col-span-2"
                    onClick={() => taskMutation.mutate()}
                    disabled={taskMutation.isPending || !task.title}
                  >
                    {t('live.createTask')}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
