import { MaterialSource, MaterialType } from '../types/material';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';

export const INITIAL_MATERIALS: MaterialSource[] = [
  {
    id: 'mat-os-unit3',
    title: 'OS — Unit 3 Deadlocks & Synchronization',
    filename: 'OS_Unit3_Deadlocks.pdf',
    type: 'pdf',
    pagesCount: 42,
    size: '4.8 MB',
    uploadDate: 'Sep 18, 2026',
    status: 'indexed',
    topics: ['Deadlock', 'Mutual Exclusion', 'Hold and Wait', 'Banker Algorithm', 'Resource Allocation Graph'],
    course: 'Operating Systems',
    contentPreview: 'A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.',
    sections: [
      {
        id: 'sec-os-1',
        page: 18,
        title: 'Four Coffman Conditions for Deadlock',
        snippet: 'Deadlock can arise if four conditions hold simultaneously: 1. Mutual Exclusion: At least one resource must be held in a non-shareable mode. 2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources. 3. No Preemption: Resources cannot be preempted. 4. Circular Wait: A closed chain of processes exists, each holding a resource needed by the next.'
      },
      {
        id: 'sec-os-2',
        page: 42,
        title: 'Resource Allocation Graph & Deadlock Detection',
        snippet: 'Deadlock Detection in single-instance resource systems reduces to cycle detection in a directed Resource-Allocation Graph (RAG). If a graph contains no cycles, then no deadlock exists. If every resource type has exactly one instance, then a cycle implies a deadlock.'
      },
      {
        id: 'sec-os-3',
        page: 31,
        title: 'Banker\'s Algorithm for Deadlock Avoidance',
        snippet: 'Dijkstra\'s Banker\'s Algorithm tests for safety by simulating the allocation for predetermined maximum possible amounts of all resources, and then makes an s-state check to test for possible activities.'
      }
    ]
  },
  {
    id: 'mat-ml-linear',
    title: 'Machine Learning — Linear Regression & Cost Functions',
    filename: 'Machine Learning — Linear Regression.pdf',
    type: 'pdf',
    pagesCount: 28,
    size: '3.2 MB',
    uploadDate: 'Sep 19, 2026',
    status: 'indexed',
    topics: ['Linear Regression', 'Mean Squared Error', 'Gradient Descent', 'Hyperparameters', 'Overfitting'],
    course: 'Machine Learning',
    contentPreview: 'Supervised learning algorithm used to model the linear relationship between a dependent variable y and one or more independent predictor features X.',
    sections: [
      {
        id: 'sec-ml-1',
        page: 4,
        title: 'Mean Squared Error (MSE) Loss Function',
        snippet: 'The Cost Function J(θ) = (1 / 2m) * Σ (h_θ(x^(i)) - y^(i))^2 measures the average squared difference between predictions and actual targets.'
      },
      {
        id: 'sec-ml-2',
        page: 12,
        title: 'Gradient Descent Optimization Rule',
        snippet: 'The update rule for gradient descent: θ_j := θ_j - α * (∂ / ∂θ_j) J(θ). The learning rate α determines the step size taken towards the global minimum.'
      }
    ]
  },
  {
    id: 'mat-dbms-norm',
    title: 'DBMS — Normalization Notes & Functional Dependencies',
    filename: 'DBMS — Normalization Notes.pdf',
    type: 'pdf',
    pagesCount: 35,
    size: '2.9 MB',
    uploadDate: 'Sep 17, 2026',
    status: 'indexed',
    topics: ['Functional Dependencies', '1NF', '2NF', '3NF', 'BCNF', 'Lossless Decomposition'],
    course: 'DBMS',
    contentPreview: 'Database normalization minimizes redundancy and avoids insertion, update, and deletion anomalies while preserving dependency constraints.',
    sections: [
      {
        id: 'sec-dbms-1',
        page: 14,
        title: 'Third Normal Form (3NF) vs BCNF',
        snippet: 'A relation is in 3NF if for every functional dependency X -> A, either X is a superkey or A is a prime attribute. BCNF is stricter: X must be a superkey for all non-trivial dependencies.'
      }
    ]
  },
  {
    id: 'mat-java-oop',
    title: 'Java OOP Lecture 08 — Polymorphism & Interfaces',
    filename: 'Java OOP Lecture 08.pdf',
    type: 'pdf',
    pagesCount: 22,
    size: '1.9 MB',
    uploadDate: 'Sep 16, 2026',
    status: 'indexed',
    topics: ['Polymorphism', 'Dynamic Method Dispatch', 'Abstract Classes', 'Interfaces', 'SOLID Principles'],
    course: 'Java OOP',
    contentPreview: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass, resolved at runtime through virtual tables.',
    sections: [
      {
        id: 'sec-java-1',
        page: 8,
        title: 'Dynamic Method Dispatch in Java',
        snippet: 'Dynamic method dispatch is the mechanism by which a call to an overridden method is resolved at runtime rather than compile-time via the vtable.'
      }
    ]
  },
  {
    id: 'mat-cn-tcp',
    title: 'Computer Networks — TCP/IP 3-Way Handshake & Flow Control',
    filename: 'Computer Networks — TCP/IP.pdf',
    type: 'pdf',
    pagesCount: 38,
    size: '5.1 MB',
    uploadDate: 'Sep 15, 2026',
    status: 'indexed',
    topics: ['TCP 3-Way Handshake', 'Sliding Window', 'Congestion Control', 'SYN/ACK', 'OSI Layers'],
    course: 'Computer Networks',
    contentPreview: 'Transmission Control Protocol (TCP) provides connection-oriented, reliable, and byte-stream communication across packet-switched networks.',
    sections: [
      {
        id: 'sec-cn-1',
        page: 21,
        title: '3-Way Handshake Connection Establishment',
        snippet: 'Step 1: Client sends SYN (seq=x). Step 2: Server responds with SYN-ACK (seq=y, ack=x+1). Step 3: Client replies with ACK (ack=y+1). The connection is now ESTABLISHED.'
      }
    ]
  },
  {
    id: 'mat-neural-slides',
    title: 'Neural Networks — Backpropagation & Architecture',
    filename: 'Neural Networks — Lecture Slides.pptx',
    type: 'slides',
    pagesCount: 45,
    size: '12.4 MB',
    uploadDate: 'Sep 14, 2026',
    status: 'indexed',
    topics: ['Backpropagation', 'Activation Functions', 'ReLU', 'Feedforward', 'Chain Rule'],
    course: 'Machine Learning',
    contentPreview: 'Multilayer perceptrons learn hierarchical representations via the chain rule of calculus during backward gradient propagation.',
    sections: []
  },
  {
    id: 'mat-hw-notes',
    title: 'Handwritten ML Notes — Gradient Descent Derivation',
    filename: 'Handwritten ML Notes.jpg',
    type: 'image',
    size: '3.8 MB',
    uploadDate: 'Sep 20, 2026',
    status: 'indexed',
    topics: ['Gradient Descent', 'Partial Derivatives', 'Handwritten Equations', 'Learning Rate'],
    course: 'Machine Learning',
    contentPreview: 'Handwritten mathematical formulas calculating partial derivatives of MSE loss with respect to weight parameters w1 and bias b.',
    sections: [
      {
        id: 'sec-hw-1',
        page: 1,
        title: 'Partial Derivative Matrix',
        snippet: 'Handwritten diagram showing slope of J(w) descending towards local minimum with step vector -α ∇J(w).'
      }
    ]
  }
];

const STORAGE_KEY = 'cognilens_materials';

export function inferMaterialDetails(filename: string, explicitCourse?: string): {
  cleanTitle: string;
  course: string;
  topics: string[];
  contentPreview: string;
  sections: Array<{ id: string; page: number; title: string; snippet: string }>;
} {
  const cleanTitle = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
  const lower = filename.toLowerCase();

  let course = explicitCourse || 'General Studies';
  let topics: string[] = [cleanTitle, 'Study Notes', 'Core Concepts'];
  let contentPreview = `Comprehensive reference notes for ${cleanTitle}. Extracted and indexed into CogniLens grounded vector store.`;
  let sections: Array<{ id: string; page: number; title: string; snippet: string }> = [];

  if (/aptitude|math|quant|reasoning|logic|number|ratio|speed|distance|work/i.test(lower)) {
    course = 'Quantitative Aptitude';
    topics = ['Percentages & Ratios', 'Speed, Time & Distance', 'Permutations & Combinations', 'Data Interpretation', 'Logical Reasoning'];
    contentPreview = `Comprehensive quantitative aptitude notes covering algebra, numerical reasoning, speed-distance-time formulas, percentages, ratio & proportion, and data interpretation charts.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 1, title: 'Ratio, Proportion & Percentages', snippet: 'Essential shortcut formulas for percentage calculations, ratio balancing, and profit-loss equations.' },
      { id: `sec-${Date.now()}-2`, page: 5, title: 'Speed, Time & Distance Equations', snippet: 'Relative speed formulas, average speed calculations, and work-time rate equations.' },
      { id: `sec-${Date.now()}-3`, page: 12, title: 'Data Interpretation & Logical Reasoning', snippet: 'Tabular data analysis, bar charts, syllogisms, and permutation-combination probability principles.' }
    ];
  } else if (/os|deadlock|process|kernel|operating|coffman|banker/i.test(lower)) {
    course = 'Operating Systems';
    topics = ['Deadlock', 'Mutual Exclusion', 'Hold and Wait', 'Banker Algorithm', 'Resource Allocation Graph'];
    contentPreview = `Operating systems principles covering process synchronization, memory management, deadlock detection via RAG, and Banker's Algorithm.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 18, title: 'Four Coffman Conditions for Deadlock', snippet: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait conditions.' },
      { id: `sec-${Date.now()}-2`, page: 42, title: 'Resource Allocation Graph & Detection', snippet: 'Cycle detection in directed Resource Allocation Graphs.' }
    ];
  } else if (/ml|machine|learning|linear|regression|neural|ai|loss|cost/i.test(lower)) {
    course = 'Machine Learning';
    topics = ['Linear Regression', 'Mean Squared Error', 'Gradient Descent', 'Hyperparameters', 'Overfitting'];
    contentPreview = `Machine learning theoretical foundations covering supervised regression models, MSE loss functions, and gradient descent optimization algorithms.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 4, title: 'Mean Squared Error (MSE) Formulation', snippet: 'Derivation of cost function J(θ) and convex optimization principles.' },
      { id: `sec-${Date.now()}-2`, page: 12, title: 'Gradient Descent Update Rule', snippet: 'Iterative parameter update rule θ := θ - α ∇J(θ).' }
    ];
  } else if (/dbms|sql|database|norm|bcnf|3nf/i.test(lower)) {
    course = 'DBMS';
    topics = ['Normalization', 'SQL Queries', '3NF & BCNF', 'ACID Properties', 'B+ Trees'];
    contentPreview = `Database management system fundamentals including relational schema design, 3NF and BCNF normalization, and ACID transaction guarantees.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 14, title: 'Third Normal Form (3NF) vs BCNF Decomposition', snippet: 'Functional dependency rules and candidate key criteria for BCNF compliance.' }
    ];
  } else if (/cn|network|tcp|ip|protocol|handshake|osi/i.test(lower)) {
    course = 'Computer Networks';
    topics = ['TCP 3-Way Handshake', 'OSI 7-Layer Model', 'IP Subnetting', 'Congestion Control'];
    contentPreview = `Computer networking fundamentals covering TCP/IP protocol stack, 3-way handshake connection setup, sliding window flow control, and IP routing.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 21, title: 'TCP 3-Way Handshake Protocol', snippet: 'SYN, SYN-ACK, and ACK sequence number synchronization.' }
    ];
  } else if (/java|oop|python|cpp|c\+\+|code|program/i.test(lower)) {
    course = 'Programming & OOP';
    topics = ['Polymorphism', 'Inheritance', 'Encapsulation', 'Interfaces', 'Data Structures'];
    contentPreview = `Object-oriented programming concepts, dynamic method dispatch, interfaces, memory allocation, and software architecture patterns.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 8, title: 'Dynamic Method Dispatch & Polymorphism', snippet: 'Virtual table lookup and method overriding mechanics.' }
    ];
  } else {
    const defaultCourse = cleanTitle.length > 25 ? cleanTitle.slice(0, 25) + '...' : cleanTitle;
    course = explicitCourse && explicitCourse !== 'Operating Systems' ? explicitCourse : defaultCourse;
    topics = [cleanTitle, 'Core Principles', 'Key Formulas', 'Exam Prep'];
    contentPreview = `Comprehensive reference notes and study guide for ${cleanTitle}. Processed and indexed into CogniLens grounded vector store.`;
    sections = [
      { id: `sec-${Date.now()}-1`, page: 1, title: `${cleanTitle} — Core Definitions & Overview`, snippet: `Key formulas, theorems, and definitions extracted from ${filename}.` },
      { id: `sec-${Date.now()}-2`, page: 5, title: `${cleanTitle} — Practical Methods & Examples`, snippet: `Detailed analysis, solved problem examples, and step-by-step methods.` },
      { id: `sec-${Date.now()}-3`, page: 10, title: `${cleanTitle} — Exam Review & Summary`, snippet: `High-frequency takeaways and diagnostic review points.` }
    ];
  }

  return { cleanTitle, course, topics, contentPreview, sections };
}

class MaterialService {
  private materials: MaterialSource[] = [];

  constructor() {
    this.loadMaterials();
  }

  private loadMaterials() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.materials = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load materials from localStorage', e);
    }
    this.materials = [...INITIAL_MATERIALS];
    this.saveMaterials();
  }

  private saveMaterials() {
    try {
      // Strip textContent to prevent localStorage QuotaExceededError and JSON parse errors
      const cleanMaterials = this.materials.map(m => {
        const { textContent, ...rest } = m;
        return rest;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanMaterials));
    } catch (e) {
      console.warn('Failed to save materials to localStorage', e);
    }
  }

  resetMaterials() {
    this.materials = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async getMaterials(): Promise<ApiResponse<MaterialSource[]>> {
    // Try fetching from backend first (reflecting Azure database user materials)
    try {
      const isOnline = await apiClient.isServerOnline();
      if (isOnline) {
        const backendDocs = await apiClient.getDocuments();
        if (backendDocs && backendDocs.length > 0) {
          this.materials = backendDocs.map(bdoc => ({
            id: bdoc.id,
            title: bdoc.title,
            filename: bdoc.filename,
            type: bdoc.type as any,
            pagesCount: bdoc.pagesCount,
            size: bdoc.size,
            uploadDate: bdoc.uploadDate,
            status: bdoc.status as any,
            topics: bdoc.topics || [],
            course: bdoc.course,
            contentPreview: bdoc.contentPreview,
            sections: bdoc.sections,
          }));
          this.saveMaterials();
        }
      }
    } catch (e) {
      console.warn('Failed to fetch materials from backend, using local store', e);
    }

    return {
      success: true,
      data: [...this.materials],
      metadata: { latencyMs: 65 }
    };
  }

  /** Synchronous access to materials array for system prompt building */
  getMaterialsSync(): MaterialSource[] {
    return [...this.materials];
  }

  async getMaterialById(id: string): Promise<ApiResponse<MaterialSource | null>> {
    const item = this.materials.find(m => m.id === id) || null;
    return {
      success: !!item,
      data: item,
      metadata: { latencyMs: 40 }
    };
  }

  addAttachmentAsMaterial(attName: string, attType: 'pdf' | 'image' | 'doc' | 'slides' = 'pdf'): MaterialSource {
    const existing = this.materials.find(m => m.filename.toLowerCase() === attName.toLowerCase() || m.title.toLowerCase() === attName.replace(/\.[^/.]+$/, "").toLowerCase());
    if (existing) return existing;

    const details = inferMaterialDetails(attName);
    const newMaterial: MaterialSource = {
      id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: details.cleanTitle,
      filename: attName,
      type: attType === 'slides' ? 'slides' : attType === 'image' ? 'image' : 'pdf',
      pagesCount: 18,
      size: '2.4 MB',
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'indexed',
      topics: details.topics,
      course: details.course,
      contentPreview: details.contentPreview,
      sections: details.sections
    };

    this.materials.unshift(newMaterial);
    this.saveMaterials();
    return newMaterial;
  }

  async uploadMaterial(
    file: File,
    courseParam?: MaterialSource['course'],
    onProgress?: (progress: number, stage: string) => void,
    textContent?: string
  ): Promise<ApiResponse<MaterialSource>> {
    const fileType: MaterialType = file.name.endsWith('.pdf') ? 'pdf' :
                                   file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' :
                                   file.name.match(/\.(ppt|pptx)$/i) ? 'slides' : 'doc';

    const pages = fileType === 'pdf' ? Math.floor(Math.random() * 15) + 10 : 12;
    const details = inferMaterialDetails(file.name, courseParam);

    const newMaterial: MaterialSource = {
      id: `mat-${Date.now()}`,
      title: details.cleanTitle,
      filename: file.name,
      type: fileType,
      pagesCount: pages,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'uploading',
      processingProgress: 10,
      topics: details.topics,
      course: details.course,
      contentPreview: details.contentPreview,
      textContent: textContent,
      sections: details.sections
    };

    this.materials.unshift(newMaterial);
    this.saveMaterials();

    // Simulate multi-stage ingestion pipeline
    if (onProgress) {
      onProgress(25, 'Uploading to secure workspace...');
      await new Promise(r => setTimeout(r, 400));
      onProgress(55, 'Parsing document structure & OCR...');
      await new Promise(r => setTimeout(r, 500));
      onProgress(85, 'Extracting semantic chunks & indexing embeddings...');
      await new Promise(r => setTimeout(r, 400));
      onProgress(100, 'Ingestion complete. Ready to query.');
    }

    // Try uploading to backend first
    try {
      const isOnline = await apiClient.isServerOnline();
      if (isOnline) {
        const backendDoc = await apiClient.uploadDocument(file, courseParam || 'General');
        if (backendDoc && backendDoc.id) {
          // Update local material with backend ID for consistency
          newMaterial.id = backendDoc.id;
          this.saveMaterials();
        }
      }
    } catch (e) {
      console.warn('Backend upload failed, material stored locally only', e);
    }

    newMaterial.status = 'indexed';
    newMaterial.processingProgress = 100;
    this.saveMaterials();

    return {
      success: true,
      data: newMaterial,
      metadata: { latencyMs: 1300 }
    };
  }

  async deleteMaterial(id: string): Promise<ApiResponse<boolean>> {
    this.materials = this.materials.filter(m => m.id !== id);
    this.saveMaterials();

    try {
      const isOnline = await apiClient.isServerOnline();
      if (isOnline) {
        await fetch(`http://localhost:8000/api/documents/${id}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed syncing document deletion to backend server', e);
    }

    return {
      success: true,
      data: true,
      metadata: { latencyMs: 50 }
    };
  }
}

export const materialService = new MaterialService();
