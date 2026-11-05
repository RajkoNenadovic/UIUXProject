import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal.jsx';
import { ConfidenceBadge } from '../reader/ConfidenceBadge.jsx';

export function VerificationModal({ open, sentences, onClose, onSelectSentence }) {
  const { i18n, t } = useTranslation();
  const average = sentences.reduce((sum, sentence) => sum + sentence.confidence, 0) / sentences.length;
  const percentage = new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }).format(average);
  return <Modal open={open} title={t('verificationTitle')} onClose={onClose}>
    <div className="verification-score"><span>{t('overallMatch')}</span><strong>{percentage}</strong><p>{t('verificationScoreDetail')}</p></div>
    <div className="verification-table-wrap"><table className="verification-table"><caption>{t('evidenceTable')}</caption><thead><tr><th scope="col">{t('sentenceLabel', { position: '' }).replace(/\s+$/, '')}</th><th scope="col">{t('confidenceLabel')}</th><th scope="col">{t('sourceLabel')}</th></tr></thead><tbody>{sentences.map((sentence) => <tr key={sentence.id}><th scope="row">{sentence.sectionRef}</th><td><button className="table-confidence" type="button" onClick={() => onSelectSentence(sentence.id)}><ConfidenceBadge confidence={sentence.confidence} status={sentence.status} /></button></td><td><button className="text-button" type="button" onClick={() => onSelectSentence(sentence.id)}>{t('jumpToSource')}</button></td></tr>)}</tbody></table></div>
    <aside className="verification-note"><strong>{t('whatThisCanMiss')}</strong><p>{t('whatThisCanMissDetail')}</p></aside>
  </Modal>;
}
