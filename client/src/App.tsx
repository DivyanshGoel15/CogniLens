import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

// New screens
import LandingPage from './screens/LandingPage';
import SignIn from './screens/SignIn';
import SignUp from './screens/SignUp';


// ======================================================
// EXISTING COGNILENS APPLICATION
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
// APP SHELL
// ======================================================

const CogniLensApp: React.FC = () => {
  return (
    <AppProvider>
      <DemoProvider>
        <MainContent />
      </DemoProvider>
    </AppProvider>
  );
};


// ======================================================
// ROOT APP
// ======================================================

export function App() {
  return (
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
              MAIN COGNILENS APP
             ========================= */}
          <Route
            path="/app/*"
            element={<CogniLensApp />}
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
  );
}

export default App;