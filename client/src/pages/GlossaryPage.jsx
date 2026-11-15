import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { StateView } from '../components/StateView.jsx';
import { api, errorMessage, isOfflineError } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { usePageTitle } from '../lib/usePageTitle.js';

// Dictionary lookup (external API, English only) plus the saved glossary (database).
export function GlossaryPage() {
  const { t } = useTranslation();
  const saved = useFetch('/terms');
  const [term, setTerm] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [lookup, setLookup] = useState({ state: 'idle' }); // idle | loading | done | error
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const controllerRef = useRef(null);

  usePageTitle(t('glossary.title'));

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Move focus to the result so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (lookup.state === 'done' || lookup.state === 'error') resultRef.current?.focus();
  }, [lookup]);

  async function handleLookup(event) {
    event.preventDefault();
    const clean = term.trim();
    setMessage('');
    if (clean.length < 2) {
      setFieldError('INVALID_TERM');
      inputRef.current?.focus();
      return;
    }
    setFieldError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLookup({ state: 'loading' });
    try {
      const result = await api(`/terms/define?term=${encodeURIComponent(clean)}`, { signal: controller.signal });
      setLookup({ state: 'done', result });
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (error.code === 'INVALID_TERM') {
        setFieldError('INVALID_TERM');
        setLookup({ state: 'idle' });
        inputRef.current?.focus();
        return;
      }
      setLookup({ state: 'error', error });
    }
  }

  async function handleSave() {
    const { result } = lookup;
    const first = result.result.meanings[0].definitions[0];
    setSaving(true);
    setMessage('');
    try {
      await api('/terms', {
        method: 'POST',
        body: { term: result.term, definition: first.definition, example_in_context: first.example }
      });
      setMessage(t('glossary.savedMessage', { term: result.term }));
      saved.reload();
    } catch (error) {
      setMessage(error.code === 'TERM_EXISTS' ? t('glossary.alreadySaved') : errorMessage(t, error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    setRemoveError(null);
    try {
      await api(`/terms/${pendingRemove.id}`, { method: 'DELETE' });
    } catch (error) {
      if (error.code !== 'NOT_FOUND') {
        setRemoveError(errorMessage(t, error));
        return;
      }
    }
    setMessage(t('glossary.removedMessage', { term: pendingRemove.term }));
    setPendingRemove(null);
    saved.reload();
    inputRef.current?.focus();
  }

  const terms = saved.data?.terms ?? [];
  const result = lookup.state === 'done' ? lookup.result : null;

  return (
    <section className="page glossary-page" aria-labelledby="glossary-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="glossary-title">{t('glossary.title')}</h1>
          <p className="lede">{t('glossary.intro')}</p>
        </div>
        <Link className="button button-secondary" to="/">{t('documents.backToList')}</Link>
      </div>

      <form className="lookup-form" onSubmit={handleLookup} noValidate>
        <div className="field">
          <label htmlFor="term-input">{t('glossary.searchLabel')}</label>
          <input
            id="term-input"
            ref={inputRef}
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            lang="en"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'term-error term-hint' : 'term-hint'}
          />
          <p id="term-hint" className="hint">{t('glossary.searchHint')}</p>
          {fieldError ? <p id="term-error" className="form-error">{t(`errors.${fieldError}`)}</p> : null}
        </div>
        <button type="submit" className="button button-primary" disabled={lookup.state === 'loading'}>
          {lookup.state === 'loading' ? t('glossary.looking') : t('glossary.lookUp')}
        </button>
      </form>

      <p role="status" className="notice">{lookup.state === 'loading' ? t('glossary.looking') : message}</p>

      <div aria-live="polite">
        {lookup.state === 'error' ? (
          <div className="result-card" ref={resultRef} tabIndex={-1}>
            <StateView state={isOfflineError(lookup.error) ? 'offline' : 'error'} onRetry={handleLookup} />
            <p className="form-error">{errorMessage(t, lookup.error)}</p>
            {isOfflineError(lookup.error) ? (
              <div className="state-actions">
                <button type="button" className="button button-primary" onClick={handleLookup}>{t('retry')}</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {result && result.status === 'not_found' ? (
          <div className="result-card" ref={resultRef} tabIndex={-1}>
            <h2>{t('glossary.notFoundTitle', { term: result.term })}</h2>
            <p>{t('glossary.notFoundDetail')}</p>
          </div>
        ) : null}

        {result && result.status === 'success' ? (
          <article className="result-card" aria-labelledby="result-term">
            <h2 id="result-term" ref={resultRef} tabIndex={-1} lang="en">
              {result.result.word || result.term}
              {result.result.phonetic ? <span className="phonetic"> {result.result.phonetic}</span> : null}
            </h2>
            {result.stale ? <p className="hint">{t('glossary.staleNote')}</p> : null}
            <div lang="en">
              {result.result.meanings.map((meaning) => (
                <section key={meaning.partOfSpeech} className="meaning">
                  <h3>{meaning.partOfSpeech}</h3>
                  <ol>
                    {meaning.definitions.map((item) => (
                      <li key={item.definition}>
                        {item.definition}
                        {item.example ? <span className="example"> {t('glossary.example')} “{item.example}”</span> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
            <p className="hint">
              {t('glossary.source', { name: result.result.source.name })}
              {result.result.source.url ? <> · <a href={result.result.source.url} target="_blank" rel="noreferrer">{t('glossary.openSource')}</a></> : null}
              {result.result.source.license ? <> · {t('glossary.license', { license: result.result.source.license })}</> : null}
            </p>
            <div className="state-actions">
              <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
                {saving ? t('glossary.saving') : t('glossary.save')}
              </button>
            </div>
          </article>
        ) : null}
      </div>

      <h2 className="section-title">{t('glossary.savedHeading')}</h2>
      {saved.loading && !saved.data ? <StateView state="loading" /> : null}
      {saved.error && !saved.data ? (
        <>
          <StateView state={isOfflineError(saved.error) ? 'offline' : 'error'} onRetry={saved.reload} />
          {isOfflineError(saved.error) ? (
            <div className="state-actions">
              <button type="button" className="button button-primary" onClick={saved.reload}>{t('retry')}</button>
            </div>
          ) : null}
        </>
      ) : null}
      {saved.data && terms.length === 0 ? (
        <div className="empty-state">
          <h3>{t('glossary.savedEmpty')}</h3>
          <p>{t('glossary.savedEmptyDetail')}</p>
        </div>
      ) : null}
      {terms.length > 0 ? (
        <>
          <p className="hint">{t('glossary.savedCount', { count: terms.length })}</p>
          <ul className="term-list">
            {terms.map((item) => (
              <li key={item.id} className="term-item">
                <div lang="en">
                  <h3>{item.term}</h3>
                  <p>{item.definition}</p>
                  {item.example_in_context ? <p className="example">{t('glossary.example')} “{item.example_in_context}”</p> : null}
                  {item.source_title ? <p className="hint">{t('glossary.fromDocument', { title: item.source_title })}</p> : null}
                </div>
                <button
                  type="button"
                  className="button button-danger-outline"
                  onClick={() => { setRemoveError(null); setPendingRemove(item); }}
                  aria-label={t('glossary.removeLabel', { term: item.term })}
                >
                  {t('glossary.remove')}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={t('glossary.removeTitle')}
        message={pendingRemove ? t('glossary.removeMessage', { term: pendingRemove.term }) : ''}
        confirmLabel={t('glossary.remove')}
        error={removeError}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </section>
  );
}
