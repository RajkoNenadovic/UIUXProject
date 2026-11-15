import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth.jsx';

// Who is signed in, and the way out. Lives in the header on every screen.
export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="user-menu" role="group" aria-label={t('auth.signedInAs', { name: user.display_name })}>
      <span className="user-name">{user.display_name}</span>
      <button type="button" className="button button-secondary" onClick={logout}>{t('auth.signOut')}</button>
    </div>
  );
}
