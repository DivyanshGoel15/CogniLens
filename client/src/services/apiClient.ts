/**
 * CogniLens Backend API Client
 * Connects frontend client to Python FastAPI services (server/app/main.py)
 * at /api (via Vite proxy or direct host) with automatic authentication and multi-user isolation.
 */

const API_BASE_URL = '/api';
const AUTH_TOKEN_KEY = 'cognilens_auth_token';

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

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  major: string;
  academicYear: string;
  avatarInitials: string;
  avatarBgColor: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUserProfile;
}

class APIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    try {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed saving token to localStorage', e);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem(AUTH_TOKEN_KEY);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    const t = this.getToken();
    if (t) {
      headers['Authorization'] = `Bearer ${t}`;
    }
    return headers;
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

  // ============================================================================
  // User Authentication & Forgot Password
  // ============================================================================
  async signup(data: {
    fullName: string;
    email: string;
    password: string;
    major?: string;
    academicYear?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed.' }));
      throw new Error(err.detail || `Signup error ${res.status}`);
    }

    const authData: AuthResponse = await res.json();
    this.setToken(authData.access_token);
    return authData;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials.' }));
      throw new Error(err.detail || `Login error ${res.status}`);
    }

    const authData: AuthResponse = await res.json();
    this.setToken(authData.access_token);
    return authData;
  }

  async getProfile(): Promise<AuthUserProfile> {
    const res = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) throw new Error('Unauthorized or session expired.');
    return await res.json();
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; dev_code?: string }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      throw new Error('Backend server is offline or unreachable. Please verify Python API server is running on port 8000.');
    }

    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        if (typeof errJson.detail === 'string') {
          detail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          detail = errJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        } else if (errJson.message) {
          detail = errJson.message;
        }
      } catch {
        if (res.status >= 500) {
          detail = 'Backend API server on port 8000 is unreachable. Please ensure the Python server is running.';
        }
      }
      throw new Error(detail || `Failed to dispatch reset code (HTTP ${res.status}).`);
    }

    return await res.json();
  }

  async resetPassword(payload: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email.trim(),
          code: payload.code.trim(),
          newPassword: payload.newPassword,
        }),
      });
    } catch {
      throw new Error('Backend server is offline or unreachable. Please verify Python API server is running on port 8000.');
    }

    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        if (typeof errJson.detail === 'string') {
          detail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          detail = errJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        } else if (errJson.message) {
          detail = errJson.message;
        }
      } catch {
        if (res.status >= 500) {
          detail = 'Backend API server on port 8000 is unreachable.';
        }
      }
      throw new Error(detail || `Password reset failed (HTTP ${res.status}).`);
    }

    return await res.json();
  }

  // ============================================================================
  // Chat & AI Generation
  // ============================================================================
  async sendChat(payload: BackendChatRequest): Promise<BackendChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend chat error ${res.status}: ${errText}`);
    }

    return await res.json();
  }

  async generateQuiz(payload: BackendQuizRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/quiz`, {
      method: 'POST',
      headers: this.getHeaders(),
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

  async generateExplanation(payload: BackendExplanationRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/explain`, {
      method: 'POST',
      headers: this.getHeaders(),
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

  async generateFlashcards(payload: BackendFlashcardRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/flashcards`, {
      method: 'POST',
      headers: this.getHeaders(),
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

  // ============================================================================
  // Document Management
  // ============================================================================
  async getDocuments(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/documents`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Backend documents error ${res.status}`);
    return await res.json();
  }

  async uploadDocument(file: File, course: string = 'General'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course', course);

    const headers: Record<string, string> = {};
    const t = this.getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;

    const res = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error(`Backend upload error ${res.status}`);
    return await res.json();
  }

  async deleteDocument(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // ============================================================================
  // Progress & Activities
  // ============================================================================
  async getProgress(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/progress`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Progress error ${res.status}`);
    return await res.json();
  }

  async updateProgress(payload: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/progress/update`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Update progress error ${res.status}`);
    return await res.json();
  }

  // ============================================================================
  // Study Plan
  // ============================================================================
  async getStudyPlan(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/study-plan`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Study plan fetch error ${res.status}`);
    return await res.json();
  }

  async generateStudyPlan(data: {
    courses: string[];
    weak_topics: string[];
    available_hours: number;
    goal: string;
  }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/study-plan`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Study plan generation error ${res.status}`);
    return await res.json();
  }

  async toggleStudyPlanTask(taskId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/study-plan/task/${taskId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Task update error ${res.status}`);
    return await res.json();
  }

  // ============================================================================
  // Flashcard Decks & Spaced Repetition
  // ============================================================================
  async getFlashcardDecks(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/flashcards/decks`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Flashcard decks error ${res.status}`);
    return await res.json();
  }

  async saveFlashcardDeck(deck: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/flashcards/decks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(deck),
    });
    if (!res.ok) throw new Error(`Save flashcard deck error ${res.status}`);
    return await res.json();
  }

  async deleteFlashcardDeck(deckId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/flashcards/decks/${deckId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async updateCardConfidence(deckId: string, cardId: string, confidence: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/flashcards/card/confidence`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ deck_id: deckId, card_id: cardId, confidence }),
    });
    if (!res.ok) throw new Error(`Update card confidence error ${res.status}`);
    return await res.json();
  }

  // ============================================================================
  // Quiz History & Submissions
  // ============================================================================
  async getQuizHistory(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/quiz/history`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Quiz history error ${res.status}`);
    return await res.json();
  }

  async submitQuiz(payload: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/quiz/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Submit quiz error ${res.status}`);
    return await res.json();
  }
}

export const apiClient = new APIClient();
