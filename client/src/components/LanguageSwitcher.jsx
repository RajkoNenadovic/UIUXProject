import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { supportedLocales } from '../i18n/index.js';

const LABELS = { en: 'languageEnglish', es: 'languageSpanish', hr: 'languageCroatian' };
const LOCALE_KEY = 'plain-language-locale';

// Works signed out (sign-in screen) and signed in. Signed in, the choice is also saved on the account.
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { status } = useAuth();

  async function change(event) {
    const locale = event.target.value;
    await i18n.changeLanguage(locale);
    try { window.localStorage.setItem(LOCALE_KEY, locale); } catch { /* private mode: language still changes */ }
    if (status === 'signedIn') {
      try { await api('/settings', { method: 'PUT', body: { locale } }); } catch { /* still changed on this device */ }
    }
  }

  return (
    <label className="select-label language-select">
      <span>{t('language')}</span>
      <select value={i18n.resolvedLanguage || 'en'} onChange={change} aria-label={t('language')}>
        {supportedLocales.map((locale) => <option key={locale} value={locale}>{t(LABELS[locale])}</option>)}
      </select>
    </label>
  );
}
