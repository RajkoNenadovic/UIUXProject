import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';

// Frame for the screens before the app proper (sign in, create account, role selection):
// no document navigation yet, but the skip link and the language switch are still there.
export function AuthShell() {
  const { t } = useTranslation();
  return (
    <div className="auth-shell">
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <header className="auth-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">PL</span>
          <span className="brand-name">{t('appName')}</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main id="main-content" className="auth-main"><Outlet /></main>
    </div>
  );
}
