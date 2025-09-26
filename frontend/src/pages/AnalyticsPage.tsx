import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

import { downloadExcel, downloadPdf, fetchAuditLogs, fetchKpi } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

export const AnalyticsPage = () => {
  const { t } = useTranslation();
  const { data: kpi } = useQuery({ queryKey: ['analytics-kpi'], queryFn: fetchKpi });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['analytics-audit'], queryFn: fetchAuditLogs });

  const chartData = useMemo(() => {
    return {
      labels: [t('analytics.projects'), t('analytics.stages'), t('analytics.live')],
      datasets: [
        {
          label: t('analytics.kpiLabel'),
          data: [kpi?.projects ?? 0, kpi?.project_stages ?? 0, kpi?.live_sessions ?? 0],
          backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
        },
      ],
    };
  }, [kpi, t]);

  const handleDownload = async (downloader: typeof downloadPdf, filename: string) => {
    const response = await downloader();
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{t('analytics.title')}</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">{t('analytics.kpiHeading')}</h2>
          <div className="space-x-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
              onClick={() => handleDownload(downloadPdf, 'kpi.pdf')}
            >
              {t('analytics.downloadPdf')}
            </button>
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
              onClick={() => handleDownload(downloadExcel, 'kpi.xlsx')}
            >
              {t('analytics.downloadExcel')}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-primary">{t('analytics.auditLog')}</h2>
        <div className="mt-4 max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">{t('analytics.time')}</th>
                <th className="px-4 py-2 text-left">{t('analytics.user')}</th>
                <th className="px-4 py-2 text-left">{t('analytics.action')}</th>
                <th className="px-4 py-2 text-left">{t('analytics.entity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{log.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{log.action}</td>
                  <td className="px-4 py-2">{log.entity}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-sm text-gray-400">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
