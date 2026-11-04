import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function Drawer({ open, title, children, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); previousFocusRef.current?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <aside className="drawer drawer-open" aria-label={t('drawerLabel')}>
      <header className="drawer-header">
        <h2>{title}</h2>
        <button className="icon-button" ref={closeRef} type="button" onClick={onClose} aria-label={t('close')}>×</button>
      </header>
      <div className="drawer-content">{children}</div>
    </aside>
  );
}
