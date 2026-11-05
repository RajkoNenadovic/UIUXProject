import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../Drawer.jsx';
import { Button } from '../Button.jsx';
import { questionAnswers } from '../../data/prototypeData.js';
import { usePrototype } from '../../hooks/usePrototype.jsx';

export function QuestionSidebar({ open, onClose }) {
  const { t } = useTranslation();
  const { notify } = usePrototype();
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('idle');
  const [answer, setAnswer] = useState(null);
  const ask = (event) => {
    event.preventDefault();
    setStatus('loading');
    window.setTimeout(() => {
      const normalized = question.toLowerCase();
      const result = questionAnswers.find((item) => item.match.some((word) => normalized.includes(word)));
      setAnswer(result || null);
      setStatus('done');
    }, 350);
  };
  return <Drawer open={open} title={t('qaTitle')} onClose={onClose}>
    <p className="drawer-intro">{t('qaIntro')}</p>
    <form className="qa-form" onSubmit={ask}><label htmlFor="document-question">{t('askQuestion')}</label><textarea id="document-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t('questionPlaceholder')} required /><Button type="submit" variant="primary">{t('sendQuestion')}</Button></form>
    <div className="qa-result" aria-live="polite">{status === 'loading' && <p className="loading-line">{t('answerLoading')}</p>}{status === 'done' && answer && <article><h3>{t('answerLabel')}</h3><p>{answer.answer}</p><button className="source-citation" type="button" onClick={() => notify('sourceFocused')}>{t('citedSource', { source: answer.sourceRef })}</button></article>}{status === 'done' && !answer && <p className="not-found">{t('notFoundInDocument')}</p>}</div>
  </Drawer>;
}
