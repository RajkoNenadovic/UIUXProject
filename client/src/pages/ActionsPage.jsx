import { useTranslation } from 'react-i18next';
import { DocumentFrame } from '../components/navigation/DocumentFrame.jsx';
import { Badge } from '../components/Badge.jsx';
import { usePrototype } from '../hooks/usePrototype.jsx';

export function ActionsPage() {
  const { t } = useTranslation();
  const { actions, toggleAction } = usePrototype();
  const done = actions.filter((action) => action.done).length;
  const next = actions.find((action) => !action.done) || actions[0];
  return <DocumentFrame title={t('actionsTitle')} eyebrow={t('actionsEyebrow')} actions={<Badge variant="info">{t('doneCounter', { done, total: actions.length })}</Badge>}>
    <section className="next-deadline"><span className="eyebrow">{t('nextDeadline')}</span><strong>{next.deadline}</strong><span>{next.title}</span><a href="#action-list">{t('viewNextAction')}</a></section>
    <div className="action-columns"><section><h2>{t('youMust')}</h2><div id="action-list" className="action-list">{actions.filter((action) => action.kind === 'must').map((action) => <ActionItem key={action.id} action={action} onToggle={() => toggleAction(action.id)} />)}</div></section><section><h2>{t('youCan')}</h2><div className="action-list">{actions.filter((action) => action.kind === 'can').map((action) => <ActionItem key={action.id} action={action} onToggle={() => toggleAction(action.id)} />)}</div></section></div>
  </DocumentFrame>;
}

function ActionItem({ action, onToggle }) {
  const { t } = useTranslation();
  const { notify } = usePrototype();
  return <article className={`action-item ${action.done ? 'action-done' : ''}`}><label><input type="checkbox" checked={action.done} onChange={onToggle} /><span><strong>{action.title}</strong><small>{action.deadline}</small></span></label><p>{action.consequence}</p><button className="source-citation" type="button" onClick={() => notify('sourceFocused')}>{t('sourceLabel')}: {action.sourceRef}</button></article>;
}
