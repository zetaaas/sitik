import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchProjectFiles,
  fetchProjectStages,
  fetchProjects,
  submitProjectDraft,
} from '@/lib/api';
import type { Project, ProjectFile, ProjectStage } from '@/lib/types';
import { ProjectsMap } from '@/components/map/ProjectsMap';
import { useAuth } from '@/context/AuthContext';

interface StageForm {
  title: string;
  description: string;
}

export const ProjectsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [bounds, setBounds] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projectsQuery = useQuery<Project[]>({
    queryKey: ['projects', bounds],
    queryFn: () => fetchProjects(bounds || undefined),
    placeholderData: (previous) => previous ?? [],
  });

  const projects = projectsQuery.data ?? [];
  const isLoading = projectsQuery.isPending;

  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const stagesQuery = useQuery<ProjectStage[]>({
    queryKey: ['project-stages', selectedProject?.id],
    queryFn: () => fetchProjectStages(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const filesQuery = useQuery<ProjectFile[]>({
    queryKey: ['project-files', selectedProject?.id],
    queryFn: () => fetchProjectFiles(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<StageForm>({ defaultValues: { title: '', description: '' } });

  const onBoundsChange = useCallback((value: string) => {
    setBounds(value);
  }, []);

  const onSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const onSubmit = async (values: StageForm) => {
    if (!selectedProject) return;
    await submitProjectDraft(selectedProject.id, { ...values, is_draft: true });
    reset();
    await queryClient.invalidateQueries({ queryKey: ['project-stages', selectedProject.id] });
  };

  const canProposeChange = useMemo(
    () => user && ['volunteer', 'moderator', 'admin'].includes(user.role),
    [user],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('projects.mapTitle')}</h1>
      <ProjectsMap projects={projects} onBoundsChange={onBoundsChange} onSelect={onSelectProject} />
      <p className="text-sm text-gray-500">Bounds: {bounds || '—'}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('projects.stages')}</h2>
          {selectedProject ? (
            <>
              <p className="mt-2 text-sm text-gray-600">{selectedProject.title}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {(stagesQuery.data ?? []).map((stage) => (
                  <li key={stage.id} className="rounded border border-gray-200 p-3">
                    <p className="font-medium text-primary">{stage.title}</p>
                    <p className="text-xs text-gray-500">{stage.status}</p>
                    {stage.description && <p className="mt-2 text-gray-600">{stage.description}</p>}
                  </li>
                ))}
                {stagesQuery.data?.length === 0 && <li className="text-sm text-gray-400">—</li>}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-400">{t('projects.selectProject')}</p>
          )}
        </section>
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('files.title')}</h2>
          {selectedProject ? (
            <ul className="mt-4 space-y-3 text-sm">
              {(filesQuery.data ?? []).map((file) => (
                <li key={file.id} className="flex items-center justify-between rounded border border-gray-200 p-3">
                  <div>
                    <p className="font-medium text-primary">{file.filename}</p>
                    <p className="text-xs text-gray-500">{file.content_type}</p>
                    {file.quarantine && (
                      <span className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        {t('files.quarantine')}
                      </span>
                    )}
                  </div>
                  {file.thumbnail_key && (
                    <img
                      src={`/files/thumbnails/${file.thumbnail_key}`}
                      alt={file.filename}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                </li>
              ))}
              {filesQuery.data?.length === 0 && <li className="text-sm text-gray-400">—</li>}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">{t('files.selectProjectPrompt')}</p>
          )}
        </section>
      </div>
      {canProposeChange && selectedProject && (
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-primary">{t('projects.suggestChange')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('projects.suggestChange')}</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder={t('projects.suggestChange') ?? ''}
                {...register('title', { required: true })}
              />
            </div>
            <div>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={4}
                placeholder={t('projects.draftPlaceholder') ?? ''}
                {...register('description')}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-accent px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {t('projects.submitDraft')}
            </button>
          </form>
        </section>
      )}
      {isLoading && <p className="text-sm text-gray-500">{t('app.loading')}</p>}
    </div>
  );
};
