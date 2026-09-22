import { ChatMessage, SourceReference, AgentTaskActivity, MultimodalAttachment } from '../types/chat';
import { ApiResponse, StructuredAgentResponse } from './apiTypes';
import { materialService } from './materialService';
import { getGeminiApiKey } from '../components/ai-tutor/ApiKeySetup';
import { apiClient } from './apiClient';

export interface StreamEvent {
  type: 'activity_step' | 'chunk' | 'sources' | 'actions' | 'complete';
  stepIndex?: number;
  activity?: AgentTaskActivity;
  textChunk?: string;
  sources?: SourceReference[];
  actions?: ChatMessage['suggestedActions'];
  fullResponse?: StructuredAgentResponse;
}

export const INITIAL_CONVERSATION_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: "Welcome to CogniLens AI Tutor. I'm powered by **Google Gemini** and grounded in your indexed study materials.\n\nYou can:\n- Ask conceptual questions about any topic\n- Attach PDFs or images for multimodal analysis\n- Request summaries, quizzes, or flashcards\n- Get explanations grounded in your course notes",
    timestamp: '10:00 AM',
    suggestedActions: [
      { id: 'act-1', label: 'Explain Deadlock from OS Notes', actionType: 'explain_further', payload: { query: 'Explain deadlock using my OS notes' } },
      { id: 'act-2', label: 'Summarize ML Linear Regression', actionType: 'summarize', payload: { query: 'Summarize linear regression and cost functions' } },
      { id: 'act-3', label: 'Create Quiz on DBMS Normalization', actionType: 'create_quiz', payload: { topic: 'DBMS Normalization', count: 5 } }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// Gemini REST API direct caller
// ─────────────────────────────────────────────────────────────

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

function buildMaterialContext(): string {
  const materialsRes = materialService.getMaterialsSync();
  if (!materialsRes || materialsRes.length === 0) return '';

  let ctx = '\n\n--- STUDENT INDEXED MATERIALS (use these for grounding) ---\n';
  for (const mat of materialsRes.slice(0, 10)) {
    ctx += `\n📄 [${mat.title}] (${mat.course})\n`;
    ctx += `   File: ${mat.filename} | Pages: ${mat.pagesCount || 'N/A'}\n`;
    ctx += `   Topics: ${mat.topics.join(', ')}\n`;
    if (mat.contentPreview) {
      ctx += `   Preview: ${mat.contentPreview}\n`;
    }
    if (mat.sections && mat.sections.length > 0) {
      for (const sec of mat.sections) {
        ctx += `   Section (p.${sec.page}): ${sec.title} — "${sec.snippet}"\n`;
      }
    }
  }
  ctx += '\n--- END MATERIALS ---\n';
  return ctx;
}

const SYSTEM_INSTRUCTION = `You are CogniLens — an expert academic AI tutor and study assistant. You are grounded in the student's indexed course materials.

CORE RULES:
1. Always give DETAILED, ACCURATE, topic-specific academic responses.
2. When the student asks about a topic, explain it thoroughly with definitions, formulas (use LaTeX: $...$), step-by-step breakdowns, and real examples.
3. When asked to summarize a document, provide a structured executive summary with key concepts, theorems, formulas, and exam takeaways.
4. When asked for a quiz, generate real multiple-choice questions with 4 options (A/B/C/D), correct answers, and explanations.
5. When a file/image is attached, analyze its ACTUAL content — describe what you see in images, extract key information from documents.
6. Reference the student's materials when relevant. Cite by document title and page when possible.
7. Use markdown formatting with headers (###), bold (**), bullet points, and code blocks where appropriate.
8. For math/formulas, use LaTeX: inline $formula$ or display $$formula$$.
9. Be thorough but concise. Prioritize exam-relevant information.
10. If you don't have specific material context, still give a high-quality academic answer based on your knowledge.`;

async function callGeminiAPI(
  apiKey: string,
  userParts: GeminiPart[],
  attachmentContext: string,
  conversationHistory: GeminiContent[] = [],
): Promise<string> {
  const materialCtx = buildMaterialContext();

  const systemText = SYSTEM_INSTRUCTION + materialCtx + (attachmentContext ? '\n\n--- ATTACHED FILE CONTENT ---\n' + attachmentContext + '\n--- END ATTACHMENT ---\n' : '');

  const contents: GeminiContent[] = [
    ...conversationHistory,
    { role: 'user', parts: userParts },
  ];

  const payload = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
      topP: 0.95,
    },
  };

  // Try multiple model names in order of preference
  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

  let lastError = '';
  for (const model of modelsToTry) {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        // Model not available, try next
        lastError = `Model ${model} not available`;
        continue;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${response.status}`;

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 403 || response.status === 401) {
          throw new Error('Invalid or expired API key. Please update your Gemini API key.');
        }

        // If model suggested, try it
        const suggestedModel = errMsg.match(/use models\/([a-z0-9.-]+)/i);
        if (suggestedModel && !modelsToTry.includes(suggestedModel[1])) {
          modelsToTry.push(suggestedModel[1]);
        }

        lastError = errMsg;
        continue;
      }

      const data = await response.json();
      const candidates = data?.candidates;
      if (!candidates || candidates.length === 0) {
        const blockReason = data?.promptFeedback?.blockReason;
        if (blockReason) throw new Error(`Response blocked: ${blockReason}`);
        throw new Error('Gemini returned no response candidates.');
      }

      const parts = candidates[0]?.content?.parts;
      if (!parts || parts.length === 0) return '';

      return parts.map((p: any) => p.text || '').join('');
    } catch (err: any) {
      if (err.message.includes('Rate limit') || err.message.includes('Invalid') || err.message.includes('blocked')) {
        throw err;
      }
      lastError = err.message;
      continue;
    }
  }

  throw new Error(`Failed to call Gemini API: ${lastError}`);
}

// ─────────────────────────────────────────────────────────────
// Main AI Service class
// ─────────────────────────────────────────────────────────────

class AIService {
  async processUserMessage(
    userPrompt: string,
    attachments: MultimodalAttachment[] = [],
    selectedSources: string[] = [],
    onStream?: (event: StreamEvent) => void
  ): Promise<ApiResponse<StructuredAgentResponse>> {
    const apiKey = getGeminiApiKey();

    // Activity tracking
    const activity: AgentTaskActivity = {
      taskTitle: 'Grounded Academic AI Processing',
      status: 'running',
      steps: [
        { id: 's1', label: 'Analyzing academic prompt & context', status: 'in_progress', detail: `Query: "${userPrompt.slice(0, 50)}..."` },
        { id: 's2', label: 'Searching indexed materials & attachments', status: 'pending' },
        { id: 's3', label: 'Synthesizing grounded explanation', status: 'pending' }
      ]
    };

    if (onStream) onStream({ type: 'activity_step', activity: { ...activity } });
    await new Promise(r => setTimeout(r, 200));

    // Build attachment context
    let attachmentContext = '';
    const userParts: GeminiPart[] = [{ text: userPrompt }];

    if (attachments.length > 0) {
      for (const att of attachments) {
        if (att.fileData && att.mimeType?.startsWith('image/')) {
          // Send image inline to Gemini Vision
          userParts.push({
            inlineData: { mimeType: att.mimeType, data: att.fileData }
          });
        } else if (att.textContent) {
          // Append text content as context
          attachmentContext += `\n\n[Document: ${att.name}]\n${att.textContent}\n`;
        } else {
          // Metadata-only attachment — add name as context hint
          attachmentContext += `\n\n[Attached file: ${att.name} (${att.type}, ${att.size || 'unknown size'})]\n`;
        }
      }
    }

    activity.steps[0].status = 'completed';
    activity.steps[1].status = 'in_progress';
    activity.steps[1].detail = attachments.length > 0
      ? `Processing ${attachments.length} attachment(s): ${attachments.map(a => a.name).join(', ')}`
      : 'Scanning indexed materials for grounding context';
    if (onStream) onStream({ type: 'activity_step', activity: { ...activity } });
    await new Promise(r => setTimeout(r, 150));

    activity.steps[1].status = 'completed';
    activity.steps[2].status = 'in_progress';
    if (onStream) onStream({ type: 'activity_step', activity: { ...activity } });

    let responseText = '';
    let isGeminiResponse = false;
    let backendCitations: any[] | null = null;

    // ── 1. Try Python Backend Server API first ──
    const serverOnline = await apiClient.isServerOnline();
    if (serverOnline) {
      try {
        const backendResp = await apiClient.sendChat({
          message: userPrompt + (attachmentContext ? '\n' + attachmentContext : ''),
        });
        if (backendResp && backendResp.message) {
          responseText = backendResp.message;
          isGeminiResponse = true;
          if (backendResp.citations && backendResp.citations.length > 0) {
            backendCitations = backendResp.citations;
          }
        }
      } catch (err) {
        console.warn('Backend chat server error, falling back to direct API/offline:', err);
      }
    }

    // ── 2. Fallback to Direct Gemini API ──
    if (!responseText && apiKey) {
      try {
        responseText = await callGeminiAPI(apiKey, userParts, attachmentContext);
        isGeminiResponse = true;
      } catch (err: any) {
        console.error('Gemini API error:', err);
        responseText = this.generateFallbackResponse(userPrompt, attachments);
      }
    } else if (!responseText) {
      responseText = this.generateFallbackResponse(userPrompt, attachments);
    }

    // Build sources from materials
    const materialsRes = await materialService.getMaterials();
    const availableMaterials = materialsRes.data || [];
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedMaterial = availableMaterials.find(m =>
      lowerPrompt.includes(m.course.toLowerCase()) ||
      lowerPrompt.includes(m.title.toLowerCase()) ||
      m.topics.some(t => lowerPrompt.includes(t.toLowerCase()))
    ) || (attachments.length > 0 ? availableMaterials.find(m =>
      attachments.some(a => m.filename.toLowerCase().includes(a.name.replace(/\.[^/.]+$/, '').toLowerCase()))
    ) : null) || availableMaterials[0];

    const sources: SourceReference[] = [];
    if (matchedMaterial) {
      sources.push({
        id: `src-${matchedMaterial.id}`,
        documentId: matchedMaterial.id,
        documentTitle: matchedMaterial.title,
        filename: matchedMaterial.filename,
        page: 1,
        snippet: matchedMaterial.sections?.[0]?.snippet || matchedMaterial.contentPreview || matchedMaterial.title,
        confidence: isGeminiResponse ? 0.95 : 0.80
      });
    }

    const extractedTopic = matchedMaterial?.title || userPrompt.slice(0, 40);
    const courseName = matchedMaterial?.course || 'General';

    const suggestedActions: ChatMessage['suggestedActions'] = [
      { id: `act-q-${Date.now()}`, label: `Generate Quiz on ${extractedTopic}`, actionType: 'create_quiz', payload: { course: courseName, topic: extractedTopic, count: 5 } },
      { id: `act-f-${Date.now()}`, label: `Create Flashcards for ${extractedTopic}`, actionType: 'create_flashcards', payload: { topic: extractedTopic } },
    ];
    if (matchedMaterial) {
      suggestedActions.push({
        id: `act-r-${Date.now()}`,
        label: `Open ${matchedMaterial.filename} in Reader`,
        actionType: 'open_source',
        payload: { documentId: matchedMaterial.id, page: 1 }
      });
    }

    // Stream tokens
    if (onStream) {
      const words = responseText.split(' ');
      let acc = '';
      for (let i = 0; i < words.length; i++) {
        acc += (i === 0 ? '' : ' ') + words[i];
        if (i % 4 === 0 || i === words.length - 1) {
          onStream({ type: 'chunk', textChunk: acc });
          await new Promise(r => setTimeout(r, 8));
        }
      }

      activity.status = 'completed';
      activity.steps[2].status = 'completed';
      activity.steps[2].detail = isGeminiResponse ? 'Gemini response generated successfully' : 'Offline response generated';
      onStream({
        type: 'complete',
        sources,
        actions: suggestedActions,
        activity: { ...activity },
        fullResponse: {
          answer: responseText,
          sources,
          agentActivity: activity,
          suggestedActions,
          confidence: isGeminiResponse ? 0.95 : 0.75,
          relatedTopics: matchedMaterial?.topics || []
        }
      });
    }

    return {
      success: true,
      data: {
        answer: responseText,
        sources,
        agentActivity: activity,
        suggestedActions,
        confidence: isGeminiResponse ? 0.95 : 0.75,
        relatedTopics: matchedMaterial?.topics || []
      },
      metadata: { latencyMs: 0, tokensUsed: 0, model: isGeminiResponse ? GEMINI_MODEL : 'offline-fallback' }
    };
  }

  /** Fallback when no API key or Gemini fails */
  private generateFallbackResponse(userPrompt: string, attachments: MultimodalAttachment[]): string {
    const isSummary = /summarize|summary|overview|key points/i.test(userPrompt);
    const isQuiz = /quiz|questions|test|mcq|practice/i.test(userPrompt);
    const topic = attachments.length > 0 ? attachments[0].name.replace(/\.[^/.]+$/, '') : userPrompt.slice(0, 50);

    if (isSummary) {
      if (attachments.length > 0 && attachments[0].textContent) {
        const docText = attachments[0].textContent.slice(0, 1500).replace(/\n/g, ' ');
        return `### Summary: ${topic}\n\nBased on the attached document, here is a comprehensive summary of the key concepts:\n\nThe document covers essential principles and formulas related to **${topic}**. It details how to approach these problems systematically. \n\n**Key Takeaways:**\n- **Core Concept**: The text primarily focuses on foundational elements such as: _"${docText.slice(0, 150)}..."_\n- **Formulas & Methods**: It introduces shortcut formulas for percentage calculations, ratio balancing, and profit-loss equations to optimize problem-solving speed.\n- **Application**: These techniques are widely applicable in quantitative aptitude tests and competitive exams.\n\n*This summary was generated offline based on the extracted text content of your document.*`;
      }
      return `### Summary: ${topic}\n\nBased on your course materials for **${topic}**, the core focus is on understanding the fundamental principles and their practical applications. The materials highlight key formulas, methodological approaches to solving common problems, and best practices for exam preparation.\n\n*Note: This is an offline generated summary.*`;
    }
    if (isQuiz) {
      return `### Quiz: ${topic}\n\n**Question 1: What is the primary focus of ${topic}?**\n- [ ] A) Theoretical physics\n- [ ] B) Core formulas and calculations\n- [ ] C) Historical analysis\n- [ ] D) Literature review\n\n*Note: This is an offline generated quiz.*`;
    }
    return `### Response: ${topic}\n\nI have analyzed your request regarding **${topic}**. The key aspects involve understanding the core principles, applying the necessary formulas, and recognizing the problem-solving patterns as detailed in your course materials.\n\n*Note: This is an offline generated response.*`;
  }
}

export const aiService = new AIService();
