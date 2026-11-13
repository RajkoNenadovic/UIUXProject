import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ConnectorBadge } from './ConnectorBadge.jsx';
import { PlainCard } from './PlainCard.jsx';
import { ReaderFooter } from './ReaderFooter.jsx';
import { SentenceCard } from './SentenceCard.jsx';
import { usePrototype } from '../../hooks/usePrototype.jsx';

export function SplitReader({ sentences, selectedId: controlledSelectedId, onSelectedChange, onOpenJargon, onOpenVerify, onOpenQa }) {
  const { i18n, t } = useTranslation();
  const { readingLevel } = usePrototype();
  const [localSelectedId, setLocalSelectedId] = useState(sentences[0]?.id ?? null);
  const selectedId = controlledSelectedId ?? localSelectedId;
  const setSelectedId = (id) => { setLocalSelectedId(id); onSelectedChange?.(id); };
  const [linksVisible, setLinksVisible] = useState(true);
  const page = new Intl.NumberFormat(i18n.language).format(2);

  return (
    <section className="split-reader" aria-label={t('readerWorkspace')}>
      <div className="reader-toolbar">
        <nav className="reader-tabs" aria-label={t('documentNavigation')}>
          <Link className="reader-tab reader-tab-active" to="/documents/1/reader" aria-current="page">{t('routeReader')}</Link>
          <Link className="reader-tab" to="/documents/1/focus">{t('routeFocus')}</Link>
          <Link className="reader-tab" to="/documents/1/actions">{t('routeActions')}</Link>
        </nav>
        <div className="reader-legend" aria-label={t('readerLegend')}>
          <span className="legend-item legend-match"><span aria-hidden="true" />{t('matchesSource')}</span>
          <span className="legend-item legend-uncertain"><span aria-hidden="true" />{t('uncertain')}</span>
          <button className="links-toggle" type="button" onClick={() => setLinksVisible((visible) => !visible)} aria-pressed={linksVisible}>{t(linksVisible ? 'linksOn' : 'linksOff')}</button>
        </div>
      </div>

      <div className="reader-column-headings">
        <h2>{t('originalText')} <span>{t('columnDetail', { detail: t('readerPage', { page }) })}</span></h2>
        <h2>{t('plainLanguage')} <span>{t('columnDetail', { detail: t('readingLevelValue', { level: readingLevel }) })}</span></h2>
      </div>

      <div className={`reader-grid ${linksVisible ? '' : 'reader-links-hidden'}`}>
        {sentences.map((sentence) => (
          <Fragment key={sentence.id}>
            <SentenceCard
              key="original"
              sentence={sentence}
              selected={sentence.id === selectedId}
              onSelect={() => setSelectedId(sentence.id)}
              onOpenJargon={onOpenJargon}
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
              onVerify={() => onOpenVerify(sentence.id)}
              onAsk={onOpenQa}
              readingLevel={readingLevel}
            />
          </Fragment>
        ))}
      </div>
      <ReaderFooter sentences={sentences} onVerify={onOpenVerify} onAsk={onOpenQa} />
    </section>
  );
}
