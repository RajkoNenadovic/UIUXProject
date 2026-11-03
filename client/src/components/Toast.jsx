import { useTranslation } from 'react-i18next';

export function Toast({ message }) {
  const { t } = useTranslation();
  if (!message) return null;
  return <div className="toast" role="status" aria-live="polite" aria-label={t('toastLabel')}>{message}</div>;
}
