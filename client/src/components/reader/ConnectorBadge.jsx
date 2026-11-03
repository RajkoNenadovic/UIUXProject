import { useTranslation } from 'react-i18next';

export function ConnectorBadge({ position, selected, status, onSelect }) {
  const { t } = useTranslation();
  return (
    <button
      className={`connector-badge connector-${status} ${selected ? 'connector-selected' : ''}`}
      type="button"
      aria-label={t('selectSentence', { position })}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {position}
    </button>
  );
}
