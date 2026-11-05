import { useTranslation } from 'react-i18next';

export function Toast({ message, onClose }) {
  const { t } = useTranslation();
  if (!message) return null;
  return <div className="toast" role="status" aria-live="polite" aria-label={t('toastLabel')}><span>{message}</span><button type="button" onClick={onClose} aria-label={t('close')}>×</button></div>;
}
