import { useTranslation } from 'react-i18next';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Badge } from '../components/Badge.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';
import { useDocumentData } from '../hooks/useDocumentData.jsx';

export function ActionsPage() {
  const { t } = useTranslation();
  const { actions, toggleAction } = usePrototype();
  const { document, loading, error } = useDocumentData();
  const documentActions = document?.id === 1 ? actions : document?.sentences.slice(0, 3).map((sentence) => ({ id: sentence.id, kind: 'must', title: sentence.plainText.slice(0, 60), deadline: 'Review this section', consequence: 'This item comes from the uploaded document.', sourceRef: sentence.sectionRef, done: false })) || [];
  const done = documentActions.filter((action) => action.done).length;
  const next = documentActions.find((action) => !action.done) || documentActions[0];
  if (loading) return <p className="loading-line">{t('loadingDetail')}</p>;
  if (error || !document || !next) return <p className="not-found">{error || t('errorDetail')}</p>;
  return <DocumentFrame title={t('actionsTitle')} eyebrow={t('actionsEyebrow')} actions={<Badge variant="info">{t('doneCounter', { done, total: documentActions.length })}</Badge>}>
    <section className="next-deadline"><span className="eyebrow">{t('nextDeadline')}</span><strong>{next.deadline}</strong><span>{next.title}</span><a href="#action-list">{t('viewNextAction')}</a></section>
    <div className="action-columns"><section><h2>{t('youMust')}</h2><div id="action-list" className="action-list">{documentActions.filter((action) => action.kind === 'must').map((action) => <ActionItem key={action.id} action={action} onToggle={() => document.id === 1 && toggleAction(action.id)} />)}</div></section><section><h2>{t('youCan')}</h2><div className="action-list">{documentActions.filter((action) => action.kind === 'can').map((action) => <ActionItem key={action.id} action={action} onToggle={() => document.id === 1 && toggleAction(action.id)} />)}</div></section></div>
  </DocumentFrame>;
}

function ActionItem({ action, onToggle }) {
  const { t } = useTranslation();
  const { notify } = usePrototype();
  return <article className={`action-item ${action.done ? 'action-done' : ''}`}><label><input type="checkbox" checked={action.done} onChange={onToggle} /><span><strong>{action.title}</strong><small>{action.deadline}</small></span></label><p>{action.consequence}</p><button className="source-citation" type="button" onClick={() => notify('sourceFocused')}>{t('sourceLabel')}: {action.sourceRef}</button></article>;
}
