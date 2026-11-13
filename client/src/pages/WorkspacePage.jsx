import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsApi } from '../api/http.js';
import { usePrototype } from '../hooks/usePrototype.jsx';

const navItems = [
  ['/', '⌂', 'Dashboard'],
  ['/library', '▤', 'Library'],
  ['/storage', '▧', 'Storage'],
  ['/profile', '○', 'Profile'],
  ['/notifications', '♧', 'Alerts'],
  ['/help', '?', 'Help']
];

export function WorkspacePage({ variant = 'dashboard' }) {
  const { setDocumentTitle, readingLevel, setReadingLevel, dyslexiaFriendly, setDyslexiaFriendly } = usePrototype();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async (term = '') => {
    setLoading(true);
    try {
      const result = await documentsApi.list(term);
      setDocuments(result.documents);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);
  useEffect(() => {
    if (variant !== 'library') return undefined;
    const timer = window.setTimeout(() => loadDocuments(search), 250);
    return () => window.clearTimeout(timer);
  }, [search, variant]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const isTextFile = file.type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(file.name);
      if (!isTextFile || !text.trim()) {
        setMessage('This prototype can decode text files. Please choose a .txt, .md, .csv, or .json file.');
        return;
      }
      const result = await documentsApi.create({
        title: file.name,
        docType: 'Uploaded document',
        originalText: text,
        pageCount: Math.max(1, Math.ceil(text.length / 2200)),
        readingLevel
      });
      setDocumentTitle(result.document.title);
      await loadDocuments();
      navigate(`/documents/${result.document.id}/summary`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  const recent = documents.slice(0, 3);
  const classes = useMemo(() => [
    ['Legal', documents.filter((document) => /lease|legal|contract/i.test(document.title)).length],
    ['Medical', documents.filter((document) => /medical|health/i.test(document.title)).length],
    ['Academic', documents.filter((document) => /research|academic|essay/i.test(document.title)).length],
    ['Other', documents.filter((document) => !/lease|legal|contract|medical|health|research|academic|essay/i.test(document.title)).length]
  ], [documents]);

  return (
    <div className="workspace">
      <WorkspaceHeader search={variant === 'dashboard' || variant === 'library' ? search : ''} onSearch={setSearch} />
      <div className="workspace-body">
        <aside className="workspace-sidebar" aria-label="Workspace navigation">
          {navItems.map(([path, icon, label]) => <Link key={path} className={isActive(path, variant) ? 'workspace-nav-active' : ''} to={path}><span aria-hidden="true">{icon}</span>{label}</Link>)}
        </aside>
        <div className="workspace-main">
          {variant === 'dashboard' && <DashboardContent recent={recent} fileInputRef={fileInputRef} handleFile={handleFile} uploading={uploading} message={message} documents={documents} onNew={() => fileInputRef.current?.click()} />}
          {variant === 'storage' && <StorageContent documents={documents} classes={classes} fileInputRef={fileInputRef} handleFile={handleFile} uploading={uploading} message={message} />}
          {variant === 'library' && <LibraryContent documents={documents} search={search} setSearch={setSearch} loading={loading} onReset={() => setSearch('')} onUpload={() => fileInputRef.current?.click()} />}
          {variant === 'profile' && <ProfileContent readingLevel={readingLevel} setReadingLevel={setReadingLevel} dyslexiaFriendly={dyslexiaFriendly} setDyslexiaFriendly={setDyslexiaFriendly} />}
          {variant === 'notifications' && <NotificationsContent />}
          {variant === 'help' && <HelpContent />}
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".txt,.md,.csv,.json,text/plain" onChange={(event) => handleFile(event.target.files?.[0])} />
        </div>
      </div>
    </div>
  );
}

function isActive(path, variant) {
  return (path === '/' && variant === 'dashboard') || path.slice(1) === variant;
}

function WorkspaceHeader({ search, onSearch }) {
  return <header className="workspace-header"><Link to="/" className="workspace-brand"><span className="workspace-logo" aria-hidden="true">CL</span><strong>ClearLayer</strong></Link>{onSearch && <label className="workspace-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search documents..." aria-label="Search documents" /></label>}<div className="workspace-header-actions"><Link to="/notifications" aria-label="Notifications">♧</Link><Link to="/profile" className="workspace-avatar" aria-label="Profile">AR</Link></div></header>;
}

function UploadZone({ fileInputRef, handleFile, uploading, message }) {
  return <div className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]); }}><span className="upload-icon" aria-hidden="true">↥</span><strong>{uploading ? 'Decoding...' : 'Drag & drop a file'}</strong><span>or <button type="button" onClick={() => fileInputRef.current?.click()}>tap to browse</button></span>{message && <p className="workspace-error" role="alert">{message}</p>}</div>;
}

function DashboardContent({ recent, fileInputRef, handleFile, uploading, message, documents, onNew }) {
  return <><div className="workspace-title"><div><h1>Home</h1><p>Decode institutional text</p></div></div><UploadZone fileInputRef={fileInputRef} handleFile={handleFile} uploading={uploading} message={message} /><div className="workspace-stat-grid"><Stat value={documents.length} label="Decoded" /><Stat value={documents.filter((document) => document.status === 'processing').length} label="In queue" /></div><div className="workspace-actions"><button className="workspace-dark-button" type="button" onClick={onNew}>＋ New decode</button><button className="workspace-outline-button" type="button" onClick={onNew}>＋ Add source</button></div><DocumentList title="Recent" documents={recent} /></>;
}

function StorageContent({ documents, classes, fileInputRef, handleFile, uploading, message }) {
  return <><div className="workspace-title"><h1>Storage</h1><p>Upload & classify documents</p></div><UploadZone fileInputRef={fileInputRef} handleFile={handleFile} uploading={uploading} message={message} /><h2 className="workspace-section-title">Format</h2><div className="format-pills"><span className="format-pill format-pill-active">▤ PDF</span><span className="format-pill">▥ DOCX</span><span className="format-pill">▧ Image</span></div><h2 className="workspace-section-title">Classifications</h2><div className="classification-grid">{classes.map(([name, count]) => <div key={name}><strong>{name}</strong><small>{count} files</small></div>)}</div><DocumentList title="All files" documents={documents} /></>;
}

function LibraryContent({ documents, search, setSearch, loading, onReset, onUpload }) {
  return <><div className="workspace-title"><div><h1>Decoded library</h1><p>{documents.length} decoded documents</p></div><button className="workspace-outline-button" type="button" onClick={() => setSearch(search ? '' : 'lease')}>↕ Recent</button></div>{loading ? <p>Loading documents...</p> : documents.length ? <DocumentList documents={documents} showActions /> : <div className="empty-library"><strong>No results found</strong><span>Search yielded 0 documents.</span><button className="workspace-outline-button" type="button" onClick={onReset}>Reset search filters</button><button className="workspace-dark-button" type="button" onClick={onUpload}>Upload new document</button></div>}</>;
}

function ProfileContent({ readingLevel, setReadingLevel, dyslexiaFriendly, setDyslexiaFriendly }) {
  return <><div className="workspace-title"><h1>Profile</h1></div><section className="profile-card"><div className="profile-person"><span className="profile-large-avatar">AR</span><div><strong>Alex Rivera</strong><small>alex.rivera@school.edu</small><span className="profile-tag">STUDENT</span></div><button className="workspace-outline-button" type="button">Edit</button></div><label className="profile-preference">Reading preference <strong>Grade {readingLevel}</strong><input type="range" min="6" max="10" step="2" value={readingLevel} onChange={(event) => setReadingLevel(Number(event.target.value))} /><span>Simple <i /> Detailed</span></label><div className="profile-setting"><span><strong>Readable font</strong><small>Use a dyslexia-friendly typeface.</small></span><button className={`setting-toggle ${dyslexiaFriendly ? 'setting-toggle-on' : ''}`} type="button" aria-pressed={dyslexiaFriendly} onClick={() => setDyslexiaFriendly((value) => !value)} /></div><div className="profile-setting"><span><strong>Read aloud</strong><small>Enable text-to-speech.</small></span><button className="setting-toggle" type="button" aria-label="Read aloud setting" /></div></section></>;
}

function NotificationsContent() {
  const notifications = [['Financial aid deadline', 'FAFSA renewal is due in 2 days.', 'Now'], ['Action required: lease notice', 'Your landlord notice needs a response by Fri.', '1h'], ['Decode complete', 'Insurance policy is ready to read.', '3h'], ['New document shared', 'Advisor added Course_Waiver.pdf.', 'Yesterday'], ['Reading tip', 'Try Simple mode for dense legal text.', '2d']];
  return <><div className="workspace-title"><h1>Alerts</h1><button className="workspace-outline-button" type="button">Mark all read</button></div><div className="notification-stats"><Stat value="2" label="Urgent actions" /><Stat value="5" label="Total notifications" /></div><div className="notification-list">{notifications.map(([title, detail, time], index) => <article className={index < 2 ? 'notification-urgent' : ''} key={title}><span className="notification-icon" aria-hidden="true">{index < 2 ? '!' : '✓'}</span><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time></article>)}</div></>;
}

function HelpContent() {
  return <><div className="workspace-title"><h1>Help & support</h1></div><section className="help-card"><div className="help-flow"><HelpStep title="Complex document" detail="Analyzes complex legal, medical, and housing forms." /><span>→</span><HelpStep title="Simplification engine" detail="Rewrites for clarity while preserving meaning." /><span>→</span><HelpStep title="Simplified output" detail="Delivers a clean summary with key points." /></div><h2>FAQs</h2><details><summary>Is the translation legally binding?</summary><p>No. ClearLayer explains the document but does not replace professional advice.</p></details><details><summary>What formats are supported?</summary><p>Text files can be uploaded directly. PDF and image OCR are planned for the next processing step.</p></details><button className="workspace-dark-button" type="button">Start tutorial</button></section></>;
}

function HelpStep({ title, detail }) {
  return <div className="help-step"><span aria-hidden="true">▤</span><strong>{title}</strong><small>{detail}</small></div>;
}

function Stat({ value, label }) {
  return <div className="workspace-stat"><strong>{value}</strong><small>{label}</small></div>;
}

function DocumentList({ title, documents, showActions = false }) {
  return <section className="workspace-documents"><div className="workspace-section-heading"><h2>{title}</h2><span>{documents.length}</span></div>{documents.map((document) => <article key={document.id} className="workspace-document"><span className="document-file-icon" aria-hidden="true">▤</span><div><strong>{document.title}</strong><small>{document.doc_type} · Grade {document.reading_level} · {document.page_count} pages</small></div>{showActions ? <div className="document-actions"><Link to={`/documents/${document.id}/summary`}>View</Link><button type="button">Save</button><button type="button">Share</button></div> : <Link to={`/documents/${document.id}/summary`} aria-label={`Open ${document.title}`}>›</Link>}</article>)}</section>;
}
