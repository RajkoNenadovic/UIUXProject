import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { DocumentScreenPage } from './pages/DocumentScreenPage.jsx';
import { ReaderPage } from './pages/ReaderPage.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DocumentsPage />} />
        <Route path="/documents/:id/reader" element={<ReaderPage />} />
        <Route path="/documents/:id/:view" element={<DocumentScreenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
