import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';
import { useDocumentData } from '../hooks/useDocumentData.jsx';

export function FocusPage() {
  const { t } = useTranslation();
  const { readingLevel, notify } = usePrototype();
  const { document, loading, error } = useDocumentData();
  const [fontSize, setFontSize] = useState('medium');
  const [spacing, setSpacing] = useState('comfortable');
  const [background, setBackground] = useState('paper');
  const [source, setSource] = useState(null);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const readAloud = () => {
    if (!window.speechSynthesis) return notify('speechUnsupported');
    const utterance = new SpeechSynthesisUtterance(document.sentences.map((sentence) => sentence.plainTextByLevel?.[readingLevel] || sentence.plainText).join(' '));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    notify('readingAloud');
  };
  if (loading) return <p className="loading-line">{t('loadingDetail')}</p>;
  if (error || !document) return <p className="not-found">{error || t('errorDetail')}</p>;
  return <DocumentFrame title={t('focusTitle')} eyebrow={t('focusEyebrow')}>
    <div className={`focus-surface focus-font-${fontSize} focus-spacing-${spacing} focus-bg-${background}`}><div className="focus-copy"><p className="eyebrow">{t('plainLanguage')} · {t('readingLevelValue', { level: readingLevel })}</p>{document.sentences.map((sentence) => <article key={sentence.id} className="focus-sentence"><p>{sentence.plainTextByLevel?.[readingLevel] || sentence.plainText} <button className="source-chip" type="button" onClick={() => setSource(sentence)}>{t('sourceChip', { position: sentence.position })}</button></p></article>)}</div>{source && <aside className="source-peek" role="dialog" aria-label={t('sourcePeek')}><button className="icon-button" type="button" onClick={() => setSource(null)} aria-label={t('close')}>×</button><h2>{t('sourcePeek')}</h2><p>{source.originalText}</p><span className="muted">{source.sectionRef}</span></aside>}</div>
    <div className="focus-toolbar" aria-label={t('focusToolbar')}><Button onClick={() => setFontSize(fontSize === 'large' ? 'medium' : 'large')}>{t('fontSize')}</Button><Button onClick={() => setSpacing(spacing === 'wide' ? 'comfortable' : 'wide')}>{t('spacing')}</Button><Button onClick={() => setBackground(background === 'blue' ? 'paper' : 'blue')}>{t('backgroundColour')}</Button><Button onClick={readAloud}>{t('readAloud')}</Button></div>
  </DocumentFrame>;
}
