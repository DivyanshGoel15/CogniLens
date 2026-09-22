import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import { DemoProvider } from './context/DemoContext';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { DashboardScreen } from './screens/DashboardScreen';
import { AITutorScreen } from './screens/AITutorScreen';
import { MaterialsScreen } from './screens/MaterialsScreen';
import { DocumentViewerScreen } from './screens/DocumentViewerScreen';
import { ImageAnalysisScreen } from './screens/ImageAnalysisScreen';
import { QuizScreen } from './screens/QuizScreen';
import { FlashcardsScreen } from './screens/FlashcardsScreen';
import { StudyPlanScreen } from './screens/StudyPlanScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';

// Auth & Landing screens
import LandingPage from './screens/LandingPage';
import SignIn from './screens/SignIn';
import SignUp from './screens/SignUp';


// ======================================================
// MAIN DASHBOARD CONTENT (uses AppContext route state)
// ======================================================

const MainContent: React.FC = () => {
  const { currentRoute } = useApp();

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Workspace */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Header />

        {/* Dynamic Screen */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {currentRoute === 'dashboard' && <DashboardScreen />}

          {currentRoute === 'ai-tutor' && <AITutorScreen />}

          {currentRoute === 'materials' && <MaterialsScreen />}

          {currentRoute === 'document-viewer' && (
            <DocumentViewerScreen />
          )}

          {currentRoute === 'image-analysis' && (
            <ImageAnalysisScreen />
          )}

          {currentRoute === 'quiz' && <QuizScreen />}

          {currentRoute === 'flashcards' && <FlashcardsScreen />}

          {currentRoute === 'study-plan' && <StudyPlanScreen />}

          {currentRoute === 'progress' && <ProgressScreen />}

          {currentRoute === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  );
};


// ======================================================
// AUTH GUARD — Redirects unauthenticated users to /signin
// Also handles logout → navigate to /
// ======================================================

const AuthGuard: React.FC = () => {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <DemoProvider>
      <MainContent />
    </DemoProvider>
  );
};


// ======================================================
// ROOT APP — AppProvider wraps everything so auth is
// available in all routes including SignIn/SignUp
// ======================================================

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>

            {/* =========================
                LANDING PAGE
               ========================= */}
            <Route
              path="/"
              element={<LandingPage />}
            />

            {/* =========================
                SIGN IN
               ========================= */}
            <Route
              path="/signin"
              element={<SignIn />}
            />

            {/* =========================
                SIGN UP
               ========================= */}
            <Route
              path="/signup"
              element={<SignUp />}
            />

            {/* =========================
                MAIN COGNILENS APP (Protected)
               ========================= */}
            <Route
              path="/app/*"
              element={<AuthGuard />}
            />

            {/* =========================
                UNKNOWN ROUTE
               ========================= */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;