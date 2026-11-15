import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const FIELD_FOR_CODE = {
  EMAIL_REQUIRED: 'email', EMAIL_INVALID: 'email', EMAIL_TAKEN: 'email',
  NAME_REQUIRED: 'name', NAME_TOO_LONG: 'name',
  PASSWORD_REQUIRED: 'password', PASSWORD_TOO_SHORT: 'password', PASSWORD_TOO_LONG: 'password'
};

// Screen 01. One component for "Sign in" (/login) and "Create account" (/register):
// the D1 wireframe puts both on the same screen, so they share the layout and the form.
export function LoginPage({ mode = 'login' }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  const registering = mode === 'register';

  const [values, setValues] = useState({ name: '', email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [busy, setBusy] = useState(false);

  const headingRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const fieldRefs = { name: nameRef, email: emailRef, password: passwordRef };

  usePageTitle(registering ? t('auth.registerTitle') : t('auth.signInTitle'));

  // Moving between "Sign in" and "Create account" is a new page for a screen reader: start at its heading.
  useEffect(() => { headingRef.current?.focus(); }, []);

  if (auth.status === 'signedIn') {
    const from = location.state?.from?.pathname;
    return <Navigate to={auth.user.onboarded ? (from || '/') : '/onboarding'} replace />;
  }

  const setValue = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  function validate() {
    const found = {};
    const email = values.email.trim();
    if (registering && !values.name.trim()) found.name = 'NAME_REQUIRED';
    else if (registering && values.name.trim().length > 60) found.name = 'NAME_TOO_LONG';
    if (!email) found.email = 'EMAIL_REQUIRED';
    else if (!EMAIL_PATTERN.test(email)) found.email = 'EMAIL_INVALID';
    if (!values.password) found.password = 'PASSWORD_REQUIRED';
    else if (registering && values.password.length < 8) found.password = 'PASSWORD_TOO_SHORT';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    setFormError(null);
    const first = ['name', 'email', 'password'].find((field) => found[field]);
    if (first) {
      fieldRefs[first].current?.focus();
      return;
    }
    setBusy(true);
    auth.clearNotice();
    try {
      const payload = { email: values.email.trim(), password: values.password, remember: values.remember };
      if (registering) await auth.register({ ...payload, display_name: values.name.trim() });
      else await auth.login(payload);
      // Success: the auth state changes and the <Navigate> above takes the person on.
    } catch (caught) {
      const field = FIELD_FOR_CODE[caught?.code];
      if (field) {
        setErrors({ [field]: caught.code });
        fieldRefs[field].current?.focus();
      } else {
        setFormError(errorMessage(t, caught));
        if (caught?.code === 'INVALID_CREDENTIALS') {
          setValues((current) => ({ ...current, password: '' }));
          passwordRef.current?.focus();
        }
      }
      setBusy(false);
    }
  }

  const describedBy = (field, extra) => [errors[field] ? `${field}-error` : null, extra].filter(Boolean).join(' ') || undefined;
  const notice = auth.notice === 'signedOut' ? t('auth.signedOut') : auth.notice === 'expired' ? t('auth.sessionEnded') : '';

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <span className="auth-logo" aria-hidden="true">PL</span>
      <h1 id="auth-title" ref={headingRef} tabIndex={-1}>{registering ? t('auth.registerTitle') : t('auth.signInTitle')}</h1>
      <p className="lede">{t('auth.tagline')}</p>

      <p role="status" className={notice ? 'notice auth-notice' : 'visually-hidden'}>{notice}</p>

      <form onSubmit={handleSubmit} noValidate aria-describedby={formError ? 'auth-form-error' : undefined}>
        {registering ? (
          <div className="field">
            <label htmlFor="auth-name">{t('auth.name')}</label>
            <input
              id="auth-name" ref={nameRef} type="text" autoComplete="name" value={values.name} onChange={setValue('name')}
              aria-invalid={errors.name ? 'true' : undefined} aria-describedby={describedBy('name')}
            />
            {errors.name ? <p id="name-error" className="form-error">{errorMessage(t, { code: errors.name })}</p> : null}
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="auth-email">{t('auth.email')}</label>
          <input
            id="auth-email" ref={emailRef} type="email" inputMode="email" spellCheck={false}
            autoComplete={registering ? 'email' : 'username'} value={values.email} onChange={setValue('email')}
            aria-invalid={errors.email ? 'true' : undefined} aria-describedby={describedBy('email')}
          />
          {errors.email ? <p id="email-error" className="form-error">{errorMessage(t, { code: errors.email })}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="auth-password">{t('auth.password')}</label>
          <input
            id="auth-password" ref={passwordRef} type={showPassword ? 'text' : 'password'}
            autoComplete={registering ? 'new-password' : 'current-password'} value={values.password} onChange={setValue('password')}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={describedBy('password', registering ? 'password-hint' : null)}
          />
          {registering ? <p id="password-hint" className="hint">{t('auth.passwordHint')}</p> : null}
          {errors.password ? <p id="password-error" className="form-error">{errorMessage(t, { code: errors.password })}</p> : null}
          <label className="choice auth-inline-choice">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            {t('auth.showPassword')}
          </label>
        </div>

        <div className="auth-row">
          <label className="choice">
            <input type="checkbox" checked={values.remember} onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))} />
            {t('auth.keepSignedIn')}
          </label>
          {!registering ? (
            <button
              type="button" className="link-button" aria-expanded={showForgot} aria-controls="forgot-info"
              onClick={() => setShowForgot((open) => !open)}
            >
              {t('auth.forgot')}
            </button>
          ) : null}
        </div>
        {!registering ? <p id="forgot-info" className="hint auth-forgot" hidden={!showForgot}>{t('auth.forgotInfo')}</p> : null}

        <p id="auth-form-error" role="alert" className="form-error">{formError}</p>

        <button type="submit" className="button button-primary auth-submit" disabled={busy}>
          {registering ? (busy ? t('auth.creating') : t('auth.createAccount')) : (busy ? t('auth.signingIn') : t('auth.signIn'))}
        </button>
      </form>

      <p className="auth-divider"><span>{t('auth.or')}</span></p>

      <div className="auth-sso">
        <button type="button" className="button button-secondary" disabled aria-describedby="sso-note">
          {t('auth.google')} <span className="soon">{t('auth.comingSoon')}</span>
        </button>
        <button type="button" className="button button-secondary" disabled aria-describedby="sso-note">
          {t('auth.sso')} <span className="soon">{t('auth.comingSoon')}</span>
        </button>
        <p id="sso-note" className="hint">{t('auth.ssoNote')}</p>
      </div>

      <p className="auth-switch">
        {registering ? t('auth.haveAccount') : t('auth.newHere')}{' '}
        <Link to={registering ? '/login' : '/register'} state={location.state}>
          {registering ? t('auth.signIn') : t('auth.createAccount')}
        </Link>
      </p>
    </section>
  );
}
