import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle.js';

const STEPS = ['add', 'read', 'check', 'save'];
const QUESTIONS = ['binding', 'accuracy', 'files', 'privacy'];

// Help centre: collapsible answers (native <details>, keyboard accessible, never blocks the app).
export function HelpPage() {
  const { t } = useTranslation();
  usePageTitle(t('help.title'));

  return (
    <section className="page help-page" aria-labelledby="help-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 id="help-title">{t('help.title')}</h1>
          <p className="lede">{t('help.intro')}</p>
        </div>
        <Link className="button button-secondary" to="/">{t('documents.backToList')}</Link>
      </div>

      <h2 className="section-title">{t('help.stepsHeading')}</h2>
      <ol className="steps">
        {STEPS.map((step) => (
          <li key={step}>
            <strong>{t(`help.steps.${step}.title`)}</strong>
            <p>{t(`help.steps.${step}.text`)}</p>
          </li>
        ))}
      </ol>

      <h2 className="section-title">{t('help.faqHeading')}</h2>
      <div className="faq">
        {QUESTIONS.map((question) => (
          <details key={question}>
            <summary>{t(`help.faq.${question}.q`)}</summary>
            <p>{t(`help.faq.${question}.a`)}</p>
          </details>
        ))}
      </div>

      <div className="state-actions">
        <Link className="button button-primary" to="/">{t('help.startButton')}</Link>
        <Link className="button button-secondary" to="/glossary">{t('nav.glossary')}</Link>
      </div>
    </section>
  );
}
