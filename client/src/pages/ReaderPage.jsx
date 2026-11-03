import { useTranslation } from 'react-i18next';
import { sampleDocument } from '../data/sampleDocument.js';
import { SplitReader } from '../components/reader/SplitReader.jsx';

export function ReaderPage() {
  const { t } = useTranslation();
  return (
    <section className="reader-page" aria-labelledby="reader-title">
      <h1 id="reader-title" className="visually-hidden">{t('screenReader')}</h1>
      <SplitReader sentences={sampleDocument.sentences} />
    </section>
  );
}
