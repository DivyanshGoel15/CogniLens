import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MaterialSource } from '../types/material';
import { materialService } from '../services/materialService';
import { QuizConfig } from '../types/quiz';

export type AppRoute =
  | 'dashboard'
  | 'ai-tutor'
  | 'materials'
  | 'document-viewer'
  | 'image-analysis'
  | 'quiz'
  | 'flashcards'
  | 'study-plan'
  | 'progress'
  | 'settings';

interface AppContextType {
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  materials: MaterialSource[];
  selectedMaterial: MaterialSource | null;
  selectedPage: number;
  openDocumentViewer: (materialId: string, page?: number) => void;
  refreshMaterials: () => Promise<void>;
  activeQuizConfig: QuizConfig | null;
  startQuiz: (config: QuizConfig) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  prefilledPrompt: string | null;
  setPrefilledPrompt: (prompt: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [materials, setMaterials] = useState<MaterialSource[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSource | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);

  const refreshMaterials = async () => {
    const res = await materialService.getMaterials();
    if (res.success) {
      setMaterials(res.data);
      if (!selectedMaterial && res.data.length > 0) {
        setSelectedMaterial(res.data[0]);
      }
    }
  };

  useEffect(() => {
    refreshMaterials();
  }, []);

  const openDocumentViewer = (materialId: string, page: number = 1) => {
    const found = materials.find(m => m.id === materialId);
    if (found) {
      setSelectedMaterial(found);
      setSelectedPage(page);
      setCurrentRoute('document-viewer');
    }
  };

  const startQuiz = (config: QuizConfig) => {
    setActiveQuizConfig(config);
    setCurrentRoute('quiz');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        materials,
        selectedMaterial,
        selectedPage,
        openDocumentViewer,
        refreshMaterials,
        activeQuizConfig,
        startQuiz,
        searchQuery,
        setSearchQuery,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        theme,
        toggleTheme,
        prefilledPrompt,
        setPrefilledPrompt
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
