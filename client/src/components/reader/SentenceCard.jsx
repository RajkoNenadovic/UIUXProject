import { useTranslation } from 'react-i18next';

export function SentenceCard({ sentence, selected, onSelect, onOpenJargon }) {
  const { t } = useTranslation();
  return (
    <article className={`sentence-card ${selected ? 'sentence-selected' : ''}`}>
      <button className="sentence-card-button" type="button" onClick={onSelect} aria-pressed={selected}>
        <span className="sentence-reference">{t('sentenceReference', { section: sentence.sectionRef, sentence: t('sentenceLabel', { position: sentence.position }) })}</span>
        <span className="sentence-text">{sentence.originalText}</span>
      </button>
      {sentence.jargonTerms?.length > 0 && <div className="jargon-links" aria-label={t('jargonTermsInSentence')}>{sentence.jargonTerms.map((term) => <button className="jargon-link" key={term.key} type="button" onClick={() => onOpenJargon(term.key)}>{term.label}</button>)}</div>}
    </article>
  );
}
