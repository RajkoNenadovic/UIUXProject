import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { actionItems as initialActions } from '../data/prototypeData.js';
import { settingsApi } from '../api/http.js';

const PrototypeContext = createContext(null);

export function PrototypeProvider({ children }) {
  const [readingLevel, setReadingLevel] = useState(6);
  const [actions, setActions] = useState(initialActions);
  const [savedTerms, setSavedTerms] = useState([]);
  const [toast, setToast] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Lease_Agreement_2026.pdf');
  const [dyslexiaFriendly, setDyslexiaFriendly] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const toggleAction = (id) => {
    setActions((current) => current.map((action) => action.id === id ? { ...action, done: !action.done } : action));
  };
  const saveTerm = (term) => {
    setSavedTerms((current) => current.some((saved) => saved.term === term.term) ? current : [...current, term]);
    setToast('termSaved');
  };
  const notify = (messageKey) => setToast(messageKey);
  useEffect(() => {
    settingsApi.get()
      .then(({ settings }) => {
        if (!settings) return;
        setReadingLevel(settings.reading_level);
        setDyslexiaFriendly(Boolean(settings.dyslexia_friendly));
      })
      .catch((error) => console.error('Unable to load saved settings.', error))
      .finally(() => setSettingsLoaded(true));
  }, []);
  useEffect(() => {
    if (!settingsLoaded) return;
    settingsApi.update({ readingLevel, dyslexiaFriendly })
      .catch((error) => console.error('Unable to save settings.', error));
  }, [readingLevel, dyslexiaFriendly, settingsLoaded]);
  const value = useMemo(() => ({
    readingLevel, setReadingLevel, actions, toggleAction, savedTerms, saveTerm, toast, setToast, notify, documentTitle, setDocumentTitle, dyslexiaFriendly, setDyslexiaFriendly
  }), [readingLevel, actions, savedTerms, toast, documentTitle, dyslexiaFriendly]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const value = useContext(PrototypeContext);
  if (!value) throw new Error('usePrototype must be used inside PrototypeProvider');
  return value;
}
