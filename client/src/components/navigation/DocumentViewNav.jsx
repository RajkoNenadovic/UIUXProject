import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';

const views = ['summary', 'reader', 'focus', 'actions', 'export'];

export function DocumentViewNav() {
  const { t } = useTranslation();
  const { id } = useParams();
  const current = useLocation().pathname.split('/').pop();
  const active = ['jargon', 'verify', 'qa'].includes(current) ? 'reader' : current;

  return (
    <nav className="document-view-nav" aria-label={t('documentNavigation')}>
      {views.map((view) => (
        <Link
          key={view}
          className={active === view ? 'document-view-active' : ''}
          to={`/documents/${id}/${view}`}
          aria-current={active === view ? 'page' : undefined}
        >
          {t(`route${view[0].toUpperCase()}${view.slice(1)}`)}
        </Link>
      ))}
    </nav>
  );
}
