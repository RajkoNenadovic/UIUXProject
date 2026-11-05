import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button.jsx';
import { Drawer } from '../Drawer.jsx';
import { jargonTerms } from '../../data/prototypeData.js';
import { usePrototype } from '../../hooks/usePrototype.jsx';

export function JargonDrawer({ open, termKey = 'remit', onClose }) {
  const { t } = useTranslation();
  const { saveTerm, notify } = usePrototype();
  const [reported, setReported] = useState(false);
  const term = jargonTerms[termKey] || jargonTerms.remit;
  const submitReport = (event) => {
    event.preventDefault();
    setReported(true);
    notify('wrongMeaningReported');
  };
  return (
    <Drawer open={open} title={t('jargonDrawerTitle')} onClose={onClose}>
      <div className="jargon-term-heading"><span className="eyebrow">{t('jargonTerm')}</span><h3>{term.term}</h3><span className="jargon-part">{term.partOfSpeech}</span></div>
      <section className="jargon-definition"><h3>{t('whatItMeans')}</h3><p>{term.definition}</p></section>
      <section className="jargon-context"><h3>{t('inThisSentence')}</h3><p>“{term.sentence}”</p></section>
      <div className="drawer-actions"><Button variant="primary" onClick={() => saveTerm(term)}>{t('saveToWordList')}</Button><button className="text-button" type="button" onClick={() => setReported((value) => !value)}>{t('reportWrongMeaning')}</button></div>
      {reported && <form className="report-form" onSubmit={submitReport}><label>{t('reportReason')}<textarea required /></label><Button type="submit">{t('sendReport')}</Button></form>}
    </Drawer>
  );
}
