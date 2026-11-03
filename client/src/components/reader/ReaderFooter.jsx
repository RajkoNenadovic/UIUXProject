import { useTranslation } from 'react-i18next';

export function ReaderFooter({ sentences }) {
  const { i18n, t } = useTranslation();
  const counts = sentences.reduce((result, sentence) => {
    result[sentence.status] += 1;
    return result;
  }, { match: 0, uncertain: 0, skipped: 0 });
  const total = new Intl.NumberFormat(i18n.language).format(sentences.length);
  const matched = new Intl.NumberFormat(i18n.language).format(counts.match);
  const uncertain = new Intl.NumberFormat(i18n.language).format(counts.uncertain);
  const skipped = new Intl.NumberFormat(i18n.language).format(counts.skipped);

  return (
    <footer className="reader-footer">
      <strong>{t('readerFooterGenerated')}</strong>
      <span>{t('matchSummary', { count: sentences.length, matched, total, uncertain, skipped })}</span>
      <nav className="reader-footer-links" aria-label={t('readerFooterActions')}>
        <button type="button">{t('howChecked')}</button>
        <button type="button">{t('reportProblem')}</button>
      </nav>
    </footer>
  );
}
