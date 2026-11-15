import { render, screen, waitFor, within, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.jsx';
import i18n from './i18n/index.js';
import { createFormatters } from './lib/useFormat.js';

const baseDoc = { page_count: 3, reading_level: 6, status: 'ready', created_at: '2026-11-14 18:30:00', updated_at: '2026-11-14 18:30:00', sentence_count: 0, uncertain_count: 0, open_action_count: 0 };
const makeDocs = () => [
  { ...baseDoc, id: 1, title: 'Lease_Agreement_2026', doc_type: 'lease', page_count: 14, sentence_count: 3, uncertain_count: 1, open_action_count: 3 },
  { ...baseDoc, id: 2, title: 'Škola – ugovor o upisu', doc_type: 'education' },
  { ...baseDoc, id: 3, title: 'Đački dom – pravilnik', doc_type: 'education' },
  { ...baseDoc, id: 4, title: 'Cjenik komunalnih usluga', doc_type: 'other', page_count: 1 },
  { ...baseDoc, id: 5, title: 'Čitanje brojila', doc_type: 'other', page_count: 1 }
];

const ana = { id: 1, email: 'ana@example.com', display_name: 'Ana Horvat', role: 'adult', onboarded: true, locale: 'en', reading_level: 6 };

let state;
function installBackend(overrides = {}) {
  state = { user: { ...ana }, accounts: {}, docs: makeDocs(), settings: { id: 1, reading_level: 6, dyslexia_friendly: 0, font_size: 'medium', spacing: 'comfortable', theme: 'light', locale: 'en' }, terms: [], calls: [], failNext: null, ...overrides };
  const json = (status, body) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  global.fetch = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = String(url).replace(/^\/api/, '');
    state.calls.push(`${method} ${path}`);
    if (state.failNext && state.failNext.test(`${method} ${path}`)) { const r = state.failNextResponse; state.failNext = null; if (r === 'network') throw new TypeError('fetch failed'); return r; }
    const body = options.body ? JSON.parse(options.body) : undefined;
    let m;
    // ---- accounts (mirrors server/src/routes/auth.js)
    if (method === 'GET' && path === '/auth/me') return json(200, { user: state.user ?? null });
    if (method === 'POST' && path === '/auth/login') {
      if (body.email === 'locked@example.com') return json(429, { error: { code: 'TOO_MANY_ATTEMPTS' } });
      if (body.email !== 'ana@example.com' || body.password !== 'correct horse') return json(401, { error: { code: 'INVALID_CREDENTIALS' } });
      state.user = { ...ana, locale: state.signInLocale ?? 'en' }; state.settings = { ...state.settings, locale: state.user.locale };
      return json(200, { user: state.user });
    }
    if (method === 'POST' && path === '/auth/register') {
      if (body.email === 'taken@example.com') return json(409, { error: { code: 'EMAIL_TAKEN' } });
      state.user = { id: 2, email: body.email, display_name: body.display_name, role: null, onboarded: false, locale: body.locale, reading_level: 6 };
      state.settings = { ...state.settings, locale: body.locale };
      return json(201, { user: state.user });
    }
    if (method === 'POST' && path === '/auth/logout') { state.user = null; return json(204); }
    if (method === 'PUT' && path === '/auth/profile') {
      if (!state.user) return json(401, { error: { code: 'UNAUTHENTICATED' } });
      if (!['adult', 'student', 'professional'].includes(body.role)) return json(400, { error: { code: 'INVALID_ROLE' } });
      state.user = { ...state.user, role: body.role, reading_level: body.reading_level, onboarded: true };
      state.settings = { ...state.settings, reading_level: body.reading_level };
      return json(200, { user: state.user });
    }
    if (!state.user) return json(401, { error: { code: 'UNAUTHENTICATED' } });
    if (method === 'GET' && path === '/documents') return json(200, { documents: state.docs });
    if (method === 'GET' && (m = path.match(/^\/documents\/(\d+)$/))) { const d = state.docs.find((x) => x.id === Number(m[1])); return d ? json(200, { document: d, sentences: [{ confidence: 0.9, status: 'match' }, { confidence: 0.6, status: 'uncertain' }], actions: [] }) : json(404, { error: { code: 'NOT_FOUND' } }); }
    if (method === 'DELETE' && (m = path.match(/^\/documents\/(\d+)$/))) { state.docs = state.docs.filter((x) => x.id !== Number(m[1])); return json(204); }
    if (method === 'POST' && path === '/documents') { const d = { ...baseDoc, id: 99, title: body.title, doc_type: body.doc_type, page_count: 1 }; state.docs = [d, ...state.docs]; return json(201, { document: d }); }
    if (method === 'GET' && path === '/settings') return json(200, { settings: state.settings });
    if (method === 'PUT' && path === '/settings') { state.settings = { ...state.settings, ...body, dyslexia_friendly: body.dyslexia_friendly === undefined ? state.settings.dyslexia_friendly : Number(body.dyslexia_friendly) }; return json(200, { settings: state.settings }); }
    if (method === 'GET' && path === '/terms') return json(200, { terms: state.terms });
    if (method === 'POST' && path === '/terms') { state.terms = [{ id: 1, term: body.term, definition: body.definition, example_in_context: body.example_in_context, source_title: null }, ...state.terms]; return json(201, { term: state.terms[0] }); }
    if (method === 'GET' && path.startsWith('/terms/define')) {
      const term = decodeURIComponent(path.split('term=')[1]);
      if (term === 'remit') return json(200, { status: 'success', term, cached: false, stale: false, result: { word: 'remit', phonetic: '/rɪˈmɪt/', meanings: [{ partOfSpeech: 'verb', definitions: [{ definition: 'To send money.', example: 'Remit the rent.' }] }], source: { name: 'Wiktionary via Free Dictionary API', url: 'https://en.wiktionary.org/wiki/remit', license: 'CC BY-SA 3.0', licenseUrl: null } } });
      if (term === 'zzzz') return json(200, { status: 'not_found', term });
      return json(429, { error: { code: 'UPSTREAM_RATE_LIMITED' } });
    }
    return json(404, { error: { code: 'NOT_FOUND' } });
  });
}

async function renderApp(path = '/', language = 'en') {
  await i18n.changeLanguage(language);
  if (state.user) { state.user.locale = language; state.settings.locale = language; }
  const user = userEvent.setup();
  render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></I18nextProvider>);
  return user;
}

beforeEach(() => { installBackend(); localStorage.clear(); delete document.documentElement.dataset.fontSize; });
afterEach(cleanup);

describe('documents list (screens 04 / 06)', () => {
  it('shows documents from the API with translated type, counts and relative time', async () => {
    await renderApp();
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
    expect(screen.getByText('14 pages')).toBeTruthy();
    expect(screen.getByText('1 uncertain sentence')).toBeTruthy();
    expect(screen.getByText('3 actions to take')).toBeTruthy();
    expect(screen.getAllByText(/Updated/).length).toBe(5);
    expect(document.title).toBe('Documents · Plain Language Layer');
  });

  it('search ignores diacritics: "skola" finds Škola, "dacki" finds Đački', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.type(screen.getByLabelText('Search by title'), 'skola');
    expect(screen.getByRole('heading', { name: 'Škola – ugovor o upisu' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Lease_Agreement_2026' })).toBeNull();
    expect(screen.getByText('1 document')).toBeTruthy();
    await user.clear(screen.getByLabelText('Search by title'));
    await user.type(screen.getByLabelText('Search by title'), 'dacki');
    expect(screen.getByRole('heading', { name: 'Đački dom – pravilnik' })).toBeTruthy();
  });

  it('shows a no-results state with a way out', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.type(screen.getByLabelText('Search by title'), 'qqqq');
    expect(screen.getByRole('heading', { name: 'No documents match' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear search and filter' }));
    expect(screen.getByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('filters by type', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Document type' }), 'education');
    expect(screen.getByText('2 documents')).toBeTruthy();
  });

  it('delete needs confirmation, then removes and moves focus to the heading', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.click(screen.getByRole('button', { name: 'Delete Škola – ugovor o upisu' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/cannot be undone/)).toBeTruthy();
    expect(state.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
    await user.click(within(dialog).getByRole('button', { name: 'Delete document' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Škola – ugovor o upisu' })).toBeNull());
    expect(state.calls).toContain('DELETE /documents/2');
    expect(screen.getByText('Document deleted.')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Documents' })));
  });

  it('cancel does not delete', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.click(screen.getByRole('button', { name: 'Delete Lease_Agreement_2026' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(state.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
    expect(screen.getByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('delete failure keeps the dialog open and shows a translated error', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.click(screen.getByRole('button', { name: 'Delete Lease_Agreement_2026' }));
    const dialog = await screen.findByRole('dialog');
    state.failNext = /^DELETE/; state.failNextResponse = new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }), { status: 500 });
    await user.click(within(dialog).getByRole('button', { name: 'Delete document' }));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();
    expect(within(dialog).getByRole('alert').textContent).toBe('Something went wrong. Try again.');
    expect(screen.getByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('create: validates empty fields, focuses the first error, then saves', async () => {
    const user = await renderApp();
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    await user.click(screen.getByRole('button', { name: 'Upload / New document' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Add document' }));
    expect(within(dialog).getByText('Enter a title.')).toBeTruthy();
    expect(within(dialog).getByText('Paste some text or load a .txt file.')).toBeTruthy();
    expect(document.activeElement).toBe(within(dialog).getByLabelText('Title'));
    expect(within(dialog).getByLabelText('Title').getAttribute('aria-invalid')).toBe('true');
    expect(state.calls.some((c) => c.startsWith('POST'))).toBe(false);
    await user.type(within(dialog).getByLabelText('Title'), 'Rješenje o boravku');
    await user.type(within(dialog).getByLabelText('Document text'), 'Prva rečenica.');
    await user.click(within(dialog).getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(state.calls).toContain('POST /documents'));
    expect(await screen.findByText('Document added.')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Rješenje o boravku' })).toBeTruthy();
  });

  it('API down: shows the error state with retry, and retry recovers', async () => {
    state.failNext = /^GET \/documents$/; state.failNextResponse = 'network';
    const user = await renderApp();
    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('browser offline: says so, instead of blaming the server', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    state.failNext = /^GET \/documents$/; state.failNextResponse = 'network';
    try {
      await renderApp();
      expect(await screen.findByText('You are offline')).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });

  it('empty database shows the empty state with an add action', async () => {
    installBackend({ docs: [] });
    await renderApp();
    expect(await screen.findByText('No documents yet')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Upload / New document' }).length).toBe(2);
  });
});

describe('document not found (screen 10)', () => {
  it('shows the dead-end screen with two exits', async () => {
    await renderApp('/documents/404/summary');
    expect(await screen.findByRole('heading', { name: 'Document not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to documents' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Upload / New document' }).getAttribute('href')).toBe('/?new=1');
  });
  it('"?new=1" opens the add dialog', async () => {
    await renderApp('/?new=1');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Add a document' })).toBeTruthy();
  });
  it('loads a real document into the document screen', async () => {
    await renderApp('/documents/1/summary');
    expect(await screen.findByRole('heading', { level: 1, name: 'TL;DR executive summary' })).toBeTruthy();
    expect(screen.getByText('Lease_Agreement_2026')).toBeTruthy();
  });
});

describe('Croatian: plurals, dates, sorting', () => {
  it('uses one/few/other correctly', async () => {
    await renderApp('/', 'hr');
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    const t = i18n.getFixedT('hr');
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25].map((n) => t('documents.resultsCount', { count: n }))).toEqual([
      '1 dokument', '2 dokumenta', '4 dokumenta', '5 dokumenata', '11 dokumenata', '12 dokumenata', '21 dokument', '22 dokumenta', '25 dokumenata'
    ]);
    expect(screen.getByText('14 stranica')).toBeTruthy();
    expect(screen.getByText('5 dokumenata')).toBeTruthy();
    expect(screen.getByText('1 nesigurna rečenica')).toBeTruthy();
    expect(screen.getAllByText(/^Ažurirano /).length).toBe(5);
  });
  it('sorts č ć š ž đ as letters, not after z', () => {
    const f = createFormatters('hr');
    expect(f.sort(['Zora', 'Žaba', 'Dom', 'Đak', 'Cesta', 'Čaj', 'Ćup', 'Šuma', 'Sat', 'Ana'])).toEqual(['Ana', 'Cesta', 'Čaj', 'Ćup', 'Dom', 'Đak', 'Sat', 'Šuma', 'Zora', 'Žaba']);
  });
  it('formats numbers, dates and lists per locale', () => {
    const hr = createFormatters('hr'); const en = createFormatters('en'); const es = createFormatters('es');
    expect(hr.number(1234567.5)).toBe('1.234.567,5');
    expect(en.number(1234567.5)).toBe('1,234,567.5');
    expect(hr.currency(1234.5)).toContain('1.234,50');
    expect(hr.shortDate('2026-11-14 18:30:00')).toMatch(/14\. ?11\. ?2026/);
    expect(en.shortDate('2026-11-14 18:30:00')).toBe('14/11/2026');
    expect(es.list(['a', 'b', 'c'])).toBe('a, b y c');
    expect(hr.list(['a', 'b', 'c'])).toBe('a, b i c');
    expect(hr.percent(0.945)).toMatch(/94,5\s?%/);
  });
  it('relative time: UTC database timestamps become the viewer’s past, in the viewer’s language', () => {
    const now = Date.parse('2026-11-14T20:30:00Z');
    expect(createFormatters('en').relative('2026-11-14 18:30:00', now)).toBe('2 hours ago');
    expect(createFormatters('hr').relative('2026-11-14 18:30:00', now)).toMatch(/prije 2 sata/);
    expect(createFormatters('es').relative('2026-11-14 18:30:00', now)).toBe('hace 2 horas');
    expect(createFormatters('en').relative('2026-11-13 20:30:00', now)).toBe('yesterday');
  });
});

describe('glossary + dictionary API', () => {
  it('looks up a word, shows source and licence, saves it', async () => {
    const user = await renderApp('/glossary');
    await user.type(await screen.findByLabelText('Look up an English word'), 'remit');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByText('To send money.')).toBeTruthy();
    expect(screen.getByText(/Licence: CC BY-SA 3.0/)).toBeTruthy();
    expect(screen.getByText('To send money.').closest('[lang]').getAttribute('lang')).toBe('en');
    await user.click(screen.getByRole('button', { name: 'Save to my list' }));
    expect(await screen.findByText('Saved “remit” to your list.')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Remove remit' })).toBeTruthy();
  });
  it('word not found is a calm state, not an error', async () => {
    const user = await renderApp('/glossary');
    await user.type(await screen.findByLabelText('Look up an English word'), 'zzzz');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByRole('heading', { name: 'No definition found for “zzzz”' })).toBeTruthy();
  });
  it('provider failure shows a translated message and retry', async () => {
    const user = await renderApp('/glossary');
    await user.type(await screen.findByLabelText('Look up an English word'), 'busy');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByText('The dictionary is busy. Wait a minute and try again.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
  it('too-short input is rejected on the client with focus on the field', async () => {
    const user = await renderApp('/glossary');
    const input = await screen.findByLabelText('Look up an English word');
    await user.type(input, 'a');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(screen.getByText('Enter an English word or short phrase of at least 2 letters.')).toBeTruthy();
    expect(document.activeElement).toBe(input);
    expect(state.calls.some((c) => c.includes('/terms/define'))).toBe(false);
  });
  it('error messages are translated, not raw server text', async () => {
    const user = await renderApp('/glossary', 'hr');
    await user.type(await screen.findByLabelText('Potražite englesku riječ'), 'busy');
    await user.click(screen.getByRole('button', { name: 'Potraži' }));
    expect(await screen.findByText('Rječnik je zauzet. Pričekajte minutu i pokušajte ponovno.')).toBeTruthy();
  });
});

describe('settings (screen 07)', () => {
  it('applies text size immediately and saves it', async () => {
    const user = await renderApp('/settings');
    await user.click(await screen.findByRole('radio', { name: 'Large' }));
    expect(document.documentElement.dataset.fontSize).toBe('large');
    await waitFor(() => expect(state.settings.font_size).toBe('large'));
    expect(await screen.findByText('Settings saved.')).toBeTruthy();
  });
  it('rolls back and explains when saving fails', async () => {
    const user = await renderApp('/settings');
    const small = await screen.findByRole('radio', { name: 'Small' });
    state.failNext = /^PUT/; state.failNextResponse = new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }), { status: 500 });
    await user.click(small);
    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong. Try again.');
    expect(document.documentElement.dataset.fontSize).toBe('medium');
    expect(screen.getByRole('radio', { name: 'Medium' }).checked).toBe(true);
  });
  it('changing language updates text, <html lang>, storage and the server', async () => {
    const user = await renderApp('/settings');
    await user.selectOptions(await screen.findByLabelText('Language'), 'hr');
    expect(await screen.findByRole('heading', { level: 1, name: 'Postavke' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('hr');
    expect(localStorage.getItem('plain-language-locale')).toBe('hr');
    await waitFor(() => expect(state.settings.locale).toBe('hr'));
    expect(document.title).toBe('Postavke · Sloj jasnog jezika');
  });
  it('dyslexia-friendly toggle sets the data attribute', async () => {
    const user = await renderApp('/settings');
    await user.click(await screen.findByRole('checkbox', { name: 'Easier-to-read spacing' }));
    await waitFor(() => expect(document.documentElement.dataset.dyslexia).toBe('true'));
  });
});

describe('help (screen 09)', () => {
  it('renders steps and collapsible FAQ', async () => {
    const user = await renderApp('/help');
    expect(await screen.findByRole('heading', { level: 1, name: 'Help' })).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(4);
    const summary = screen.getByText('Is the plain version legally binding?');
    await user.click(summary);
    expect(summary.closest('details').open).toBe(true);
  });
});


// =====================================================================================
// Accounts: screens 01 (sign in / create account) and 02 (role selection)
// =====================================================================================
const signedOut = () => { state.user = null; };
const signIn = async (user, email = 'ana@example.com', password = 'correct horse') => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};
const sentBody = (method, path) => {
  const call = global.fetch.mock.calls.find(([url, options]) => String(url) === `/api${path}` && (options?.method || 'GET') === method);
  return call && call[1]?.body ? JSON.parse(call[1].body) : undefined;
};
const alertText = () => screen.getByRole('alert', { hidden: false }).textContent;

describe('sign in (screen 01)', () => {
  it('sends signed-out visitors to the sign-in screen and shows none of the app', async () => {
    signedOut();
    await renderApp('/');
    const heading = await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    expect(screen.getByText('Decode institutional text with clarity.')).toBeTruthy();
    expect(screen.queryByText('Lease_Agreement_2026')).toBeNull();
    expect(state.calls).not.toContain('GET /documents');
    expect(document.title).toBe('Sign in · Plain Language Layer');
    expect(document.activeElement).toBe(heading);
  });

  it('empty submit: one message per field, focus on the first, nothing sent to the server', async () => {
    signedOut();
    const user = await renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your email address.')).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
    const email = screen.getByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('email-error');
    expect(document.activeElement).toBe(email);
    expect(state.calls).not.toContain('POST /auth/login');
  });

  it('rejects an address that is not an email before calling the server', async () => {
    signedOut();
    const user = await renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address, like name@school.edu.')).toBeTruthy();
    expect(state.calls).not.toContain('POST /auth/login');
  });

  it('wrong password: a generic message, password cleared and focused, email kept', async () => {
    signedOut();
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await signIn(user, 'ana@example.com', 'nope nope');
    await waitFor(() => expect(alertText()).toBe('The email or password is not correct.'));
    expect(screen.getByLabelText('Password').value).toBe('');
    expect(document.activeElement).toBe(screen.getByLabelText('Password'));
    expect(screen.getByLabelText('Email').value).toBe('ana@example.com');
    expect(screen.queryByText('Lease_Agreement_2026')).toBeNull();
  });

  it('too many attempts: the lock-out is explained', async () => {
    signedOut();
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await signIn(user, 'locked@example.com', 'x');
    await waitFor(() => expect(alertText()).toBe('Too many failed attempts. Wait 15 minutes and try again.'));
  });

  it('server down while signing in: a clear, translated error (not a crash)', async () => {
    signedOut();
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    state.failNext = /POST \/auth\/login/; state.failNextResponse = 'network';
    await signIn(user);
    await waitFor(() => expect(alertText()).toBe('Cannot reach the server. Check your connection and try again.'));
    expect(screen.getByRole('button', { name: 'Sign in' }).disabled).toBe(false);
  });

  it('signs in and shows the app with the person’s name and a Sign out button', async () => {
    signedOut();
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await signIn(user);
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
    const menu = screen.getByRole('group', { name: 'Signed in as Ana Horvat' });
    expect(within(menu).getByText('Ana Horvat')).toBeTruthy();
    expect(within(menu).getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(state.calls).toContain('GET /settings');
  });

  it('takes the person back to the page they were trying to open', async () => {
    signedOut();
    const user = await renderApp('/settings');
    await screen.findByLabelText('Email');
    await signIn(user);
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeTruthy();
  });

  it('"Keep me signed in" is sent to the server; by default it is not', async () => {
    signedOut();
    let user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await signIn(user);
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    expect(sentBody('POST', '/auth/login').remember).toBe(false);
    cleanup(); signedOut(); installBackend({ user: null }); global.fetch.mockClear();
    user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await user.click(screen.getByLabelText('Keep me signed in on this device'));
    await signIn(user);
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    expect(sentBody('POST', '/auth/login').remember).toBe(true);
  });

  it('the account’s saved language is applied after sign-in', async () => {
    signedOut();
    state.signInLocale = 'hr';
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await signIn(user);
    expect(await screen.findByRole('heading', { level: 1, name: 'Dokumenti' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('hr');
    expect(localStorage.getItem('plain-language-locale')).toBe('hr');
  });

  it('the language can be changed before signing in, without calling the server', async () => {
    signedOut();
    const user = await renderApp('/login');
    await screen.findByLabelText('Email');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'hr');
    expect(await screen.findByRole('heading', { level: 1, name: 'Prijava' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('hr');
    expect(state.calls.some((c) => c.startsWith('PUT'))).toBe(false);
  });

  it('show-password toggles the field type; forgot-password explains what is (not) available', async () => {
    signedOut();
    const user = await renderApp('/login');
    const password = await screen.findByLabelText('Password');
    expect(password.type).toBe('password');
    await user.click(screen.getByLabelText('Show password'));
    expect(password.type).toBe('text');
    const forgot = screen.getByRole('button', { name: 'Forgot password?' });
    expect(forgot.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('forgot-info').hidden).toBe(true);
    await user.click(forgot);
    expect(forgot.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('forgot-info').hidden).toBe(false);
  });

  it('Google and SSO are visibly unavailable instead of pretending to work', async () => {
    signedOut();
    await renderApp('/login');
    const google = await screen.findByRole('button', { name: /Continue with Google/ });
    const sso = screen.getByRole('button', { name: /Continue with SSO/ });
    expect(google.disabled && sso.disabled).toBe(true);
    expect(within(google).getByText('Coming soon')).toBeTruthy();
  });

  it('sign out returns to the sign-in screen with a notice and resets comfort settings', async () => {
    const user = await renderApp('/');
    await screen.findByRole('heading', { name: 'Lease_Agreement_2026' });
    document.documentElement.dataset.fontSize = 'large';
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeTruthy();
    expect(screen.getByText('You have been signed out.')).toBeTruthy();
    expect(state.calls).toContain('POST /auth/logout');
    expect(document.documentElement.dataset.fontSize).toBe('medium');
    expect(screen.queryByText('Lease_Agreement_2026')).toBeNull();
  });

  it('a session that ends while the app is open sends the person to sign in, with the reason', async () => {
    const user = await renderApp('/settings');
    await user.click(await screen.findByLabelText('Large'));
    await waitFor(() => expect(state.calls).toContain('PUT /settings'));
    state.user = null; // the server forgets the session
    await user.click(screen.getByLabelText('Small'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeTruthy();
    expect(screen.getByText('Your session ended. Sign in again to continue.')).toBeTruthy();
  });

  it('server unreachable on start-up: says so and retries, instead of showing the sign-in screen', async () => {
    state.failNext = /GET \/auth\/me/; state.failNextResponse = 'network';
    const user = await renderApp('/');
    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1, name: 'Sign in' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('already signed in: opening /login goes straight to the app', async () => {
    await renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });
});

describe('create account (screen 01, second mode)', () => {
  it('validates every field in the browser first and focuses the first problem', async () => {
    signedOut();
    const user = await renderApp('/register');
    await user.click(await screen.findByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Enter your name.')).toBeTruthy();
    expect(screen.getByText('Enter your email address.')).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'));
    await user.type(screen.getByLabelText('Your name'), 'Bo');
    await user.type(screen.getByLabelText('Email'), 'bo@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(state.calls).not.toContain('POST /auth/register');
    expect(screen.getByLabelText('Password').getAttribute('aria-describedby')).toBe('password-error password-hint');
  });

  it('an email that is already registered is reported on the email field', async () => {
    signedOut();
    const user = await renderApp('/register');
    await user.type(await screen.findByLabelText('Your name'), 'Bo');
    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'long enough pass');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('An account with this email already exists. Try signing in.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  it('creates the account (sending the chosen language) and continues to role selection', async () => {
    signedOut();
    const user = await renderApp('/register', 'es');
    await user.type(await screen.findByLabelText('Tu nombre'), 'Bo Kovač');
    await user.type(screen.getByLabelText('Correo electrónico'), 'bo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'long enough pass');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Vamos a configurarlo' })).toBeTruthy();
    expect(sentBody('POST', '/auth/register')).toMatchObject({ display_name: 'Bo Kovač', email: 'bo@example.com', locale: 'es' });
    expect(screen.getByText('Paso 1 de 2')).toBeTruthy();
  });

  it('switching between Sign in and Create account keeps the visitor’s destination', async () => {
    signedOut();
    const user = await renderApp('/settings');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    await user.click(screen.getByRole('link', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Create account' })).toBeTruthy();
    await user.click(screen.getByRole('link', { name: 'Sign in' }));
    await user.type(await screen.findByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeTruthy();
  });
});

describe('role selection (screen 02)', () => {
  const newcomer = () => ({ id: 2, email: 'bo@example.com', display_name: 'Bo Kovač', role: null, onboarded: false, locale: 'en', reading_level: 6 });

  it('someone who has not finished it is sent here before the app', async () => {
    state.user = newcomer();
    await renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Let’s set you up' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(screen.queryByText('Lease_Agreement_2026')).toBeNull();
    expect(state.calls).not.toContain('GET /documents');
  });

  it('roles are one labelled group of radio buttons', async () => {
    state.user = newcomer();
    await renderApp('/onboarding');
    const group = await screen.findByRole('group', { name: 'Which best describes you?' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((radio) => radio.checked)).toEqual([false, false, false]);
    expect(within(group).getByRole('radio', { name: /Student/ })).toBeTruthy();
    expect(within(group).getByRole('radio', { name: /Average adult/ })).toBeTruthy();
    expect(within(group).getByRole('radio', { name: /Professional/ })).toBeTruthy();
  });

  it('Next without a choice explains what to do and focuses the first option', async () => {
    state.user = newcomer();
    const user = await renderApp('/onboarding');
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert').textContent).toBe('Choose the option that describes you best.');
    expect(document.activeElement).toBe(screen.getAllByRole('radio')[0]);
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('role suggests a level; the slider is the person’s; Back keeps the choice', async () => {
    state.user = newcomer();
    const user = await renderApp('/onboarding');
    await user.click(await screen.findByRole('radio', { name: /Student/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const step = await screen.findByText('Step 2 of 2');
    expect(document.activeElement).toBe(step);
    const slider = screen.getByRole('slider', { name: 'Choose your reading complexity level' });
    expect(slider.value).toBe('8');
    expect(slider.getAttribute('aria-valuetext')).toBe('Grade 8 · Standard');
    expect(screen.getByText(/We suggest grade 8 for “Student”/)).toBeTruthy();

    fireEvent.change(slider, { target: { value: '5' } });
    expect(slider.getAttribute('aria-valuetext')).toBe('Grade 5 · Standard');
    fireEvent.change(slider, { target: { value: '3' } });
    expect(slider.getAttribute('aria-valuetext')).toBe('Grade 3 · Simple');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('radio', { name: /Student/ }).checked).toBe(true);
    await user.click(screen.getByRole('radio', { name: /Professional/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('slider').value).toBe('3'); // a slider the person moved is not overwritten by the suggestion
    expect(screen.getByText(/We suggest grade 10 for “Professional”/)).toBeTruthy();
  });

  it('Get started saves role and level, then opens the app', async () => {
    state.user = newcomer();
    const user = await renderApp('/onboarding');
    await user.click(await screen.findByRole('radio', { name: /Student/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Get started' }));
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
    expect(sentBody('PUT', '/auth/profile')).toEqual({ role: 'student', reading_level: 8 });
    expect(state.user.onboarded).toBe(true);
  });

  it('a failed save keeps the person on step 2 with a translated message and a working button', async () => {
    state.user = newcomer();
    const user = await renderApp('/onboarding');
    await user.click(await screen.findByRole('radio', { name: /Average adult/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    state.failNext = /PUT \/auth\/profile/; state.failNextResponse = new Response('oops', { status: 500 });
    await user.click(await screen.findByRole('button', { name: 'Get started' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The server is not responding. Try again in a moment.'));
    expect(screen.getByRole('button', { name: 'Get started' }).disabled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Get started' }));
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('"Not you? Sign out" is available while setting up', async () => {
    state.user = newcomer();
    const user = await renderApp('/onboarding');
    await user.click(await screen.findByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeTruthy();
  });

  it('someone who is already set up cannot get stuck here: /onboarding opens the app', async () => {
    await renderApp('/onboarding');
    expect(await screen.findByRole('heading', { name: 'Lease_Agreement_2026' })).toBeTruthy();
  });

  it('it can be reopened from Settings (?edit=1), prefilled, and returns to Settings', async () => {
    const user = await renderApp('/settings');
    expect(await screen.findByText('ana@example.com')).toBeTruthy();
    const account = screen.getByRole('heading', { level: 2, name: 'Account' }).closest('section');
    expect(within(account).getByText('Ana Horvat')).toBeTruthy();
    expect(within(account).getByText('Average adult')).toBeTruthy();
    await user.click(within(account).getByRole('link', { name: 'Change role and reading level' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Update your profile' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Average adult/ }).checked).toBe(true);
    await user.click(screen.getByRole('radio', { name: /Professional/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('slider').value).toBe('6'); // editing keeps their existing level
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeTruthy();
    expect(sentBody('PUT', '/auth/profile')).toEqual({ role: 'professional', reading_level: 6 });
    expect(await screen.findByText('Professional')).toBeTruthy();
  });

  it('Settings: the reading level set there is what the edit screen starts from', async () => {
    const user = await renderApp('/settings');
    const slider = await screen.findByRole('slider', { name: /Reading level/ });
    fireEvent.change(slider, { target: { value: '9' } });
    fireEvent.blur(slider);
    await waitFor(() => expect(state.settings.reading_level).toBe(9));
    await user.click(await screen.findByRole('link', { name: 'Change role and reading level' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    expect(screen.getByRole('slider').value).toBe('9');
  });
});

describe('screens 01 and 02 in Croatian', () => {
  it('sign-in is translated, including its validation messages', async () => {
    signedOut();
    const user = await renderApp('/login', 'hr');
    expect(await screen.findByRole('heading', { level: 1, name: 'Prijava' })).toBeTruthy();
    expect(screen.getByLabelText('E-pošta')).toBeTruthy();
    expect(screen.getByLabelText('Lozinka')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Prijavi se' }));
    expect(screen.getByText('Unesite svoju adresu e-pošte.')).toBeTruthy();
    expect(document.documentElement.lang).toBe('hr');
    expect(document.title).toBe('Prijava · Capa de lenguaje claro'.replace('Capa de lenguaje claro', i18n.t('appName')));
  });

  it('role selection is translated', async () => {
    state.user = { id: 2, email: 'bo@example.com', display_name: 'Bo', role: null, onboarded: false, locale: 'hr', reading_level: 6 };
    await renderApp('/onboarding', 'hr');
    expect(await screen.findByText('Korak 1 od 2')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Što vas najbolje opisuje?' })).toBeTruthy();
  });
});

describe('header reading level (screen 03)', () => {
  it('shows the account’s level, saves a change, and Settings follows it', async () => {
    state.user.reading_level = 8; state.settings.reading_level = 8;
    const user = await renderApp('/settings');
    const select = await screen.findByRole('combobox', { name: 'Reading level' });
    expect(select.value).toBe('8');
    await user.selectOptions(select, '11');
    await waitFor(() => expect(state.settings.reading_level).toBe(11));
    expect(sentBody('PUT', '/settings')).toEqual({ reading_level: 11 });
    await waitFor(() => expect(screen.getByRole('slider', { name: /Reading level/ }).value).toBe('11'));
  });

  it('a failed save snaps back and says why', async () => {
    const user = await renderApp('/');
    const select = await screen.findByRole('combobox', { name: 'Reading level' });
    state.failNext = /PUT \/settings/; state.failNextResponse = new Response('oops', { status: 500 });
    await user.selectOptions(select, '9');
    expect((await screen.findByRole('status', { name: 'Notification' })).textContent).toBe('The server is not responding. Try again in a moment.');
    expect(select.value).toBe('6');
  });
});
