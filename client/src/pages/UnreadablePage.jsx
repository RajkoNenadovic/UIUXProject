import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';

export function UnreadablePage() {
  const { t } = useTranslation();
  return <DocumentFrame title={t('unreadableTitle')} eyebrow={t('unreadableEyebrow')}><section className="unreadable-panel"><div className="readability-meter"><span>{t('readabilityMeter')}</span><strong>{t('readabilityPoor')}</strong><div><i /></div></div><h2>{t('unreadableHeading')}</h2><p>{t('unreadableDetail')}</p><div className="recovery-options"><Link className="button button-primary" to="/documents/1/scanner">{t('retakePhoto')}</Link><Link className="button button-secondary" to="/?new=1">{t('pasteText')}</Link><Link className="button button-secondary" to="/?new=1">{t('uploadAnother')}</Link></div></section></DocumentFrame>;
}
