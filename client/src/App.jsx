import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { ReaderPage } from './pages/ReaderPage.jsx';
import { PrototypeProvider } from './hooks/usePrototype.jsx';
import { SummaryPage } from './pages/SummaryPage.jsx';
import { ActionsPage } from './pages/ActionsPage.jsx';
import { FocusPage } from './pages/FocusPage.jsx';
import { ExportPage } from './pages/ExportPage.jsx';
import { ScannerPage } from './pages/ScannerPage.jsx';
import { UnreadablePage } from './pages/UnreadablePage.jsx';
import { NotFoundPage } from './components/notfound/NotFoundPage.jsx';

export function App() {
  return (
    <PrototypeProvider>
      <Routes>
        <Route element={<AppLayout />}>
        <Route path="/" element={<DocumentsPage />} />
        <Route path="/documents/:id/summary" element={<SummaryPage />} />
        <Route path="/documents/:id/reader" element={<ReaderPage />} />
        <Route path="/documents/:id/jargon" element={<ReaderPage initialPanel="jargon" />} />
        <Route path="/documents/:id/verify" element={<ReaderPage initialPanel="verify" />} />
        <Route path="/documents/:id/qa" element={<ReaderPage initialPanel="qa" />} />
        <Route path="/documents/:id/focus" element={<FocusPage />} />
        <Route path="/documents/:id/actions" element={<ActionsPage />} />
        <Route path="/documents/:id/export" element={<ExportPage />} />
        <Route path="/documents/:id/scanner" element={<ScannerPage />} />
        <Route path="/documents/:id/unreadable" element={<UnreadablePage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </PrototypeProvider>
  );
}
