import { useTranslation } from 'react-i18next';
import { SplitReader } from '../components/reader/SplitReader.jsx';
import { JargonDrawer } from '../components/jargon/JargonDrawer.jsx';
import { VerificationModal } from '../components/verification/VerificationModal.jsx';
import { QuestionSidebar } from '../components/qa/QuestionSidebar.jsx';
import { useState } from 'react';
import { useDocumentData } from '../hooks/useDocumentData.jsx';

export function ReaderPage({ initialPanel = null }) {
  const { t } = useTranslation();
  const { document, loading, error } = useDocumentData();
  const [panel, setPanel] = useState(initialPanel);
  const [termKey, setTermKey] = useState('remit');
  const [selectedId, setSelectedId] = useState(null);
  const openJargon = (key) => { setTermKey(key); setPanel('jargon'); };
  if (loading) return <p className="loading-line">{t('loadingDetail')}</p>;
  if (error || !document) return <p className="not-found">{error || t('errorDetail')}</p>;
  return (
    <section className="reader-page" aria-labelledby="reader-title">
      <h1 id="reader-title" className="visually-hidden">{t('screenReader')}</h1>
      <SplitReader sentences={document.sentences} selectedId={selectedId} onSelectedChange={setSelectedId} onOpenJargon={openJargon} onOpenVerify={(id) => { setSelectedId(id); setPanel('verify'); }} onOpenQa={() => setPanel('qa')} />
      <JargonDrawer open={panel === 'jargon'} termKey={termKey} onClose={() => setPanel(null)} />
      <VerificationModal open={panel === 'verify'} sentences={document.sentences} onClose={() => setPanel(null)} onSelectSentence={(id) => { setSelectedId(id); setPanel(null); }} />
      <QuestionSidebar open={panel === 'qa'} onClose={() => setPanel(null)} />
      {selectedId && <span className="visually-hidden" aria-live="polite">{t('sentenceSelected', { position: selectedId })}</span>}
    </section>
  );
}
