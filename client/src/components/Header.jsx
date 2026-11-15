import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';
import { Toast } from './Toast.jsx';
import { UserMenu } from './UserMenu.jsx';

const LEVELS = Array.from({ length: 12 }, (_, index) => index + 1);

export function Header() {
  const { t } = useTranslation();
  const { user, patchUser } = useAuth();
  const [message, setMessage] = useState('');

  // The reading level shown here is the signed-in person's own setting (the same one as in Settings).
  async function changeLevel(event) {
    const level = Number(event.target.value);
    setMessage('');
    try {
      const result = await api('/settings', { method: 'PUT', body: { reading_level: level } });
      patchUser({ reading_level: result.settings.reading_level });
    } catch (caught) {
      setMessage(errorMessage(t, caught)); // the select is controlled, so it snaps back to the saved level
    }
  }

  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">PL</span>
        <span className="brand-name">{t('appName')}</span>
      </Link>
      <div className="document-meta" aria-label={t('sampleFile')}>
        <span className="meta-divider" aria-hidden="true" />
        <span>{t('sampleFile')}</span>
      </div>
      <div className="header-controls">
        <label className="select-label">
          <span>{t('readingLevel')}</span>
          <select value={user?.reading_level ?? 6} onChange={changeLevel} aria-label={t('readingLevel')}>
            {LEVELS.map((level) => <option key={level} value={level}>{t('readingLevelValue', { level })}</option>)}
          </select>
        </label>
        <LanguageSwitcher />
        <UserMenu />
      </div>
      <Toast message={message} />
    </header>
  );
}
