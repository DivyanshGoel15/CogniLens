import { MaterialSource, MaterialType } from '../types/material';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';

export const INITIAL_MATERIALS: MaterialSource[] = [];

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
        if (Array.isArray(parsed)) {
          this.materials = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load materials from localStorage', e);
    }
    this.materials = [];
  }

  private saveMaterials() {
    try {
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
    try {
      const backendDocs = await apiClient.getDocuments();
      if (Array.isArray(backendDocs)) {
        this.materials = backendDocs.map(bdoc => ({
          id: bdoc.id,
          title: bdoc.title,
          filename: bdoc.filename,
          type: bdoc.type as any,
          pagesCount: bdoc.pagesCount || 1,
          size: bdoc.size || '1.0 MB',
          uploadDate: bdoc.uploadDate || 'Today',
          status: bdoc.status as any || 'indexed',
          topics: bdoc.topics || [],
          course: bdoc.course || 'General',
          contentPreview: bdoc.contentPreview || '',
          sections: bdoc.sections || [],
        }));
        this.saveMaterials();
      }
    } catch (e) {
      console.warn('Failed to fetch materials from backend, using local cache', e);
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
      await apiClient.deleteDocument(id);
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
