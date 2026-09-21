export interface SourceReference {
  id: string;
  documentId: string;
  documentTitle: string;
  filename: string;
  page?: number;
  snippet: string;
  confidence?: number;
  highlightCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AgentActivityStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
  durationMs?: number;
}

export interface AgentTaskActivity {
  taskTitle: string;
  status: 'running' | 'completed' | 'idle';
  steps: AgentActivityStep[];
}

export interface MultimodalAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'audio';
  url?: string;
  size?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: MultimodalAttachment[];
  sources?: SourceReference[];
  agentActivity?: AgentTaskActivity;
  suggestedActions?: {
    id: string;
    label: string;
    actionType: 'create_quiz' | 'create_flashcards' | 'summarize' | 'explain_further' | 'open_source';
    payload?: any;
  }[];
  diagramData?: {
    title: string;
    imageUrl?: string;
    diagramType: 'cpu_scheduling' | 'neural_network' | 'linear_regression' | 'dbms_erd';
    keyInsights: string[];
  };
  isStreaming?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  courseTag: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinnedSources: string[]; // Material IDs
}
