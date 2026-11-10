import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';
import { useState } from 'react';

export function ScannerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cameraReady, setCameraReady] = useState(false);
  return <DocumentFrame title={t('scannerTitle')} eyebrow={t('scannerEyebrow')}><section className="scanner-surface"><div className={`camera-frame ${cameraReady ? 'camera-ready' : ''}`}><span className="camera-corner camera-corner-tl" /><span className="camera-corner camera-corner-tr" /><span className="camera-corner camera-corner-bl" /><span className="camera-corner camera-corner-br" /><p>{cameraReady ? t('cameraReady') : t('cameraPermission')}</p><Button onClick={() => setCameraReady(true)}>{t('enableCamera')}</Button></div><div className="scanner-actions"><Button variant="primary" onClick={() => navigate(cameraReady ? '/documents/1/summary' : '/documents/1/unreadable')}>{t('capture')}</Button><Link className="button button-secondary" to="/documents/1/unreadable">{t('cantRead')}</Link></div></section></DocumentFrame>;
}
