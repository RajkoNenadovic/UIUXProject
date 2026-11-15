import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { ConfidenceBadge } from '../components/ConfidenceBadge.jsx';
import { StateView } from '../components/StateView.jsx';
import { isOfflineError } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { usePageTitle } from '../lib/usePageTitle.js';

const screenKeys = {
  summary: 'screenSummary',
  reader: 'screenReader',
  focus: 'screenFocus',
  actions: 'screenActions',
  export: 'screenExport'
};

const routes = ['summary', 'reader', 'focus', 'actions', 'export'];

export function DocumentScreenPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const current = location.pathname.split('/').pop();
  const screenKey = screenKeys[current] || screenKeys.summary;
  const { data, error, loading, reload } = useFetch(`/documents/${id}`);
  const doc = data?.document;

  usePageTitle(doc ? `${doc.title} – ${t(screenKey)}` : t(screenKey));

  // Document not found (sketch 10): a dead end with two clear ways out.
  if (error?.status === 404) {
    return (
      <section className="page" aria-labelledby="not-found-title">
        <div className="empty-state">
          <h1 id="not-found-title">{t('documents.notFound')}</h1>
          <p>{t('documents.notFoundDetail')}</p>
          <div className="state-actions">
            <Link className="button button-secondary" to="/">{t('documents.backToList')}</Link>
            <Link className="button button-primary" to="/?new=1">{t('newDocument')}</Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page" aria-labelledby="load-error-title">
        <h1 id="load-error-title" className="visually-hidden">{t('error')}</h1>
        <StateView state={isOfflineError(error) ? 'offline' : 'error'} onRetry={reload} />
        {isOfflineError(error) ? (
          <div className="state-actions">
            <button type="button" className="button button-primary" onClick={reload}>{t('retry')}</button>
          </div>
        ) : null}
      </section>
    );
  }

  if (loading || !doc) {
    return (
      <section className="page" aria-label={t('loading')}>
        <StateView state="loading" />
      </section>
    );
  }

  const scored = (data.sentences ?? []).filter((sentence) => sentence.status !== 'skipped');
  const averageConfidence = scored.length
    ? scored.reduce((sum, sentence) => sum + sentence.confidence, 0) / scored.length
    : null;

  return (
    <section className="page screen-page" aria-labelledby="screen-title">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">{doc.title}</p>
          <h1 id="screen-title">{t(screenKey)}</h1>
        </div>
        {averageConfidence !== null ? (
          <div className="status-row">
            <Badge variant={doc.uncertain_count > 0 ? 'uncertain' : 'match'} />
            <ConfidenceBadge confidence={averageConfidence} />
          </div>
        ) : null}
      </div>
      <nav className="view-tabs" aria-label={t('documentNavigation')}>
        {routes.map((route) => <Link className={route === current ? 'active' : ''} key={route} to={`/documents/${id}/${route}`}>{t(`route${route[0].toUpperCase()}${route.slice(1)}`)}</Link>)}
      </nav>
      <div className="placeholder-panel">
        <p className="placeholder-number" aria-hidden="true">0{routes.indexOf(current) + 1}</p>
        <div>
          <h2>{t(screenKey)}</h2>
          <p>{t('screenPlaceholder')}</p>
          <Button variant="primary">{t('openView', { view: t(screenKey) })}</Button>
        </div>
      </div>
    </section>
  );
}
