import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { StateView } from '../components/StateView.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { DocumentFormDialog } from '../components/DocumentFormDialog.jsx';
import { api, errorMessage, isOfflineError } from '../lib/api.js';
import { DOC_TYPES } from '../lib/docTypes.js';
import { useFetch, useOnline } from '../lib/useFetch.js';
import { useFormat, parseUtc } from '../lib/useFormat.js';
import { usePageTitle } from '../lib/usePageTitle.js';

export function DocumentsPage() {
  const { t } = useTranslation();
  const format = useFormat();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload } = useFetch('/documents');

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [form, setForm] = useState({ open: false, doc: null, key: 0 });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteState, setDeleteState] = useState({ busy: false, error: null });
  const [notice, setNotice] = useState('');
  const headingRef = useRef(null);
  const focusHeadingAfterLoad = useRef(false);

  usePageTitle(t('documentList'));

  const openForm = (doc) => setForm((current) => ({ open: true, doc, key: current.key + 1 }));
  const closeForm = () => setForm((current) => ({ ...current, open: false }));

  // "/?new=1" opens the add-document dialog (used by the "document not found" screen).
  useEffect(() => {
    if (params.get('new') === '1') {
      openForm(null);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // After a delete the focused button disappears; move focus to the page heading instead.
  useEffect(() => {
    if (focusHeadingAfterLoad.current && data) {
      focusHeadingAfterLoad.current = false;
      headingRef.current?.focus();
    }
  }, [data]);

  const documents = data?.documents ?? [];
  const visible = useMemo(() => {
    const needle = format.fold(query.trim());
    const filtered = documents.filter((doc) => (
      (typeFilter === 'all' || doc.doc_type === typeFilter)
      && (!needle || format.fold(doc.title).includes(needle))
    ));
    return sort === 'title' ? [...filtered].sort((a, b) => format.compare(a.title, b.title)) : filtered;
  }, [documents, query, typeFilter, sort, format]);

  function handleSaved(document, mode) {
    closeForm();
    setNotice(t(mode === 'create' ? 'documents.added' : 'documents.saved'));
    reload();
  }

  async function confirmDelete() {
    setDeleteState({ busy: true, error: null });
    try {
      await api(`/documents/${pendingDelete.id}`, { method: 'DELETE' });
    } catch (caught) {
      if (caught.code !== 'NOT_FOUND') {
        setDeleteState({ busy: false, error: errorMessage(t, caught) });
        return;
      }
      // Already deleted elsewhere: the goal is reached, carry on.
    }
    setDeleteState({ busy: false, error: null });
    setPendingDelete(null);
    setNotice(t('documents.removed'));
    focusHeadingAfterLoad.current = true;
    reload();
  }

  function askDelete(doc) {
    setDeleteState({ busy: false, error: null });
    setPendingDelete(doc);
  }

  function resetFilters() {
    setQuery('');
    setTypeFilter('all');
  }

  const showLoading = loading && !data;
  const showError = Boolean(error) && !data;
  const showEmpty = Boolean(data) && documents.length === 0;
  const showList = documents.length > 0;

  return (
    <section className="page documents-page" aria-labelledby="documents-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="documents-title" ref={headingRef} tabIndex={-1}>{t('documentList')}</h1>
          <p className="lede">{t('documentListIntro')}</p>
        </div>
        <button type="button" className="button button-primary" onClick={() => openForm(null)}>
          {t('newDocument')}
        </button>
      </div>

      <nav className="quick-links" aria-label={t('nav.quickLinks')}>
        <Link to="/glossary">{t('nav.glossary')}</Link>
        <Link to="/settings">{t('nav.settings')}</Link>
        <Link to="/help">{t('nav.help')}</Link>
      </nav>

      <p role="status" className="notice">{notice}</p>

      {showLoading ? <StateView state="loading" /> : null}

      {showError ? (
        <>
          <StateView state={isOfflineError(error) || !online ? 'offline' : 'error'} onRetry={reload} />
          {isOfflineError(error) || !online ? (
            <div className="state-actions">
              <button type="button" className="button button-primary" onClick={reload}>{t('retry')}</button>
            </div>
          ) : null}
        </>
      ) : null}

      {showEmpty ? (
        <>
          <StateView state="empty" />
          <div className="state-actions">
            <button type="button" className="button button-primary" onClick={() => openForm(null)}>
              {t('newDocument')}
            </button>
          </div>
        </>
      ) : null}

      {showList ? (
        <>
          <form className="toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="doc-search">{t('documents.searchLabel')}</label>
              <input id="doc-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="doc-filter">{t('documents.typeFilter')}</label>
              <select id="doc-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">{t('documents.allTypes')}</option>
                {DOC_TYPES.map((type) => <option key={type} value={type}>{t(`documents.types.${type}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="doc-sort">{t('documents.sortLabel')}</label>
              <select id="doc-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">{t('documents.sortNewest')}</option>
                <option value="title">{t('documents.sortTitle')}</option>
              </select>
            </div>
          </form>

          <p role="status" className="hint">{t('documents.resultsCount', { count: visible.length })}</p>

          {visible.length === 0 ? (
            <div className="empty-state">
              <h2>{t('documents.noResults')}</h2>
              <p>{t('documents.noResultsDetail')}</p>
              <div className="state-actions">
                <button type="button" className="button button-secondary" onClick={resetFilters}>{t('documents.resetFilters')}</button>
                <button type="button" className="button button-primary" onClick={() => openForm(null)}>{t('newDocument')}</button>
              </div>
            </div>
          ) : (
            <ul className="document-list">
              {visible.map((doc) => (
                <li key={doc.id}>
                  <article className="document-card">
                    <div>
                      <p className="eyebrow">{t(`documents.types.${doc.doc_type}`, { defaultValue: doc.doc_type })}</p>
                      <h2>{doc.title}</h2>
                      <ul className="meta-list">
                        <li>{t('pageCount', { count: doc.page_count })}</li>
                        {doc.sentence_count > 0 ? <li>{t('sentenceCount', { count: doc.sentence_count })}</li> : null}
                        {doc.uncertain_count > 0 ? <li className="flag">{t('documents.uncertainCount', { count: doc.uncertain_count })}</li> : null}
                        {doc.open_action_count > 0 ? <li>{t('documents.openActionCount', { count: doc.open_action_count })}</li> : null}
                        <li>
                          <time dateTime={parseUtc(doc.updated_at).toISOString()} title={`${format.longDate(doc.updated_at)}, ${format.time(doc.updated_at)}`}>
                            {t('documents.updated', { when: format.relative(doc.updated_at) })}
                          </time>
                        </li>
                      </ul>
                    </div>
                    <div className="card-actions">
                      <Link className="button button-primary" to={`/documents/${doc.id}/summary`} aria-label={t('documents.openLabel', { title: doc.title })}>
                        {t('open')}
                      </Link>
                      <button type="button" className="button button-secondary" onClick={() => openForm(doc)} aria-label={t('documents.editLabel', { title: doc.title })}>
                        {t('documents.edit')}
                      </button>
                      <button type="button" className="button button-danger-outline" onClick={() => askDelete(doc)} aria-label={t('documents.deleteLabel', { title: doc.title })}>
                        {t('documents.delete')}
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      <DocumentFormDialog key={form.key} open={form.open} doc={form.doc} onClose={closeForm} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('documents.deleteTitle')}
        message={pendingDelete ? t('documents.deleteMessage', { title: pendingDelete.title }) : ''}
        confirmLabel={deleteState.busy ? t('documents.deleting') : t('documents.deleteConfirm')}
        busy={deleteState.busy}
        error={deleteState.error}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
