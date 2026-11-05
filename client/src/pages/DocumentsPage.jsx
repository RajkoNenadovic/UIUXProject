import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { useState } from 'react';
import { usePrototype } from '../hooks/usePrototype.jsx';

export function DocumentsPage() {
  const { t } = useTranslation();
  const { setDocumentTitle } = usePrototype();
  const [searchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const submit = (event) => {
    event.preventDefault();
    setDocumentTitle(title.trim() || t('sampleFile'));
    window.location.href = text.trim() ? '/documents/1/summary' : '/documents/1/unreadable';
  };
  return (
    <section className="page documents-page" aria-labelledby="documents-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="documents-title">{t('documentList')}</h1>
          <p className="lede">{t('documentListIntro')}</p>
        </div>
        <Button variant="primary" onClick={() => setFormOpen((open) => !open)}>{t('newDocument')}</Button>
      </div>
      {formOpen && <form className="new-document-form" onSubmit={submit}>
        <label>{t('documentTitle')}<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('documentTitlePlaceholder')} /></label>
        <label>{t('documentType')}<select defaultValue="lease"><option value="lease">{t('leaseAgreement')}</option><option value="letter">{t('administrativeLetter')}</option><option value="insurance">{t('insuranceLetter')}</option></select></label>
        <label>{t('pasteText')}<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={t('pasteTextPlaceholder')} /></label>
        <label>{t('chooseTextFile')}<input type="file" accept=".txt,text/plain" onChange={(event) => event.target.files?.[0]?.text().then((content) => setText(content))} /></label>
        <div className="form-actions"><Button type="submit" variant="primary">{t('startReading')}</Button><Link className="button button-secondary" to="/documents/1/scanner">{t('scanWithCamera')}</Link></div>
      </form>}
      <div className="document-list">
        <article className="document-card">
          <div>
            <p className="eyebrow">{t('routeSummary')}</p>
            <h2>{t('sampleFile')}</h2>
            <p className="muted">{t('pageCount', { count: 14 })}</p>
          </div>
          <Link className="button button-secondary" to="/documents/1/summary">{t('open')}</Link>
        </article>
      </div>
    </section>
  );
}
