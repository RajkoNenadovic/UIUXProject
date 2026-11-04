import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supportedLocales } from '../i18n/index.js';
import { usePrototype } from '../hooks/usePrototype.jsx';

const languageLabels = { en: 'languageEnglish', es: 'languageSpanish', hr: 'languageCroatian' };

export function Header() {
  const { t, i18n } = useTranslation();
  const { readingLevel, setReadingLevel, documentTitle } = usePrototype();
  const changeLanguage = async (event) => {
    const locale = event.target.value;
    await i18n.changeLanguage(locale);
    window.localStorage.setItem('plain-language-locale', locale);
  };

  return (
    <header className="app-header">
      <Link className="brand" to="/" aria-label={t('logoLabel')}>
        <span className="brand-mark" aria-hidden="true">PL</span>
        <span className="brand-name">{t('appName')}</span>
      </Link>
      <div className="document-meta" aria-label={documentTitle}>
        <span className="meta-divider" aria-hidden="true" />
        <span>{documentTitle}</span>
      </div>
      <div className="header-controls">
        <label className="select-label">
          <span>{t('readingLevel')}</span>
          <select value={readingLevel} onChange={(event) => setReadingLevel(Number(event.target.value))} aria-label={t('readingLevel')}>
            <option value="6">{t('readingLevelValue', { level: 6 })}</option>
            <option value="8">{t('readingLevelValue', { level: 8 })}</option>
            <option value="10">{t('readingLevelValue', { level: 10 })}</option>
          </select>
        </label>
        <label className="select-label language-select">
          <span>{t('language')}</span>
          <select value={i18n.language} onChange={changeLanguage} aria-label={t('language')}>
            {supportedLocales.map((locale) => <option key={locale} value={locale}>{t(languageLabels[locale])}</option>)}
          </select>
        </label>
      </div>
    </header>
  );
}
