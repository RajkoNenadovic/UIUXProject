import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { StateView } from '../components/StateView.jsx';

export function DocumentsPage() {
  const { t } = useTranslation();
  return (
    <section className="page documents-page" aria-labelledby="documents-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="documents-title">{t('documentList')}</h1>
          <p className="lede">{t('documentListIntro')}</p>
        </div>
        <Button variant="primary">{t('newDocument')}</Button>
      </div>
      <div className="document-list">
        <article className="document-card">
          <div>
            <p className="eyebrow">{t('routeSummary')}</p>
            <h2>{t('sampleFile')}</h2>
            <p className="muted">{t('pageCount', { count: 14 })}</p>
          </div>
          <Link className="button button-secondary" to="/documents/1/summary">{t('open')}</Link>
        </article>
      </div>
      <div className="empty-preview"><StateView state="empty" /></div>
    </section>
  );
}
