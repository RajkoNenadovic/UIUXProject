import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, errorMessage } from '../lib/api.js';
import { DOC_TYPES } from '../lib/docTypes.js';

const MAX_TITLE = 120;
const MAX_TEXT = 100000;
const FIELD_FOR_CODE = {
  TITLE_REQUIRED: 'title',
  TITLE_TOO_LONG: 'title',
  INVALID_DOC_TYPE: 'docType',
  TEXT_REQUIRED: 'text',
  TEXT_TOO_LONG: 'text'
};

// Create and edit form in one dialog. The parent changes `key` every time it opens the
// dialog, which resets the form state.
export function DocumentFormDialog({ open, doc, onClose, onSaved }) {
  const { t } = useTranslation();
  const editing = Boolean(doc);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const typeRef = useRef(null);
  const textRef = useRef(null);
  const fieldRefs = { title: titleRef, docType: typeRef, text: textRef };

  const [values, setValues] = useState({
    title: doc?.title ?? '',
    docType: DOC_TYPES.includes(doc?.doc_type) ? doc.doc_type : 'other',
    text: ''
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const setValue = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  function validate() {
    const found = {};
    const title = values.title.trim();
    if (!title) found.title = 'TITLE_REQUIRED';
    else if (title.length > MAX_TITLE) found.title = 'TITLE_TOO_LONG';
    if (!DOC_TYPES.includes(values.docType)) found.docType = 'INVALID_DOC_TYPE';
    if (!editing) {
      if (!values.text.trim()) found.text = 'TEXT_REQUIRED';
      else if (values.text.length > MAX_TEXT) found.text = 'TEXT_TOO_LONG';
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    const firstInvalid = ['title', 'docType', 'text'].find((name) => found[name]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setBusy(true);
    try {
      const body = editing
        ? { title: values.title, doc_type: values.docType }
        : { title: values.title, doc_type: values.docType, original_text: values.text };
      const result = await api(editing ? `/documents/${doc.id}` : '/documents', {
        method: editing ? 'PUT' : 'POST',
        body
      });
      onSaved(result.document, editing ? 'edit' : 'create');
    } catch (error) {
      const field = FIELD_FOR_CODE[error.code];
      if (field) {
        setErrors({ [field]: error.code });
        fieldRefs[field].current?.focus();
      } else {
        setFormError(errorMessage(t, error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setValues((current) => ({
        ...current,
        text,
        title: current.title || file.name.replace(/\.[^.]+$/, '')
      }));
      setErrors((current) => ({ ...current, text: text.length > MAX_TEXT ? 'TEXT_TOO_LONG' : undefined }));
    } catch {
      setFormError(t('errors.INTERNAL_ERROR'));
    }
    input.value = '';
  }

  const describe = (name, id) => (errors[name] ? `${id}-error` : undefined);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="doc-form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form noValidate onSubmit={handleSubmit}>
        <h2 id="doc-form-title">{editing ? t('documents.form.editTitle') : t('documents.form.createTitle')}</h2>

        <div className="field">
          <label htmlFor="doc-title">{t('documents.form.titleLabel')}</label>
          <input
            id="doc-title"
            ref={titleRef}
            type="text"
            value={values.title}
            onChange={setValue('title')}
            autoComplete="off"
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describe('title', 'doc-title')}
          />
          {errors.title ? <p id="doc-title-error" className="form-error">{t(`errors.${errors.title}`)}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="doc-type">{t('documents.form.typeLabel')}</label>
          <select
            id="doc-type"
            ref={typeRef}
            value={values.docType}
            onChange={setValue('docType')}
            aria-invalid={Boolean(errors.docType)}
            aria-describedby={describe('docType', 'doc-type')}
          >
            {DOC_TYPES.map((type) => <option key={type} value={type}>{t(`documents.types.${type}`)}</option>)}
          </select>
          {errors.docType ? <p id="doc-type-error" className="form-error">{t(`errors.${errors.docType}`)}</p> : null}
        </div>

        {!editing ? (
          <>
            <div className="field">
              <label htmlFor="doc-text">{t('documents.form.textLabel')}</label>
              <textarea
                id="doc-text"
                ref={textRef}
                value={values.text}
                onChange={setValue('text')}
                aria-required="true"
                aria-invalid={Boolean(errors.text)}
                aria-describedby={errors.text ? 'doc-text-error doc-text-help' : 'doc-text-help'}
              />
              <p id="doc-text-help" className="hint">{t('documents.form.textHelp')}</p>
              {errors.text ? <p id="doc-text-error" className="form-error">{t(`errors.${errors.text}`)}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="doc-file">{t('documents.form.fileLabel')}</label>
              <input id="doc-file" type="file" accept=".txt,text/plain" onChange={handleFile} />
            </div>
          </>
        ) : null}

        {formError ? <p role="alert" className="form-error">{formError}</p> : null}

        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>{t('cancel')}</button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? t('documents.form.saving') : editing ? t('documents.form.saveChanges') : t('documents.form.create')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
