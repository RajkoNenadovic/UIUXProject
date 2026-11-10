import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';
import { QuestionSidebar } from '../components/qa/QuestionSidebar.jsx';
import { useState } from 'react';

export function SummaryPage() {
  const { t } = useTranslation();
  const { readingLevel } = usePrototype();
  const [qaOpen, setQaOpen] = useState(false);
  return <DocumentFrame title={t('summaryTitle')} eyebrow={t('summaryEyebrow')} actions={<Badge variant="match">{t('readyToRead')}</Badge>}>
    <article className="summary-card">
      <div className="summary-card-top"><span className="summary-label">{t('tldrLabel')}</span><span className="summary-pages">{t('pageCount', { count: 14 })}</span></div>
      <h2>{t('summaryHeadline')}</h2>
      <p className="summary-lede">{t('summaryIntro', { level: readingLevel })}</p>
      <div className="summary-columns"><section><h3>{t('summaryKeyPoints')}</h3><ul><li>{t('summaryPointRent')}</li><li>{t('summaryPointRenewal')}</li><li>{t('summaryPointEntry')}</li></ul></section><section className="summary-warning"><h3>{t('summaryWatchOut')}</h3><p>{t('summaryUncertain')}</p><Badge variant="uncertain">{t('uncertain')}</Badge></section></div>
      <div className="summary-actions"><Link className="button button-primary" to="/documents/1/reader">{t('readSideBySide')}</Link><Link className="button button-secondary" to="/documents/1/focus">{t('focusMode')}</Link><Link className="button button-secondary" to="/documents/1/actions">{t('actionItems')}</Link><Link className="button button-secondary" to="/documents/1/export">{t('exportDocument')}</Link><Button variant="secondary" onClick={() => setQaOpen(true)}>{t('askQuestion')}</Button></div>
    </article>
    <QuestionSidebar open={qaOpen} onClose={() => setQaOpen(false)} />
  </DocumentFrame>;
}
