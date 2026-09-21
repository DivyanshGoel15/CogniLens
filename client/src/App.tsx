import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import { DemoProvider } from './context/DemoContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DemoBar } from './components/layout/DemoBar';

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

const MainContent: React.FC = () => {
  const { currentRoute } = useApp();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Refined Collapsible Sidebar */}
      <Sidebar />

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Interactive Judge / Teacher Demo Presets Bar */}
        <DemoBar />

        {/* Global Workspace Header */}
        <Header />

        {/* Dynamic Screen View */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {currentRoute === 'dashboard' && <DashboardScreen />}
          {currentRoute === 'ai-tutor' && <AITutorScreen />}
          {currentRoute === 'materials' && <MaterialsScreen />}
          {currentRoute === 'document-viewer' && <DocumentViewerScreen />}
          {currentRoute === 'image-analysis' && <ImageAnalysisScreen />}
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

export function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <DemoProvider>
          <MainContent />
        </DemoProvider>
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
