import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MaterialSource } from '../types/material';
import { materialService } from '../services/materialService';
import { progressService } from '../services/progressService';
import { QuizConfig } from '../types/quiz';
import { UserProfile, INITIAL_USER_PROFILE, LearningProgressState } from '../types/progress';

export type AppRoute =
  | 'landing'
  | 'login'
  | 'signup'
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

const USER_PROFILE_KEY = 'cognilens_user_profile';
const AUTH_KEY = 'cognilens_is_authenticated';

interface AppContextType {
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  signup: (data: { fullName: string; email: string; major?: string; academicYear?: string }) => void;
  logout: () => void;
  materials: MaterialSource[];
  selectedMaterial: MaterialSource | null;
  setSelectedMaterial: (mat: MaterialSource | null) => void;
  selectedPage: number;
  setSelectedPage: (page: number) => void;
  openDocumentViewer: (materialId: string, page?: number) => Promise<void>;
  recordDocumentRead: (material: MaterialSource, page: number) => Promise<void>;
  refreshMaterials: () => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
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
  userProfile: UserProfile;
  updateUserProfile: (newProfile: Partial<UserProfile>) => void;
  progress: LearningProgressState | null;
  refreshProgress: () => Promise<void>;
  recordDailyActivity: (label?: string) => void;
  newStudySessionSignal: number;
  startNewStudySession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse auth state', e);
    }
    return true; // Default to true so existing users enter dashboard smoothly
  });

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    return isAuthenticated ? 'dashboard' : 'landing';
  });

  const login = (email: string, name?: string) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(true));
    } catch (e) {
      console.warn('Failed to save auth state', e);
    }
    if (email) {
      updateUserProfile({
        email,
        fullName: name || userProfile.fullName || 'Student Member',
        avatarInitials: (name || userProfile.fullName || 'S').charAt(0).toUpperCase()
      });
    }
    setCurrentRoute('dashboard');
  };

  const signup = (data: { fullName: string; email: string; major?: string; academicYear?: string }) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(true));
    } catch (e) {
      console.warn('Failed to save auth state', e);
    }
    updateUserProfile({
      fullName: data.fullName,
      email: data.email,
      major: data.major || 'Computer Science',
      academicYear: data.academicYear || 'Year 3',
      avatarInitials: data.fullName.charAt(0).toUpperCase()
    });
    setCurrentRoute('dashboard');
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(false));
    } catch (e) {
      console.warn('Failed to save auth state', e);
    }
    setCurrentRoute('landing');
  };
  const [materials, setMaterials] = useState<MaterialSource[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSource | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_USER_PROFILE, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse user profile from localStorage', e);
    }
    return INITIAL_USER_PROFILE;
  });

  const [progress, setProgress] = useState<LearningProgressState | null>(null);

  const refreshProgress = async () => {
    const res = await progressService.getProgress();
    if (res.success) {
      setProgress(res.data);
    }
  };

  const recordDailyActivity = (label?: string) => {
    const updated = progressService.recordDailyActivity(label);
    setProgress(updated);
  };

  const updateUserProfile = (updatedFields: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save user profile to localStorage', e);
      }
      return updated;
    });
  };

  const refreshMaterials = async () => {
    const res = await materialService.getMaterials();
    if (res.success) {
      setMaterials(res.data);
      if (!selectedMaterial && res.data.length > 0) {
        setSelectedMaterial(res.data[0]);
      }
    }
  };

  const deleteMaterial = async (id: string) => {
    await materialService.deleteMaterial(id);
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    if (selectedMaterial?.id === id) {
      setSelectedMaterial(updated[0] || null);
    }
  };

  useEffect(() => {
    refreshMaterials();
    refreshProgress();
  }, []);

  const openDocumentViewer = async (materialId: string, page: number = 1) => {
    const res = await materialService.getMaterials();
    const currentList = res.success ? res.data : materials;
    setMaterials(currentList);

    const found = currentList.find(m => m.id === materialId);
    if (found) {
      setSelectedMaterial(found);
      setSelectedPage(page);
      setCurrentRoute('document-viewer');

      // Record reading progress in progressService
      const totalPages = found.pagesCount || 10;
      const matchedSec = found.sections?.find(s => s.page === page);
      await progressService.recordDocumentProgress(
        found.id,
        found.title,
        found.filename,
        found.course,
        page,
        totalPages,
        matchedSec ? matchedSec.title : `${found.title} — Page ${page}`
      );
      refreshProgress();
    }
  };

  const recordDocumentRead = async (material: MaterialSource, page: number) => {
    const totalPages = material.pagesCount || 10;
    const matchedSec = material.sections?.find(s => s.page === page);
    await progressService.recordDocumentProgress(
      material.id,
      material.title,
      material.filename,
      material.course,
      page,
      totalPages,
      matchedSec ? matchedSec.title : `${material.title} — Page ${page}`
    );
    refreshProgress();
  };

  const startQuiz = (config: QuizConfig) => {
    setActiveQuizConfig(config);
    setCurrentRoute('quiz');
  };

  const [newStudySessionSignal, setNewStudySessionSignal] = useState<number>(0);

  const startNewStudySession = () => {
    setCurrentRoute('ai-tutor');
    setNewStudySessionSignal(Date.now());
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
        isAuthenticated,
        login,
        signup,
        logout,
        materials,
        selectedMaterial,
        setSelectedMaterial,
        selectedPage,
        setSelectedPage,
        openDocumentViewer,
        recordDocumentRead,
        refreshMaterials,
        deleteMaterial,
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
        setPrefilledPrompt,
        userProfile,
        updateUserProfile,
        progress,
        refreshProgress,
        recordDailyActivity,
        newStudySessionSignal,
        startNewStudySession
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

