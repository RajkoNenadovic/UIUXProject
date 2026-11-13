import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';

const steps = ['summary', 'reader', 'focus', 'actions', 'export'];

export function DocumentStepper() {
  const { t } = useTranslation();
  const { id } = useParams();
  const current = useLocation().pathname.split('/').pop();
  const activeStep = ['jargon', 'verify', 'qa'].includes(current) ? 'reader' : current;
  return <nav className="document-stepper" aria-label={t('documentNavigation')}>{steps.map((step, index) => <Link className={activeStep === step ? 'step-active' : ''} key={step} to={`/documents/${id}/${step}`}><span>{index + 1}</span>{t(`route${step[0].toUpperCase()}${step.slice(1)}`)}</Link>)}</nav>;
}
