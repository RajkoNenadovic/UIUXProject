import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { isOfflineError } from '../lib/api.js';
import { StateView } from './StateView.jsx';

// Route guard. Signed-out visitors go to /login (and come back to where they were afterwards);
// signed-in people who have not finished the role screen go to /onboarding first.
// The "allowIncomplete" variant is used for /onboarding itself.
export function RequireAuth({ allowIncomplete = false }) {
  const { t } = useTranslation();
  const { status, user, error, notice, check } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="auth-state"><StateView state="loading" /></div>;
  }
  if (status === 'error') {
    const offline = isOfflineError(error);
    return (
      <div className="auth-state">
        <StateView state={offline ? 'offline' : 'error'} onRetry={check} />
        {offline ? <button type="button" className="button button-primary" onClick={check}>{t('retry')}</button> : null}
      </div>
    );
  }
  if (status === 'signedOut') {
    // After a deliberate sign-out the next person should not be sent to the previous person's page.
    return <Navigate to="/login" replace state={notice === 'signedOut' ? null : { from: location }} />;
  }
  if (!allowIncomplete && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
