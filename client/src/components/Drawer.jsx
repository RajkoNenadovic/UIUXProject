import { useTranslation } from 'react-i18next';

export function Drawer({ open, title, children, onClose }) {
  const { t } = useTranslation();
  return (
    <aside className={`drawer ${open ? 'drawer-open' : ''}`} aria-hidden={!open} aria-label={t('drawerLabel')}>
      <header className="drawer-header">
        <h2>{title}</h2>
        <button className="icon-button" type="button" onClick={onClose} aria-label={t('close')}>×</button>
      </header>
      <div className="drawer-content">{children}</div>
    </aside>
  );
}
