import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, setUnauthorizedHandler } from './api.js';
import { applyPreferences } from './preferences.js';

const AuthContext = createContext(null);
const LOCALE_KEY = 'plain-language-locale';

// status: 'loading'   -> asking the server who is signed in
//         'signedIn'  -> user is set
//         'signedOut' -> nobody is signed in (notice says why: 'signedOut' | 'expired' | null)
//         'error'     -> the server could not be reached, so we do NOT pretend the person is signed out
export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [state, setState] = useState({ status: 'loading', user: null, error: null, notice: null });

  const check = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const data = await api('/auth/me');
      setState({ status: data.user ? 'signedIn' : 'signedOut', user: data.user ?? null, error: null, notice: null });
    } catch (error) {
      // Could not even ask: do not pretend the person is signed out.
      setState({ status: 'error', user: null, error, notice: null });
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  // A request answered with 401 later on means the session ended in the background.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      applyPreferences({});
      setState((current) => (current.status === 'signedIn' ? { status: 'signedOut', user: null, error: null, notice: 'expired' } : current));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Each person keeps their own language and reading-comfort settings: load them after sign-in.
  const userId = state.user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api('/settings').then((data) => {
      if (cancelled || !data?.settings) return;
      applyPreferences(data.settings);
      const locale = data.settings.locale;
      if (locale && locale !== i18n.resolvedLanguage) {
        void i18n.changeLanguage(locale);
        try { window.localStorage.setItem(LOCALE_KEY, locale); } catch { /* private mode: language still changes */ }
      }
    }).catch(() => { /* the app still works with default comfort settings */ });
    return () => { cancelled = true; };
  }, [userId, i18n]);

  const signedIn = useCallback((user) => {
    setState({ status: 'signedIn', user, error: null, notice: null });
    return user;
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password, remember: Boolean(remember) } });
    return signedIn(data.user);
  }, [signedIn]);

  const register = useCallback(async ({ display_name, email, password, remember }) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { display_name, email, password, remember: Boolean(remember), locale: i18n.resolvedLanguage || 'en' }
    });
    return signedIn(data.user);
  }, [signedIn, i18n]);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* the cookie is cleared by the server; if it could not be reached the session simply expires */ }
    applyPreferences({});
    setState({ status: 'signedOut', user: null, error: null, notice: 'signedOut' });
  }, []);

  const saveProfile = useCallback(async ({ role, reading_level }) => {
    const data = await api('/auth/profile', { method: 'PUT', body: { role, reading_level } });
    setState((current) => ({ ...current, user: data.user }));
    return data.user;
  }, []);

  // Keeps the copy of the user in step when another screen changes something shown from it.
  const patchUser = useCallback((patch) => {
    setState((current) => (current.user ? { ...current, user: { ...current.user, ...patch } } : current));
  }, []);

  const clearNotice = useCallback(() => setState((current) => (current.notice ? { ...current, notice: null } : current)), []);

  const value = useMemo(
    () => ({ ...state, check, login, register, logout, saveProfile, patchUser, clearNotice }),
    [state, check, login, register, logout, saveProfile, patchUser, clearNotice]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
