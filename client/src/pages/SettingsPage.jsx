import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StateView } from '../components/StateView.jsx';
import { api, errorMessage, isOfflineError } from '../lib/api.js';
import { applyPreferences } from '../lib/preferences.js';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/useFetch.js';
import { usePageTitle } from '../lib/usePageTitle.js';
import i18n, { supportedLocales } from '../i18n/index.js';

const LOCALE_KEY = 'plain-language-locale';
const LOCALE_LABELS = { en: 'languageEnglish', es: 'languageSpanish', hr: 'languageCroatian' };

// Changes apply immediately and are saved one by one; a failed save puts the old value back.
export function SettingsPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const { data, error, loading, reload } = useFetch('/settings');
  const [settings, setSettings] = useState(null);
  const [levelDraft, setLevelDraft] = useState(6);
  const [status, setStatus] = useState({ kind: 'ok', text: '' });

  usePageTitle(t('settings.title'));

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
      setLevelDraft(data.settings.reading_level);
    }
  }, [data]);

  // The header also has a reading-level control; when it changes the account's level, follow it.
  const accountLevel = auth.user?.reading_level;
  useEffect(() => {
    if (accountLevel === undefined) return;
    setSettings((current) => (current && current.reading_level !== accountLevel ? { ...current, reading_level: accountLevel } : current));
    setLevelDraft(accountLevel);
  }, [accountLevel]);

  async function update(patch, { revert } = {}) {
    const previous = settings;
    setSettings({ ...settings, ...patch });
    applyPreferences({ ...settings, ...patch });
    try {
      const result = await api('/settings', { method: 'PUT', body: patch });
      setSettings(result.settings);
      applyPreferences(result.settings);
      if (patch.reading_level !== undefined) auth.patchUser({ reading_level: result.settings.reading_level });
      setStatus({ kind: 'ok', text: t('settings.saved') });
    } catch (caught) {
      setSettings(previous);
      applyPreferences(previous);
      setLevelDraft(previous.reading_level);
      revert?.();
      setStatus({ kind: 'error', text: errorMessage(t, caught) });
    }
  }

  function changeLanguage(next) {
    const before = i18n.resolvedLanguage || 'en';
    void i18n.changeLanguage(next);
    try { window.localStorage.setItem(LOCALE_KEY, next); } catch { /* private mode: language still changes */ }
    void update({ locale: next }, {
      revert: () => {
        void i18n.changeLanguage(before);
        try { window.localStorage.setItem(LOCALE_KEY, before); } catch { /* ignore */ }
      }
    });
  }

  function commitLevel() {
    if (settings && levelDraft !== settings.reading_level) void update({ reading_level: levelDraft });
  }

  if (loading && !settings) {
    return <section className="page" aria-label={t('loading')}><StateView state="loading" /></section>;
  }
  if (error && !settings) {
    return (
      <section className="page" aria-labelledby="settings-error-title">
        <h1 id="settings-error-title" className="visually-hidden">{t('settings.title')}</h1>
        <StateView state={isOfflineError(error) ? 'offline' : 'error'} onRetry={reload} />
        {isOfflineError(error) ? (
          <div className="state-actions">
            <button type="button" className="button button-primary" onClick={reload}>{t('retry')}</button>
          </div>
        ) : null}
      </section>
    );
  }
  if (!settings) return null;

  const sizes = ['small', 'medium', 'large'];
  const spacings = ['compact', 'comfortable', 'relaxed'];

  return (
    <section className="page settings-page" aria-labelledby="settings-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="settings-title">{t('settings.title')}</h1>
          <p className="lede">{t('settings.intro')}</p>
        </div>
        <Link className="button button-secondary" to="/">{t('documents.backToList')}</Link>
      </div>

      <p role={status.kind === 'error' ? 'alert' : 'status'} className={status.kind === 'error' ? 'form-error' : 'notice'}>
        {status.text}
      </p>

      <fieldset>
        <legend>{t('settings.languageHeading')}</legend>
        <div className="field">
          <label htmlFor="setting-language">{t('language')}</label>
          <select id="setting-language" value={i18n.resolvedLanguage || 'en'} onChange={(event) => changeLanguage(event.target.value)}>
            {supportedLocales.map((code) => <option key={code} value={code}>{t(LOCALE_LABELS[code])}</option>)}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('settings.readingHeading')}</legend>
        <div className="field">
          <label htmlFor="setting-level">
            {t('readingLevel')}: <strong>{t('readingLevelValue', { level: levelDraft })}</strong>
          </label>
          <input
            id="setting-level"
            type="range"
            min="1"
            max="12"
            step="1"
            value={levelDraft}
            onChange={(event) => setLevelDraft(Number(event.target.value))}
            onPointerUp={commitLevel}
            onKeyUp={commitLevel}
            onBlur={commitLevel}
            aria-valuetext={t('readingLevelValue', { level: levelDraft })}
            aria-describedby="level-help"
          />
          <p id="level-help" className="hint">{t('settings.levelHelp')}</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('settings.comfortHeading')}</legend>

        <fieldset className="choice-group">
          <legend>{t('settings.fontSizeLabel')}</legend>
          <div className="choice-row">
            {sizes.map((size) => (
              <label key={size} className="choice">
                <input type="radio" name="font-size" value={size} checked={settings.font_size === size} onChange={() => update({ font_size: size })} />
                {t(`settings.sizes.${size}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>{t('settings.spacingLabel')}</legend>
          <div className="choice-row">
            {spacings.map((spacing) => (
              <label key={spacing} className="choice">
                <input type="radio" name="spacing" value={spacing} checked={settings.spacing === spacing} onChange={() => update({ spacing })} />
                {t(`settings.spacings.${spacing}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="choice-group">
          <label className="choice">
            <input
              type="checkbox"
              checked={Boolean(settings.dyslexia_friendly)}
              onChange={(event) => update({ dyslexia_friendly: event.target.checked })}
              aria-describedby="dyslexia-help"
            />
            {t('settings.dyslexiaLabel')}
          </label>
          <p id="dyslexia-help" className="hint">{t('settings.dyslexiaHelp')}</p>
        </div>
      </fieldset>

      {auth.user ? (
        <section aria-labelledby="account-title" className="account-section">
          <h2 id="account-title" className="section-title">{t('onboarding.accountHeading')}</h2>
          <dl className="account-details">
            <dt>{t('onboarding.accountName')}</dt>
            <dd>{auth.user.display_name}</dd>
            <dt>{t('onboarding.accountEmail')}</dt>
            <dd>{auth.user.email}</dd>
            <dt>{t('onboarding.accountRole')}</dt>
            <dd>{auth.user.role ? t(`onboarding.roles.${auth.user.role}.name`) : t('onboarding.accountRoleNone')}</dd>
          </dl>
          <div className="state-actions">
            <Link className="button button-secondary" to="/onboarding?edit=1">{t('onboarding.changeProfile')}</Link>
            <button type="button" className="button button-secondary" onClick={auth.logout}>{t('auth.signOut')}</button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="preview-title">
        <h2 id="preview-title" className="section-title">{t('settings.previewHeading')}</h2>
        <p className="preview">{t('settings.previewText')}</p>
      </section>
    </section>
  );
}
