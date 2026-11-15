import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Page titles are translated like every other string and update when the language changes.
export function usePageTitle(title) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = title ? `${title} · ${t('appName')}` : t('appName');
  }, [title, t]);
}
