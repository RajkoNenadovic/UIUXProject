import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';

export const ROLES = ['student', 'adult', 'professional'];
// A role only suggests a starting point; the slider is always the person's own choice.
export const SUGGESTED_LEVEL = { student: 8, adult: 6, professional: 10 };
const TOTAL_STEPS = 2;

// Screen 02. Step 1: who is reading. Step 2: how complex the plain version should be.
// The same screen is reused from Settings (?edit=1), which answers the D1 question
// "should this screen be triggered only once?": it is shown once after sign-up and can be reopened.
export function OnboardingPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = params.get('edit') === '1' && Boolean(auth.user?.onboarded);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(auth.user?.role ?? '');
  const [level, setLevel] = useState(auth.user?.reading_level ?? 6);
  const [levelChosen, setLevelChosen] = useState(editing); // true once the person has set the slider themselves
  const [roleError, setRoleError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const stepRef = useRef(null);
  const firstRoleRef = useRef(null);
  const mounted = useRef(false);

  usePageTitle(editing ? t('onboarding.editTitle') : t('onboarding.title'));

  // After "Next" / "Back", move focus to the step label so screen readers announce "Step 2 of 2".
  useEffect(() => {
    if (mounted.current) stepRef.current?.focus();
    mounted.current = true;
  }, [step]);

  // Someone who already finished this screen has nothing to do here unless they opened it from Settings.
  if (auth.user?.onboarded && !editing) return <Navigate to="/" replace />;

  function chooseRole(next) {
    setRole(next);
    setRoleError(null);
    if (!levelChosen) setLevel(SUGGESTED_LEVEL[next]);
  }

  function handleNext(event) {
    event.preventDefault();
    if (!ROLES.includes(role)) {
      setRoleError('ROLE_REQUIRED');
      firstRoleRef.current?.focus();
      return;
    }
    setStep(2);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await auth.saveProfile({ role, reading_level: level });
      if (editing) navigate('/settings', { replace: true });
      // First time through: the user is now onboarded, so the redirect above takes them to the app.
    } catch (caught) {
      setFormError(errorMessage(t, caught));
      setBusy(false);
    }
  }

  const roleName = ROLES.includes(role) ? t(`onboarding.roles.${role}.name`) : '';
  const levelLabel = level <= 4 ? 'levelSimple' : level >= 9 ? 'levelDetailed' : 'levelStandard';

  return (
    <section className="auth-card onboarding" aria-labelledby="onboarding-title">
      <h1 id="onboarding-title">{editing ? t('onboarding.editTitle') : t('onboarding.title')}</h1>
      <p className="lede">{editing ? t('onboarding.editIntro') : t('onboarding.intro')}</p>

      <p className="onboarding-step" ref={stepRef} tabIndex={-1}>
        {t('onboarding.step', { current: step, total: TOTAL_STEPS })}
      </p>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} /></div>

      {step === 1 ? (
        <form onSubmit={handleNext} noValidate>
          <fieldset className="role-options" aria-describedby={roleError ? 'role-error' : undefined}>
            <legend>{t('onboarding.roleLegend')}</legend>
            {ROLES.map((option, index) => (
              <label key={option} className="role-card">
                <input
                  type="radio" name="role" value={option} checked={role === option}
                  ref={index === 0 ? firstRoleRef : undefined} onChange={() => chooseRole(option)}
                />
                <span className="role-name">{t(`onboarding.roles.${option}.name`)}</span>
                <span className="role-detail">{t(`onboarding.roles.${option}.detail`)}</span>
              </label>
            ))}
          </fieldset>
          <p id="role-error" role="alert" className="form-error">{roleError ? errorMessage(t, { code: roleError }) : ''}</p>
          <div className="auth-actions">
            {editing ? <Link className="button button-secondary" to="/settings">{t('onboarding.cancel')}</Link> : null}
            <button type="submit" className="button button-primary">{t('onboarding.next')}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSave} noValidate>
          <div className="field">
            <label htmlFor="onboarding-level">{t('onboarding.levelHeading')}</label>
            <input
              id="onboarding-level" type="range" min="1" max="12" step="1" value={level}
              onChange={(event) => { setLevel(Number(event.target.value)); setLevelChosen(true); }}
              aria-valuetext={`${t('readingLevelValue', { level })} · ${t(`onboarding.${levelLabel}`)}`}
              aria-describedby="onboarding-level-help"
            />
            <div className="slider-ends" aria-hidden="true">
              <span>{t('onboarding.levelSimple')}</span>
              <span>{t('onboarding.levelStandard')}</span>
              <span>{t('onboarding.levelDetailed')}</span>
            </div>
            <p className="level-output" aria-hidden="true">
              <strong>{t('readingLevelValue', { level })}</strong> · {t(`onboarding.${levelLabel}`)}
            </p>
            <p id="onboarding-level-help" className="hint">
              {t('onboarding.levelSuggested', { level: SUGGESTED_LEVEL[role], role: roleName })} {t('settings.levelHelp')} {editing ? '' : t('onboarding.levelLater')}
            </p>
          </div>

          <p role="alert" className="form-error">{formError}</p>
          <div className="auth-actions">
            <button type="button" className="button button-secondary" onClick={() => setStep(1)} disabled={busy}>{t('onboarding.back')}</button>
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? t('onboarding.saving') : editing ? t('onboarding.save') : t('onboarding.getStarted')}
            </button>
          </div>
        </form>
      )}

      {!editing ? (
        <p className="auth-switch">
          {t('onboarding.notYou')}{' '}
          <button type="button" className="link-button" onClick={auth.logout}>{t('auth.signOut')}</button>
        </p>
      ) : null}
    </section>
  );
}
