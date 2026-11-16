import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { documentsApi } from '../api/http.js';
import { sampleDocument } from '../data/sampleDocument.js';
import { usePrototype } from './usePrototype.jsx';

function createSentences(document) {
  const parts = document.original_text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((text) => text.trim())
    .filter(Boolean);

  return parts.map((text, index) => ({
    id: `${document.id}-${index + 1}`,
    position: index + 1,
    sectionRef: `§${index + 1}`,
    originalText: text,
    plainText: text,
    plainTextByLevel: { 6: text, 8: text, 10: text },
    confidence: 0.9,
    status: 'match',
    category: 'information'
  }));
}

function makeDocument(record) {
  if (String(record.id) === '1') {
    return { ...sampleDocument, title: record.title, pageCount: record.page_count };
  }
  return {
    id: record.id,
    title: record.title,
    pageCount: record.page_count,
    readingLevel: record.reading_level,
    sentences: createSentences(record)
  };
}

export function useDocumentData() {
  const { id = '1' } = useParams();
  const { setDocumentTitle } = usePrototype();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    documentsApi.get(id)
      .then(({ document }) => {
        if (!active) return;
        setRecord(document);
        setDocumentTitle(document.title);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, setDocumentTitle]);

  const document = useMemo(() => record ? makeDocument(record) : null, [record]);
  return { document, loading, error };
}
