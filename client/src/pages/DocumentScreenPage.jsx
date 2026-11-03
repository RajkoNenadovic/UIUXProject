import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { ConfidenceBadge } from '../components/ConfidenceBadge.jsx';

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

  return (
    <section className="page screen-page" aria-labelledby="screen-title">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">{t('sampleFile')}</p>
          <h1 id="screen-title">{t(screenKey)}</h1>
        </div>
        <div className="status-row"><Badge variant="match" /><ConfidenceBadge confidence={0.94} /></div>
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
