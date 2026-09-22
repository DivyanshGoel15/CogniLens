/**
 * CogniLens Backend API Client
 * Connects frontend client to Python FastAPI services (server/app/main.py)
 * at http://localhost:8000/api with automatic fallback support.
 */

const API_BASE_URL = 'http://localhost:8000/api';

export interface BackendChatMessage {
  role: string;
  content: string;
  citations?: any[];
}

export interface BackendChatRequest {
  message: string;
  history?: BackendChatMessage[];
  intent?: string;
  difficulty?: string;
}

export interface BackendChatResponse {
  message: string;
  intent: string;
  topic: string;
  citations: any[];
  structured_payload?: any;
  latency_ms: number;
  provider: string;
}

export interface BackendQuizRequest {
  topic: string;
  num_questions?: number;
  difficulty?: string;
  top_k?: number;
}

export interface BackendExplanationRequest {
  topic: string;
  difficulty?: string;
  top_k?: number;
}

export interface BackendFlashcardRequest {
  topic: string;
  num_cards?: number;
  top_k?: number;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** Health check to verify if Python backend FastAPI server is online */
  async isServerOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Send chat turn to backend ChatEngine API */
  async sendChat(payload: BackendChatRequest): Promise<BackendChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend chat error ${res.status}: ${errText}`);
    }

    return await res.json();
  }

  /** Request grounded structured quiz from backend QuizGenerator */
  async generateQuiz(payload: BackendQuizRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: payload.topic,
        num_questions: payload.num_questions || 5,
        difficulty: payload.difficulty || 'Medium',
        top_k: payload.top_k || 4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend quiz error ${res.status}: ${errText}`);
    }

    return await res.json();
  }

  /** Request concept explanation from backend ExplanationGenerator */
  async generateExplanation(payload: BackendExplanationRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: payload.topic,
        difficulty: payload.difficulty || 'Intermediate',
        top_k: payload.top_k || 4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend explanation error ${res.status}: ${errText}`);
    }

    return await res.json();
  }

  /** Request active recall flashcards from backend FlashcardGenerator */
  async generateFlashcards(payload: BackendFlashcardRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: payload.topic,
        num_cards: payload.num_cards || 5,
        top_k: payload.top_k || 4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend flashcards error ${res.status}: ${errText}`);
    }

    return await res.json();
  }

  /** Fetch indexed document metadata from backend DocumentStore */
  async getDocuments(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/documents`, { method: 'GET' });
    if (!res.ok) throw new Error(`Backend documents error ${res.status}`);
    return await res.json();
  }

  /** Upload document to backend DocumentStore */
  async uploadDocument(file: File, course: string = 'General'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course', course);

    const res = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error(`Backend upload error ${res.status}`);
    return await res.json();
  }
}

export const apiClient = new APIClient();
