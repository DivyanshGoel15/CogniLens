import React, { createContext, useContext, ReactNode } from 'react';
import { useApp } from './AppContext';
import { useToast } from './ToastContext';

export interface DemoScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  action: () => void;
}

interface DemoContextType {
  scenarios: DemoScenario[];
  runScenario: (id: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setCurrentRoute, setPrefilledPrompt, openDocumentViewer, startQuiz } = useApp();
  const { showToast } = useToast();

  const scenarios: DemoScenario[] = [
    {
      id: 'demo-deadlock',
      name: '1. RAG Grounding: Deadlock Coffman Conditions',
      category: 'Operating Systems',
      description: 'Simulates grounded AI query referencing OS_Unit3.pdf (p. 18 & 42) with citations.',
      action: () => {
        setCurrentRoute('ai-tutor');
        setPrefilledPrompt('Explain deadlock using my OS notes.');
        showToast('Demo Flow: OS Grounding Loaded', 'Submitting grounded prompt with verified citations', 'info');
      }
    },
    {
      id: 'demo-diagram',
      name: '2. Multimodal: CPU Scheduling Diagram Analysis',
      category: 'Operating Systems',
      description: 'Demonstrates visual AI understanding of Gantt charts & Round Robin timeline.',
      action: () => {
        setCurrentRoute('image-analysis');
        showToast('Demo Flow: Diagram Analysis', 'Loaded visual inspection workspace with bounding boxes', 'info');
      }
    },
    {
      id: 'demo-quiz-loop',
      name: '3. Full Learning Loop: Quiz & Weak Topic Remediation',
      category: 'Machine Learning',
      description: 'Launches adaptive quiz on Linear Regression with immediate conceptual feedback.',
      action: () => {
        startQuiz({
          course: 'Machine Learning',
          topic: 'Linear Regression',
          questionCount: 5,
          difficulty: 'intermediate',
          questionType: 'all'
        });
        showToast('Demo Flow: Adaptive Quiz Initiated', 'Test your knowledge on cost functions & gradient descent', 'info');
      }
    },
    {
      id: 'demo-doc-viewer',
      name: '4. Interactive Reader: Text HUD & Citations',
      category: 'Document Workspace',
      description: 'Opens OS_Unit3_Deadlocks.pdf at page 42 with interactive selection HUD.',
      action: () => {
        openDocumentViewer('mat-os-unit3', 42);
        showToast('Demo Flow: Reader Page 42', 'Highlight text to explain or generate instant quiz', 'info');
      }
    }
  ];

  const runScenario = (id: string) => {
    const found = scenarios.find(s => s.id === id);
    if (found) {
      found.action();
    }
  };

  return (
    <DemoContext.Provider value={{ scenarios, runScenario }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};
