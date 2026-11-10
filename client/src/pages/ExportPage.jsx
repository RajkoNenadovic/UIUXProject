import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Button } from '../components/Button.jsx';
import { exportFormats } from '../data/prototypeData.js';
import { usePrototype } from '../hooks/usePrototype.jsx';

export function ExportPage() {
  const { t } = useTranslation();
  const { notify } = usePrototype();
  const [format, setFormat] = useState('pdf');
  const exportFile = () => {
    if (format === 'text') {
      const blob = new Blob([t('exportTextContent')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'plain-language-summary.txt'; link.click(); URL.revokeObjectURL(url);
      notify('downloadStarted');
    } else notify('exportReady');
  };
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); notify('linkCopied'); };
  return <DocumentFrame title={t('exportTitle')} eyebrow={t('exportEyebrow')}><section className="export-panel"><h2>{t('chooseFormat')}</h2><div className="format-options">{exportFormats.map((item) => <button key={item} className={`format-option ${format === item ? 'format-selected' : ''}`} type="button" onClick={() => setFormat(item)} aria-pressed={format === item}><span className="format-icon">{item === 'share' ? '↗' : '↓'}</span><strong>{t(`format${item[0].toUpperCase()}${item.slice(1)}`)}</strong><small>{t(`format${item[0].toUpperCase()}${item.slice(1)}Detail`)}</small></button>)}</div><div className="export-actions"><Button variant="primary" onClick={exportFile}>{t('exportButton')}</Button><Button onClick={copyLink}>{t('copyLink')}</Button></div></section></DocumentFrame>;
}
