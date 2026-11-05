import { useTranslation } from 'react-i18next';
import { ConfidenceBadge } from './ConfidenceBadge.jsx';

export function PlainCard({ sentence, selected, onSelect, onVerify, onAsk, readingLevel }) {
  const { t } = useTranslation();
  const isUncertain = sentence.status === 'uncertain';
  return (
    <article className={`plain-card ${isUncertain ? 'plain-card-uncertain' : ''} ${selected ? 'plain-card-selected' : ''}`}>
      <button className="plain-card-button" type="button" onClick={onSelect} aria-pressed={selected}>
        <span className="plain-text">{sentence.plainTextByLevel?.[readingLevel] || sentence.plainText}</span>
        {isUncertain && (
          <span className="uncertainty-note">
            <strong>{t('uncertainInOriginal')}</strong> {sentence.uncertainReason}
          </span>
        )}
      </button>
      <div className="plain-card-meta"><button className="confidence-button" type="button" onClick={onVerify}><ConfidenceBadge confidence={sentence.confidence} status={sentence.status} /></button><button className="plain-card-link" type="button" onClick={onAsk}>{t(isUncertain ? 'askProfessional' : 'traceToSource')}</button></div>
    </article>
  );
}
