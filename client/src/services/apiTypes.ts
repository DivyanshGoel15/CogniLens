import { SourceReference, AgentTaskActivity } from '../types/chat';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    latencyMs: number;
    tokensUsed?: number;
    model?: string;
  };
}

export interface StructuredAgentResponse {
  answer: string;
  sources: SourceReference[];
  agentActivity: AgentTaskActivity;
  suggestedActions: {
    id: string;
    label: string;
    actionType: 'create_quiz' | 'create_flashcards' | 'summarize' | 'explain_further' | 'open_source';
    payload?: any;
  }[];
  confidence: number;
  relatedTopics: string[];
}
