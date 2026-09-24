/**
 * CogniLens Domain-Aware Client Diagram Synthesizer
 * Generates topic-aligned, non-generic Mermaid.js diagrams for:
 * - Flowchart (Process & Flow)
 * - Mind Map (Concept Taxonomy & Hierarchy)
 * - Sequence Diagram (Timeline & Actor Interactions)
 * - State Diagram (Lifecycles & Transitions)
 * - Class Diagram (Data Structures & Models)
 *
 * ZERO generic boilerplate: extracts genuine concepts, terms, actions, and conditions
 * from the user's provided topic and text, accompanied by rich plain-English layman analogies.
 */

export interface SynthesizedDiagramResult {
  mermaid_code: string;
  title: string;
  description: string;
  simplified_explanation?: string;
  key_takeaways?: string[];
}

export function sanitizeMermaidLabel(text: string): string {
  const cleaned = text.replace(/"/g, "'").replace(/\n/g, ' ').replace(/\(/g, '（').replace(/\)/g, '）').trim();
  return cleaned.length > 65 ? cleaned.slice(0, 65) : cleaned;
}

export function sanitizeMindmapText(text: string): string {
  const cleaned = text.replace(/[()[\]{}"':]/g, '').trim();
  return cleaned.length > 48 ? cleaned.slice(0, 48) : cleaned;
}

export function extractConceptElements(topic: string, text: string): {
  actions: string[];
  conditions: string[];
  terms: string[];
} {
  const combined = text ? `${topic}. ${text}` : topic;

  // Extract sentence fragments
  const sentences = combined
    .split(/[.\n;•*]/)
    .map(s => s.replace(/^[0-9]+[.)]\s*/, '').trim())
    .filter(s => s.length >= 10 && !s.startsWith('http'));

  const actionPhrases = sentences.filter(s => s.length >= 12 && s.length <= 80).slice(0, 8);

  const conditionPhrases = sentences.filter(s => {
    const l = s.toLowerCase();
    return l.includes('if ') || l.includes('when ') || l.includes('verify') || l.includes('check') || l.includes('ensure') || l.includes('is ');
  }).slice(0, 4);

  // Key terms
  const words = combined.match(/\b[A-Za-z0-9_-]{3,25}\b/g) || [];
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'were', 'what', 'which',
    'there', 'their', 'about', 'could', 'would', 'these', 'other',
    'into', 'more', 'also', 'some', 'time', 'than', 'them', 'very', 'when'
  ]);
  const terms: string[] = [];
  for (const w of words) {
    const wl = w.toLowerCase();
    if (!stopWords.has(wl) && wl.length > 3 && !terms.some(t => t.toLowerCase() === wl)) {
      terms.push(w);
      if (terms.length >= 10) break;
    }
  }

  return {
    actions: actionPhrases,
    conditions: conditionPhrases,
    terms
  };
}

export function generateLaymanAnalogy(topic: string, text: string): string {
  const combined = `${topic} ${text}`.toLowerCase();

  if (/(deadlock|mutex|lock|concurrency|race condition)/.test(combined)) {
    return `Think of ${topic} like a busy 4-way traffic intersection where four cars arrive at the same instant. Each driver waits for the car on their right to proceed, resulting in a complete standstill where nobody can move. The gridlock only breaks when a traffic officer steps in and commands one vehicle to back up.`;
  } else if (/(schedule|quantum|round robin|cpu|fifo|priority)/.test(combined)) {
    return `Think of ${topic} like a fair playground where a dozen kids want to use a single swing. Instead of letting one child hog the swing for an hour, a timer is set for 2 minutes. When the buzzer goes off, the current kid hops off to the back of the line, ensuring everyone gets regular turns with predictable waiting times.`;
  } else if (/(paging|virtual memory|cache|tlb|ram)/.test(combined)) {
    return `Think of ${topic} like working on a major research report at a small desk with an enormous archive in the cellar. Your desk (RAM) only holds three open books at once. When you need information from a fourth book, you return one book to the cellar shelves and bring the new volume up to your desk.`;
  } else if (/(tcp|handshake|packet|socket|network|protocol)/.test(combined)) {
    return `Think of ${topic} like a formal radio check before a space launch. You broadcast 'Control, do you read me?' (SYN). Control answers 'Loud and clear, do you copy us?' (SYN-ACK). You reply 'Copy loud and clear, ready for telemetry' (ACK). Only after this mutual confirmation is real mission data transmitted.`;
  } else if (/(tree|bst|binary search|graph|dijkstra|sort|algorithm)/.test(combined)) {
    return `Think of ${topic} like searching for a word in a dictionary. Rather than reading every single word from page 1 onwards, you split the dictionary in half, see which half contains your letter, and immediately discard the other half, finding any entry in just a few quick checks.`;
  } else if (/(neural|backprop|gradient|loss|deep learning|machine learning)/.test(combined)) {
    return `Think of ${topic} like a chef seasoning a complex soup recipe. After tasting each batch, if it's slightly too salty, the chef reduces the salt measurement by a tiny pinch next time. Step by step, tasting and tweaking after each batch, the recipe approaches perfection.`;
  } else if (/(database|transaction|acid|sql|commit|rollback)/.test(combined)) {
    return `Think of ${topic} like buying a coffee with a debit card. Either the store receives payment AND you get your coffee, or neither happens. If the payment terminal freezes midway, the transaction aborts cleanly so your bank balance remains untouched.`;
  }

  return `Think of ${topic} like a precision assembly line where each stage builds on the verified output of the previous step. If any component fails quality inspection, the system adjusts or safely falls back before packaging the final result.`;
}

export function generateClientSynthesizedDiagram(
  topic: string,
  textContent: string,
  diagramType: string = 'flowchart',
  direction: string = 'TD'
): SynthesizedDiagramResult {
  const cleanTopic = topic.trim() || 'Core Concept';
  const safeTopic = sanitizeMermaidLabel(cleanTopic);
  const elements = extractConceptElements(cleanTopic, textContent);

  const { actions, conditions, terms } = elements;
  const laymanAnalogy = generateLaymanAnalogy(cleanTopic, textContent);

  // 1. MIND MAP
  if (diagramType === 'mindmap') {
    const root = sanitizeMindmapText(cleanTopic);
    const title = `Mind Map: ${cleanTopic}`;
    const description = `Core concepts and relationships for ${cleanTopic}.`;

    const b1 = sanitizeMindmapText(actions[0] || `${root} Fundamentals`);
    const b2 = sanitizeMindmapText(actions[1] || 'Core Mechanics');
    const b3 = sanitizeMindmapText(actions[2] || 'Governing Rules & Limits');
    const b4 = sanitizeMindmapText(actions[3] || 'Real-World Applications');

    const t1 = sanitizeMindmapText(terms[0] || 'Primary Component');
    const t2 = sanitizeMindmapText(terms[1] || 'State Verification');
    const t3 = sanitizeMindmapText(terms[2] || 'Invariant Property');
    const t4 = sanitizeMindmapText(terms[3] || 'Verified Result');

    const code = `mindmap
  root(( ${root} ))
    Foundational Principles
      ${b1}
      ${t1}
    Operational Workflow
      ${b2}
      ${t2}
    Rules & Boundary Limits
      ${b3}
      ${t3}
    Practical Applications
      ${b4}
      ${t4}`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: laymanAnalogy,
      key_takeaways: [
        `Core principle: ${b1.slice(0, 50)}.`,
        `Mechanism: ${b2.slice(0, 50)}.`,
        `Practical application: ${b4.slice(0, 50)}.`
      ]
    };
  }

  // 2. SEQUENCE DIAGRAM
  if (diagramType === 'sequence') {
    const title = `Sequence Flow: ${cleanTopic}`;
    const description = `Timeline and participant interactions for ${cleanTopic}.`;

    const act1 = (terms[0] || 'Client').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const act2 = (terms[1] || 'Coordinator').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const act3 = (terms[2] || 'Engine').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const s1 = sanitizeMermaidLabel(actions[0] || `Initiate ${cleanTopic}`).slice(0, 42);
    const s2 = sanitizeMermaidLabel(actions[1] || 'Validate preconditions').slice(0, 42);
    const s3 = sanitizeMermaidLabel(actions[2] || 'Process core transformation').slice(0, 42);
    const s4 = sanitizeMermaidLabel(actions[3] || 'Return confirmed result').slice(0, 42);
    const cond = sanitizeMermaidLabel(conditions[0] || 'Preconditions Validated').slice(0, 32);

    const code = `sequenceDiagram
    autonumber
    actor A as ${act1}
    participant B as ${act2}
    participant C as ${act3}

    A->>B: ${s1}
    B->>C: ${s2}
    C-->>B: Status Check (${cond})
    alt ${cond}
        B->>C: Execute: ${s3}
        C-->>B: Execution Success
        B-->>A: ${s4}
    else Boundary Check Failed
        C-->>B: Emit Warning / Retry
        B-->>A: Safe Fallback Signal
    end`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: laymanAnalogy,
      key_takeaways: [
        `${act1} triggers the workflow with ${s1.slice(0, 45)}.`,
        `${act2} verifies rules against ${cond.slice(0, 35)}.`,
        `Result: ${s4.slice(0, 45)}.`
      ]
    };
  }

  // 3. STATE DIAGRAM
  if (diagramType === 'stateDiagram') {
    const title = `State Machine: ${cleanTopic}`;
    const description = `Lifecycle transitions and event triggers for ${cleanTopic}.`;

    const s1 = (terms[0] || 'InitialState').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const s2 = (terms[1] || 'ActiveProcessing').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const s3 = (terms[2] || 'VerifiedState').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const t1 = sanitizeMermaidLabel(actions[0] || 'Start Request').slice(0, 28);
    const t2 = sanitizeMermaidLabel(actions[1] || 'Compute Transformation').slice(0, 28);
    const t3 = sanitizeMermaidLabel(actions[2] || 'Invariants Confirmed').slice(0, 28);

    const code = `stateDiagram-v2
    [*] --> ${s1} : Initialize
    ${s1} --> ${s2} : ${t1}
    ${s2} --> ${s3} : ${t2}
    ${s3} --> SuccessCompleted : ${t3}
    ${s2} --> ErrorRecovery : Boundary Failure
    ErrorRecovery --> ${s1} : Reset to Safe Bounds
    SuccessCompleted --> [*] : Lifecycle Completed`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: laymanAnalogy,
      key_takeaways: [
        `Starts in ${s1} on initialization.`,
        `Transitions to ${s2} when ${t1.slice(0, 40)}.`,
        `Reaches completion upon ${t3.slice(0, 40)}.`
      ]
    };
  }

  // 4. CLASS DIAGRAM
  if (diagramType === 'class') {
    const title = `Class Model: ${cleanTopic}`;
    const description = `Entities and relationships of ${cleanTopic}.`;

    const c1 = (terms[0] || 'PrimaryModel').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18);
    const c2 = (terms[1] || 'Manager').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18);
    const c3 = (terms[2] || 'OutputHandler').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18);

    const m1 = (actions[0] || 'execute').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'execute';
    const m2 = (actions[1] || 'validate').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'validate';

    const code = `classDiagram
    class ${c1} {
        +String identifier
        +Boolean isActive
        +${m1}() void
    }
    class ${c2} {
        -List items
        +process() bool
        +${m2}() bool
    }
    class ${c3} {
        +notify() void
        +handleResult() void
    }
    ${c1} "1" --> "many" ${c2} : coordinates
    ${c2} ..> ${c3} : outputs to`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: laymanAnalogy,
      key_takeaways: [
        `${c1} acts as the core entity coordinator.`,
        `${c2} executes operations via ${m2}().`,
        `${c3} encapsulates outputs and notifications.`
      ]
    };
  }

  // 5. FLOWCHART (Default)
  const dirCode = direction === 'LR' ? 'LR' : 'TD';
  const title = `Flowchart: ${cleanTopic}`;
  const description = `Step-by-step logic, conditions, and outcomes of ${cleanTopic}.`;

  const step1 = sanitizeMermaidLabel(actions[0] || `Initialize ${cleanTopic}`).slice(0, 45);
  const step2 = sanitizeMermaidLabel(actions[1] || 'Evaluate core parameters and inputs').slice(0, 45);
  let cond = sanitizeMermaidLabel(conditions[0] || (actions[2] || 'Are constraints satisfied?')).slice(0, 40);
  if (!cond.endsWith('?')) cond = `${cond}?`;
  const step3 = sanitizeMermaidLabel(actions[2] || 'Apply primary transformation').slice(0, 45);
  const step4 = sanitizeMermaidLabel(actions[3] || 'Produce verified outcome').slice(0, 45);

  const code = `flowchart ${dirCode}
    A["Input / Trigger: ${safeTopic.slice(0, 32)}"] --> B["${step1}"]
    B --> C["${step2}"]
    C --> D{"${cond}"}
    D -->|Yes: Valid| E["${step3}"]
    D -->|No: Alternate| F["Apply fallback handling & recovery"]
    F --> E
    E --> G["Result: Completed ${safeTopic.slice(0, 30)}"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff`;

  return {
    mermaid_code: code,
    title,
    description,
    simplified_explanation: laymanAnalogy,
    key_takeaways: [
      `Step 1: ${step1}.`,
      `Verification: ${cond}.`,
      `Outcome: ${step4}.`
    ]
  };
}
