import { useTranslation } from 'react-i18next';

export function ConfidenceBadge({ confidence, status }) {
  const { i18n, t } = useTranslation();
  const value = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0
  }).format(confidence);
  const labelKey = status === 'uncertain' ? 'uncertain' : 'matchesSource';

  return (
    <span className={`reader-confidence reader-confidence-${status}`}>
      {t('confidenceStatus', { status: t(labelKey), value })}
    </span>
  );
}
