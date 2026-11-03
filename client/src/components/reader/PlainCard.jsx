import { useTranslation } from 'react-i18next';
import { ConfidenceBadge } from './ConfidenceBadge.jsx';

export function PlainCard({ sentence, selected, onSelect }) {
  const { t } = useTranslation();
  const isUncertain = sentence.status === 'uncertain';
  return (
    <article className={`plain-card ${isUncertain ? 'plain-card-uncertain' : ''} ${selected ? 'plain-card-selected' : ''}`}>
      <button className="plain-card-button" type="button" onClick={onSelect} aria-pressed={selected}>
        <span className="plain-text">{sentence.plainText}</span>
        {isUncertain && (
          <span className="uncertainty-note">
            <strong>{t('uncertainInOriginal')}</strong> {sentence.uncertainReason}
          </span>
        )}
        <span className="plain-card-meta">
          <ConfidenceBadge confidence={sentence.confidence} status={sentence.status} />
          <span className="plain-card-link">{t(isUncertain ? 'askProfessional' : 'traceToSource')}</span>
        </span>
      </button>
    </article>
  );
}
