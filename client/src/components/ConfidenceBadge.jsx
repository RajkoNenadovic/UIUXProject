import { useTranslation } from 'react-i18next';
import { Badge } from './Badge.jsx';

export function ConfidenceBadge({ confidence, status = 'match' }) {
  const { t } = useTranslation();
  const percentage = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(confidence);
  return <Badge variant={status}>{t('confidence', { value: percentage.replace('%', '') })}</Badge>;
}
