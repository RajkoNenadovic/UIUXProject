import { useTranslation } from 'react-i18next';
import { Button } from './Button.jsx';

export function StateView({ state = 'loading', onRetry }) {
  const { t } = useTranslation();
  const content = {
    loading: ['loading', 'loadingDetail'],
    empty: ['emptyDocuments', 'emptyDocumentsDetail'],
    error: ['error', 'errorDetail'],
    offline: ['offline', 'offlineDetail']
  }[state];

  return (
    <section className={`state-view state-${state}`} aria-live="polite">
      <p className="state-kicker">{t(content[0])}</p>
      <h2>{t(content[1])}</h2>
      {state === 'error' && <Button onClick={onRetry}>{t('retry')}</Button>}
    </section>
  );
}
