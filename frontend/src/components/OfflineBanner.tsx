import { useTranslation } from 'react-i18next';

export const OfflineBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center">
      {t('app.offline')}
    </div>
  );
};
