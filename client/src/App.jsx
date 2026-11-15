import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.jsx';
import { AuthShell } from './components/AuthShell.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { DocumentScreenPage } from './pages/DocumentScreenPage.jsx';
import { ReaderPage } from './pages/ReaderPage.jsx';
import { GlossaryPage } from './pages/GlossaryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { AuthProvider } from './lib/auth.jsx';

// Keeps <html lang> in step with the chosen language (screen readers pick the voice from it).
function LanguageSync() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || 'en';
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}

export function App() {
  return (
    <AuthProvider>
      <LanguageSync />
      <Routes>
        {/* Before the app: sign in, create account, role selection (screens 01 and 02) */}
        <Route element={<AuthShell />}>
          <Route path="/login" element={<LoginPage key="login" mode="login" />} />
          <Route path="/register" element={<LoginPage key="register" mode="register" />} />
          <Route element={<RequireAuth allowIncomplete />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
        </Route>

        {/* The app itself: everything here needs a signed-in, onboarded user */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DocumentsPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/documents/:id/reader" element={<ReaderPage />} />
            <Route path="/documents/:id/:view" element={<DocumentScreenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
