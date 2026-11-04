import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { useTranslation } from 'react-i18next';
import { Toast } from './Toast.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';

export function AppLayout() {
  const { t } = useTranslation();
  const { toast, setToast } = usePrototype();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <Header />
      <main id="main-content" className="main-content"><Outlet /></main>
      <Toast message={toast ? t(toast) : ''} onClose={() => setToast('')} />
    </div>
  );
}
