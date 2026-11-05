import { createContext, useContext, useMemo, useState } from 'react';
import { actionItems as initialActions } from '../data/prototypeData.js';

const PrototypeContext = createContext(null);

export function PrototypeProvider({ children }) {
  const [readingLevel, setReadingLevel] = useState(6);
  const [actions, setActions] = useState(initialActions);
  const [savedTerms, setSavedTerms] = useState([]);
  const [toast, setToast] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Lease_Agreement_2026.pdf');

  const toggleAction = (id) => {
    setActions((current) => current.map((action) => action.id === id ? { ...action, done: !action.done } : action));
  };
  const saveTerm = (term) => {
    setSavedTerms((current) => current.some((saved) => saved.term === term.term) ? current : [...current, term]);
    setToast('termSaved');
  };
  const notify = (messageKey) => setToast(messageKey);
  const value = useMemo(() => ({
    readingLevel, setReadingLevel, actions, toggleAction, savedTerms, saveTerm, toast, setToast, notify, documentTitle, setDocumentTitle
  }), [readingLevel, actions, savedTerms, toast, documentTitle]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const value = useContext(PrototypeContext);
  if (!value) throw new Error('usePrototype must be used inside PrototypeProvider');
  return value;
}
