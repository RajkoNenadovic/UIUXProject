import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';
import { QuestionSidebar } from '../components/qa/QuestionSidebar.jsx';
import { useState } from 'react';
import { useDocumentData } from '../hooks/useDocumentData.jsx';

export function SummaryPage() {
  const { t } = useTranslation();
  const { readingLevel } = usePrototype();
  const { document, loading, error } = useDocumentData();
  const [qaOpen, setQaOpen] = useState(false);
  if (loading) return <p className="loading-line">{t('loadingDetail')}</p>;
  if (error || !document) return <p className="not-found">{error || t('errorDetail')}</p>;
  const points = document.sentences.slice(0, 3);
  return <DocumentFrame title={t('summaryTitle')} eyebrow={t('summaryEyebrow')} actions={<Badge variant="match">{t('readyToRead')}</Badge>}>
    <article className="summary-card">
      <div className="summary-card-top"><span className="summary-label">{t('tldrLabel')}</span><span className="summary-pages">{t('pageCount', { count: document.pageCount })}</span></div>
      <h2>{document.id === 1 ? t('summaryHeadline') : document.title}</h2>
      <p className="summary-lede">{t('summaryIntro', { level: readingLevel })}</p>
      <div className="summary-columns"><section><h3>{t('summaryKeyPoints')}</h3><ul>{points.map((sentence) => <li key={sentence.id}>{sentence.plainText}</li>)}</ul></section><section className="summary-warning"><h3>{t('summaryWatchOut')}</h3><p>{document.id === 1 ? t('summaryUncertain') : t('summaryUploadedNotice')}</p><Badge variant="uncertain">{document.id === 1 ? t('uncertain') : t('sourceLabel')}</Badge></section></div>
      <div className="summary-actions"><Link className="button button-primary" to={`/documents/${document.id}/reader`}>{t('readSideBySide')}</Link><Link className="button button-secondary" to={`/documents/${document.id}/focus`}>{t('focusMode')}</Link><Link className="button button-secondary" to={`/documents/${document.id}/actions`}>{t('actionItems')}</Link><Link className="button button-secondary" to={`/documents/${document.id}/export`}>{t('exportDocument')}</Link><Button variant="secondary" onClick={() => setQaOpen(true)}>{t('askQuestion')}</Button></div>
    </article>
    <QuestionSidebar open={qaOpen} onClose={() => setQaOpen(false)} />
  </DocumentFrame>;
}
