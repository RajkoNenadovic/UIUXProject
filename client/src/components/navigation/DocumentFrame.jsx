import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePrototype } from '../../hooks/usePrototype.jsx';
import { DocumentViewNav } from './DocumentViewNav.jsx';

export function DocumentFrame({ title, eyebrow, children, actions }) {
  const { t } = useTranslation();
  const { documentTitle } = usePrototype();
  return <section className="document-frame page" aria-labelledby="page-title"><header className="document-frame-header"><div><p className="eyebrow">{eyebrow || documentTitle}</p><h1 id="page-title">{title}</h1></div>{actions}</header><DocumentViewNav /><div className="document-frame-body">{children}</div><Link className="back-link" to="/">← {t('backToDocuments')}</Link></section>;
}
