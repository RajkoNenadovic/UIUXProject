import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConnectorBadge } from './ConnectorBadge.jsx';
import { PlainCard } from './PlainCard.jsx';
import { ReaderFooter } from './ReaderFooter.jsx';
import { SentenceCard } from './SentenceCard.jsx';

export function SplitReader({ sentences }) {
  const { i18n, t } = useTranslation();
  const [selectedId, setSelectedId] = useState(sentences[0]?.id ?? null);
  const page = new Intl.NumberFormat(i18n.language).format(2);

  return (
    <section className="split-reader" aria-label={t('readerWorkspace')}>
      <div className="reader-toolbar">
        <nav className="reader-tabs" aria-label={t('documentNavigation')}>
          <button className="reader-tab reader-tab-active" type="button" aria-current="page">{t('routeReader')}</button>
          <button className="reader-tab" type="button">{t('routeFocus')}</button>
          <button className="reader-tab" type="button">{t('routeActions')}</button>
        </nav>
        <div className="reader-legend" aria-label={t('readerLegend')}>
          <span className="legend-item legend-match"><span aria-hidden="true" />{t('matchesSource')}</span>
          <span className="legend-item legend-uncertain"><span aria-hidden="true" />{t('uncertain')}</span>
          <button className="links-toggle" type="button">{t('linksOn')}</button>
        </div>
      </div>

      <div className="reader-column-headings">
        <h2>{t('originalText')} <span>{t('columnDetail', { detail: t('readerPage', { page }) })}</span></h2>
        <h2>{t('plainLanguage')} <span>{t('columnDetail', { detail: t('readingLevelValue', { level: 6 }) })}</span></h2>
      </div>

      <div className="reader-grid">
        {sentences.map((sentence) => (
          <Fragment key={sentence.id}>
            <SentenceCard
              key="original"
              sentence={sentence}
              selected={sentence.id === selectedId}
              onSelect={() => setSelectedId(sentence.id)}
            />
            <ConnectorBadge
              key="connector"
              position={sentence.position}
              status={sentence.status}
              selected={sentence.id === selectedId}
              onSelect={() => setSelectedId(sentence.id)}
            />
            <PlainCard
              key="plain"
              sentence={sentence}
              selected={sentence.id === selectedId}
              onSelect={() => setSelectedId(sentence.id)}
            />
          </Fragment>
        ))}
      </div>
      <ReaderFooter sentences={sentences} />
    </section>
  );
}
