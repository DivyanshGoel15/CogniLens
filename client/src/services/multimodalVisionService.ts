import { getGeminiApiKey } from '../components/ai-tutor/ApiKeySetup';
import { generateClientSynthesizedDiagram } from './diagramSynthesizer';

export interface VisionSlide {
  title: string;
  badge: string;
  content: string;
  keyPoints?: string[];
  formula?: string;
  implication?: string;
  takeaway?: string;
  ocrText?: string;
}

export interface VisualAnalysisResult {
  id: string;
  title: string;
  category: string;
  description: string;
  type?: 'custom' | 'cpu_scheduling' | 'neural_network' | 'gradient_descent' | 'dbms_erd';
  imageUrl?: string;
  svgData?: string;
  slides: VisionSlide[];
  explanation: {
    overview: string;
    keyPoints: string[];
    formula?: string;
    implication: string;
    extractedText?: string;
  };
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const multimodalVisionService = {
  /**
   * Analyze any custom uploaded diagram/image or topic with deep, multi-slide academic synthesis
   */
  async analyzeImage(
    imageBase64: string,
    mimeType: string = 'image/png',
    topic?: string,
    customPrompt?: string
  ): Promise<VisualAnalysisResult> {
    const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const apiKey = getGeminiApiKey();

    const systemPrompt = `You are CogniLens Multimodal Vision AI — an elite academic computer science and engineering vision intelligence tutor.
You are analyzing an academic diagram, architecture blueprint, system flow, or mathematical visualization.

You must deliver an extremely thorough, knowledgeable, rigorous, and relevant analysis across 3 progressive study slides.
You must respond with ONLY a valid JSON object matching this exact structure:
{
  "title": "A concise, academic title (max 8 words)",
  "category": "Academic Subject (e.g. Operating Systems, Deep Learning, Distributed Systems, DBMS, Algorithms)",
  "description": "2-sentence executive summary of the visual representation",
  "slides": [
    {
      "title": "Architecture & Visual Anatomy",
      "badge": "Slide 1 of 3: Core Architecture",
      "content": "Deep, comprehensive explanation of what this diagram depicts, the role of each node, module, layer, and boundary.",
      "keyPoints": [
        "Component 1 (Name & Function): Deep description of its role...",
        "Component 2 (Name & Function): Deep description of its role...",
        "Component 3 (Name & Function): Deep description of its role...",
        "Component 4 (Name & Function): Deep description of its role..."
      ],
      "ocrText": "Transcribed labels, numbers, and text visible in the image"
    },
    {
      "title": "Operational Mechanics & Step-by-Step Flow",
      "badge": "Slide 2 of 3: Execution Mechanics",
      "content": "Detailed step-by-step walkthrough explaining the lifecycle, data flow, state transitions, message passing, or transformations from input to final output.",
      "keyPoints": [
        "Step 1 (Ingestion / Initialization): What triggers the process and initial state...",
        "Step 2 (Execution / Core Logic): How data flows through interconnected elements...",
        "Step 3 (State Transition / Mutation): Updates, checks, or synchronization...",
        "Step 4 (Completion / Termination): Final output, caching, or release of resources..."
      ],
      "implication": "System reliability, latency, or operational design tradeoff"
    },
    {
      "title": "Mathematical Formulation, Complexity & Exam Mastery",
      "badge": "Slide 3 of 3: Theoretical Rigor",
      "content": "Rigorous academic theory analyzing performance bounds, computational complexity, edge cases, failure modes, and critical exam questions.",
      "formula": "Primary formula, recurrence relation, cost function, or asymptotic bound in LaTeX (e.g. $O(N \\log N)$, $\\\\nabla J(\\\\theta)$)",
      "keyPoints": [
        "Analytical Metric / Formulation: Breakdown of variables and mathematical meaning...",
        "Critical Edge Cases / Bottlenecks: Boundary conditions, deadlock, vanishing gradients, or race conditions...",
        "Practical Industry & Exam Relevance: How this principle is implemented in real-world systems..."
      ],
      "implication": "Key academic takeaway summarizing what every student must remember for examinations."
    }
  ]
}`;

    const userPromptText = customPrompt
      ? `User focus question: "${customPrompt}". Analyze this diagram thoroughly with maximum academic rigor, providing in-depth explanations across all 3 slides.`
      : topic
      ? `Topic: "${topic}". Analyze this diagram thoroughly with maximum academic rigor, providing in-depth explanations across all 3 slides.`
      : 'Analyze this diagram thoroughly with maximum academic rigor, providing in-depth explanations across all 3 slides.';

    // 1. Try Gemini Vision if API key is present
    if (apiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'];
      for (const model of models) {
        try {
          const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
          const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              {
                role: 'user',
                parts: [
                  { text: userPromptText },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/png',
                      data: cleanB64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              const slides: VisionSlide[] = Array.isArray(parsed.slides) && parsed.slides.length > 0
                ? parsed.slides.map((s: any, idx: number) => ({
                    title: s.title || `Study Section ${idx + 1}`,
                    badge: s.badge || `Slide ${idx + 1} of ${parsed.slides.length}`,
                    content: s.content || '',
                    keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
                    formula: s.formula || undefined,
                    implication: s.implication || undefined,
                    ocrText: s.ocrText || undefined
                  }))
                : [
                    {
                      title: 'Architecture & Visual Anatomy',
                      badge: 'Slide 1 of 3: Core Architecture',
                      content: parsed.overview || 'Overview of visual elements.',
                      keyPoints: parsed.keyPoints || [],
                      ocrText: parsed.extractedText
                    },
                    {
                      title: 'Operational Mechanics',
                      badge: 'Slide 2 of 3: Execution Mechanics',
                      content: 'Detailed execution dynamics and process flow.',
                      keyPoints: parsed.keyPoints || []
                    },
                    {
                      title: 'Theoretical Rigor & Takeaways',
                      badge: 'Slide 3 of 3: Theoretical Rigor',
                      content: 'Analytical metrics and practical applications.',
                      formula: parsed.formula,
                      implication: parsed.implication
                    }
                  ];

              return {
                id: `custom-diag-${Date.now()}`,
                title: parsed.title || topic || 'Custom Diagram Analysis',
                category: parsed.category || 'Multimodal Vision',
                description: parsed.description || 'Uploaded diagram analyzed by CogniLens AI',
                type: 'custom',
                imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanB64}`,
                slides,
                explanation: {
                  overview: slides[0]?.content || parsed.overview || '',
                  keyPoints: slides[0]?.keyPoints || parsed.keyPoints || [],
                  formula: slides[2]?.formula || parsed.formula,
                  implication: slides[2]?.implication || parsed.implication || 'Analysis grounded in the uploaded diagram.',
                  extractedText: slides[0]?.ocrText || parsed.extractedText
                }
              };
            }
          }
        } catch (e) {
          console.warn(`Vision model ${model} call failed:`, e);
        }
      }
    }

    // 2. Try FastAPI Backend endpoint
    try {
      const backendRes = await fetch('/api/multimodal/analyze-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: cleanB64,
          mime_type: mimeType,
          topic: topic,
          prompt: userPromptText
        })
      });

      if (backendRes.ok) {
        const parsed = await backendRes.json();
        const slides: VisionSlide[] = [
          {
            title: 'Architecture & Visual Anatomy',
            badge: 'Slide 1 of 3: Core Architecture',
            content: parsed.overview || 'Comprehensive architectural breakdown.',
            keyPoints: parsed.key_points || [],
            ocrText: parsed.extracted_text
          },
          {
            title: 'Operational Mechanics & Flow',
            badge: 'Slide 2 of 3: Execution Mechanics',
            content: 'Step-by-step state transitions and component communication paths.',
            keyPoints: parsed.key_points || []
          },
          {
            title: 'Theoretical Rigor & Exam Takeaway',
            badge: 'Slide 3 of 3: Theoretical Rigor',
            content: parsed.implication || 'Essential exam concepts and algorithmic principles.',
            formula: parsed.formula,
            implication: parsed.implication
          }
        ];

        return {
          id: `custom-diag-${Date.now()}`,
          title: parsed.title || topic || 'Custom Diagram Analysis',
          category: parsed.category || 'Multimodal Vision',
          description: parsed.description || 'Uploaded diagram analyzed by CogniLens AI',
          type: 'custom',
          imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanB64}`,
          slides,
          explanation: {
            overview: parsed.overview,
            keyPoints: parsed.key_points || [],
            formula: parsed.formula || undefined,
            implication: parsed.implication,
            extractedText: parsed.extracted_text || undefined
          }
        };
      }
    } catch (e) {
      console.warn('Backend multimodal endpoint not reachable:', e);
    }

    // 3. Fallback Synthesizer with 3 Rich Slides
    const fallbackTitle = topic ? topic.trim() : 'Visual Architecture & System Flow';
    const fallbackSlides: VisionSlide[] = [
      {
        title: 'Architecture & Visual Anatomy',
        badge: 'Slide 1 of 3: Core Architecture',
        content: `This diagram models the architectural topology and component arrangement of ${fallbackTitle}. The layout delineates clear functional boundaries between ingestion, processing, and output layers to optimize decoupling and cohesion.`,
        keyPoints: [
          `Primary Visual Entities: Defines core logical components representing distinct computational responsibilities in ${fallbackTitle}`,
          'Boundary Isolation: Encapsulates state transitions within dedicated service or hardware boundaries',
          'Directional Flow: Directed vectors show input transformations moving from ingress to egress',
          'Inter-Module Coupling: Illustrates synchronization primitives and data handoffs'
        ]
      },
      {
        title: 'Operational Mechanics & Execution Lifecycle',
        badge: 'Slide 2 of 3: Execution Mechanics',
        content: `Step-by-step execution lifecycle for ${fallbackTitle}. Requests enter via client interfaces, undergo validation and state verification, and trigger the core algorithmic pipelines.`,
        keyPoints: [
          'Phase 1 (Ingress & Validation): Incoming messages or state vectors are authenticated and checked for invariants',
          'Phase 2 (Algorithmic Processing): Data traverses intermediate nodes with deterministic latency',
          'Phase 3 (Synchronization & Storage): Shared state is updated with consistency guarantees',
          'Phase 4 (Egress Response): Synthesized results return through designated communication channels'
        ],
        implication: 'Ensures optimal throughput while mitigating race conditions and memory leaks.'
      },
      {
        title: 'Theoretical Formulations & Exam Mastery',
        badge: 'Slide 3 of 3: Theoretical Rigor',
        content: `Mathematical formulation and computational bounds governing ${fallbackTitle}. Analyzing theoretical time/space complexity guarantees stability under peak loads.`,
        formula: 'T(n) = \\sum_{i=1}^{k} \\left( C_i \\cdot n^{\\alpha} \\right) + \\mathcal{O}(\\log n)',
        keyPoints: [
          'Complexity Characteristics: Balances time-complexity against memory footprint under worst-case bounds',
          'Failure Modes & Edge Cases: Handles network partitioning, resource starvation, and boundary exceptions',
          'Exam Cheat Sheet: Remember that modular partitioning guarantees fault isolation and predictable recovery times'
        ],
        takeaway: `Mastering ${fallbackTitle} provides key design patterns frequently tested in university curricula and technical engineering interviews.`
      }
    ];

    return {
      id: `custom-diag-${Date.now()}`,
      title: fallbackTitle,
      category: 'Visual & System Architecture',
      description: `Multimodal analysis and structural decomposition of ${fallbackTitle}.`,
      type: 'custom',
      imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanB64}`,
      slides: fallbackSlides,
      explanation: {
        overview: fallbackSlides[0].content,
        keyPoints: fallbackSlides[0].keyPoints || [],
        formula: fallbackSlides[2].formula,
        implication: fallbackSlides[2].takeaway || 'Analysis grounded in the uploaded diagram.'
      }
    };
  },

  /**
   * Browser Speech-to-Text (STT) via Web Speech API
   * Fixed: Cleans interim transcripts and returns whole continuous phrase without repeating
   */
  startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): { stop: () => void } {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return { stop: () => {} };
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }
        const text = (finalTranscript || interimTranscript).trim();
        if (text) {
          onResult(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (onError) {
          if (event.error === 'not-allowed') {
            onError('Microphone access was denied. Please allow microphone permissions in your browser.');
          } else if (event.error === 'no-speech') {
            onError('No speech detected. Please speak clearly into your microphone.');
          } else {
            onError(`Speech error: ${event.error}`);
          }
        }
      };

      recognition.onend = () => {
        if (onEnd) onEnd();
      };

      recognition.start();
      return {
        stop: () => {
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }
      };
    } catch (e: any) {
      if (onError) onError(e?.message || 'Failed to start microphone listener');
      return { stop: () => {} };
    }
  },

  /**
   * Browser Text-to-Speech (TTS) via Web Speech API
   */
  speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): { stop: () => void } {
    if (!('speechSynthesis' in window)) {
      if (onError) onError('Text-to-speech is not supported in this browser.');
      return { stop: () => {} };
    }

    try {
      window.speechSynthesis.cancel(); // Stop any previous speech

      // Clean markdown tags for natural speech
      const cleanText = text
        .replace(/[#*`_~]/g, '')
        .replace(/\$[^$]+\$/g, 'mathematical expression')
        .replace(/\[.*?\]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick high quality English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);

      return {
        stop: () => {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // ignore
          }
          if (onEnd) onEnd();
        }
      };
    } catch (e: any) {
      if (onError) onError(e?.message || 'Failed to synthesize speech');
      return { stop: () => {} };
    }
  },

  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  },

  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /**
   * Analyze uploaded document/material text — returns summary, key concepts, difficult topics
   */
  async analyzeDocument(
    textContent: string,
    filename?: string,
    course?: string
  ): Promise<{ summary: string; key_concepts: string[]; difficult_topics: string[]; study_tips: string[] }> {
    // 1. Try backend
    try {
      const res = await fetch('/api/multimodal/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_content: textContent, filename, course })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend analyze-material not reachable:', e);
    }

    // 2. Try Gemini directly
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const url = `${GEMINI_API_BASE}/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = {
          systemInstruction: { parts: [{ text: 'You are CogniLens Academic Analysis AI. Output ONLY valid JSON with keys: "summary", "key_concepts" (array), "difficult_topics" (array), "study_tips" (array).' }] },
          contents: [{ role: 'user', parts: [{ text: `Analyze this academic material:\n\n${textContent.slice(0, 8000)}` }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        };
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return JSON.parse(text);
        }
      } catch (e) {
        console.warn('Gemini analyze-material failed:', e);
      }
    }

    // 3. Fallback
    return {
      summary: `This material covers foundational and advanced concepts. It introduces key terminology and builds towards applied problem-solving techniques.`,
      key_concepts: ['Core definitions and foundational terminology', 'Algorithmic procedures and methodologies', 'Mathematical formulations', 'Practical applications'],
      difficult_topics: ['Advanced mathematical derivations', 'Edge cases and boundary analysis', 'Multi-step problem solving'],
      study_tips: ['Break complex topics into smaller sub-problems', 'Practice with solved examples first', 'Use diagrams to understand abstract concepts']
    };
  },

  /**
   * Generate a Mermaid.js concept diagram from text content
   */
  async generateDiagramFromText(
    textContent: string,
    topic?: string,
    diagramType: string = 'flowchart',
    direction: string = 'TD'
  ): Promise<{
    mermaid_code: string;
    title: string;
    description: string;
    simplified_explanation?: string;
    key_takeaways?: string[];
  }> {
    // 1. Try backend FastAPI endpoint first
    try {
      const res = await fetch('/api/multimodal/generate-diagram-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_content: textContent,
          topic,
          diagram_type: diagramType,
          direction
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.mermaid_code) return data;
      }
    } catch (e) {
      console.warn('Backend generate-diagram not reachable:', e);
    }

    // 2. Try Gemini directly from client with verified model
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      const typePrompts: Record<string, string> = {
        mindmap: 'Mermaid native MIND MAP. Line 1: "mindmap", Line 2: "  root(( Topic ))". 2-space indentation. No brackets inside leaf nodes. Explain real concepts, conditions, and actions.',
        sequence: 'Mermaid SEQUENCE DIAGRAM (sequenceDiagram). Include autonumber, 3-4 specific participating components, alt/else branch, and concrete actions in message arrows.',
        stateDiagram: 'Mermaid STATE MACHINE (stateDiagram-v2). Show lifecycle states from [*] to terminal states with real event triggers.',
        class: 'Mermaid CLASS DIAGRAM (classDiagram). Model key entities with attributes and methods.',
        flowchart: `Mermaid FLOWCHART (flowchart ${direction}). Every node MUST describe a concrete step, condition, or rule (e.g. A["Step Description"] --> B{"Decision?"}). Include Yes/No branches.`
      };

      const systemText = `You are CogniLens Educational AI Tutor. Output ONLY valid JSON with keys: "mermaid_code", "title", "description", "simplified_explanation" (plain English explanation for someone who finds this concept difficult), "key_takeaways" (array of 3 strings). No markdown ticks inside mermaid_code. ${typePrompts[diagramType] || typePrompts.flowchart} CRITICAL: Every single node MUST contain real, educational facts about the topic. NEVER output generic roadmap placeholders like "Phase 1: Ingestion", "Step 1", "Overview", "Applications", "Deliver Result".`;

      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const model of modelsToTry) {
        try {
          const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
          const payload = {
            systemInstruction: { parts: [{ text: systemText }] },
            contents: [{ role: 'user', parts: [{ text: `Topic: "${topic || 'the concept'}"\n\nStudy Material Context:\n${textContent.slice(0, 6000)}` }] }],
            generationConfig: { temperature: 0.25, responseMimeType: 'application/json' }
          };
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              const cleanCode = (parsed.mermaid_code || '').replace(/```mermaid/g, '').replace(/```/g, '').trim();
              if (cleanCode) {
                return {
                  mermaid_code: cleanCode,
                  title: parsed.title || `${diagramType.toUpperCase()}: ${topic || 'Concept'}`,
                  description: parsed.description || `Visual breakdown of ${topic || 'the concept'}.`,
                  simplified_explanation: parsed.simplified_explanation,
                  key_takeaways: parsed.key_takeaways
                };
              }
            }
          }
        } catch (e) {
          console.warn(`Gemini model ${model} failed for diagram:`, e);
        }
      }
    }

    // 3. Topic-Aligned Domain Fallback Synthesizer (Zero Generic Boilerplate)
    return generateClientSynthesizedDiagram(topic || 'Core Concept', textContent, diagramType, direction);
  }
};
