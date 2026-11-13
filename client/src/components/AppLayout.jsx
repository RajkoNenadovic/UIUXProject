import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header.jsx';
import { useTranslation } from 'react-i18next';
import { Toast } from './Toast.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';

export function AppLayout() {
  const { t } = useTranslation();
  const { toast, setToast, dyslexiaFriendly } = usePrototype();
  const { pathname } = useLocation();
  const isAuthRoute = pathname === '/signin' || pathname === '/onboarding';
  const isWorkspaceRoute = ['/', '/library', '/storage', '/profile', '/notifications', '/help'].includes(pathname);
  const hideGlobalHeader = isAuthRoute || isWorkspaceRoute;
  return (
    <div className={`app-shell ${dyslexiaFriendly ? 'dyslexia-friendly' : ''}`}>
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      {!hideGlobalHeader && <Header />}
      <main id="main-content" className={`main-content ${hideGlobalHeader ? 'main-content-full' : ''}`}><Outlet /></main>
      <Toast message={toast ? t(toast) : ''} onClose={() => setToast('')} />
    </div>
  );
}
