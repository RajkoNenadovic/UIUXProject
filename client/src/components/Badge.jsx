import { useTranslation } from 'react-i18next';

const badgeKeys = {
  match: 'statusMatch',
  uncertain: 'statusUncertain',
  info: 'statusInfo'
};

export function Badge({ variant = 'info', children }) {
  const { t } = useTranslation();
  return (
    <span className={`badge badge-${variant}`}>
      <span aria-hidden="true" className="badge-marker" />
      {children || t(badgeKeys[variant])}
    </span>
  );
}
