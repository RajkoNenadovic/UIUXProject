import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Confirmation for destructive actions. Uses the native <dialog> element, which gives
// a focus trap, Escape to close and focus restore without extra code.
// Cancel comes first in the DOM so it receives focus, not the destructive button.
export function ConfirmDialog({ open, title, message, confirmLabel, busy = false, error = null, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-message">{message}</p>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
      <div className="dialog-actions">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>
          {t('cancel')}
        </button>
        <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
