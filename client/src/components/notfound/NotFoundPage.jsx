import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation();
  return <section className="not-found-page"><p className="eyebrow">404</p><h1>{t('notFoundTitle')}</h1><p>{t('notFoundDetail')}</p><Link className="button button-primary" to="/">{t('backToDocuments')}</Link></section>;
}
