import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'KK' },
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  return (
    <label className="flex items-center space-x-2 text-sm font-medium">
      <span>{t('app.language')}:</span>
      <select
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        value={i18n.language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
};
