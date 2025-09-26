import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchProjectFiles, fetchProjects, uploadProjectFile } from '@/lib/api';
import type { Project } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export const FilesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => fetchProjects(),
  });

  const { data: files = [], isFetching } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => fetchProjectFiles(projectId!),
    enabled: projectId !== null,
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    try {
      setError(null);
      await uploadProjectFile(projectId, file);
      await queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      event.target.value = '';
    }
  };

  if (!user) {
    return null;
  }

  if (user.role === 'volunteer' && user.volunteer_status !== 'approved') {
    return <p className="text-sm text-red-500">{t('auth.volunteerPending')}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('files.title')}</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">{t('projects.selectLabel')}</label>
          <select
            value={projectId ?? ''}
            onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : null)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">—</option>
            {projects.map((project: Project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        {projectId && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">{t('files.select')}</label>
            <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={handleUpload} />
            {error && <p className="text-sm text-red-500">{t('files.uploadError')}</p>}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        {projectId ? (
          <ul className="space-y-3 text-sm">
            {files.map((file) => (
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
            {!isFetching && files.length === 0 && <li className="text-sm text-gray-400">—</li>}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">{t('files.selectProjectPrompt')}</p>
        )}
      </div>
    </div>
  );
};
