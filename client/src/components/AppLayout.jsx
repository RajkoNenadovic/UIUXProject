import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { useTranslation } from 'react-i18next';

export function AppLayout() {
  const { t } = useTranslation();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <Header />
      <main id="main-content" className="main-content"><Outlet /></main>
    </div>
  );
}
