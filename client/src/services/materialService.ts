import { MaterialSource, MaterialType } from '../types/material';
import { ApiResponse } from './apiTypes';

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

class MaterialService {
  private materials: MaterialSource[] = [...INITIAL_MATERIALS];

  async getMaterials(): Promise<ApiResponse<MaterialSource[]>> {
    return {
      success: true,
      data: [...this.materials],
      metadata: { latencyMs: 65 }
    };
  }

  async getMaterialById(id: string): Promise<ApiResponse<MaterialSource | null>> {
    const item = this.materials.find(m => m.id === id) || null;
    return {
      success: !!item,
      data: item,
      metadata: { latencyMs: 40 }
    };
  }

  async uploadMaterial(
    file: File,
    course: MaterialSource['course'] = 'Operating Systems',
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ApiResponse<MaterialSource>> {
    const fileType: MaterialType = file.name.endsWith('.pdf') ? 'pdf' :
                                   file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' :
                                   file.name.match(/\.(ppt|pptx)$/i) ? 'slides' : 'doc';

    const newMaterial: MaterialSource = {
      id: `mat-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      filename: file.name,
      type: fileType,
      pagesCount: fileType === 'pdf' ? Math.floor(Math.random() * 20) + 12 : undefined,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: 'Just now',
      status: 'uploading',
      processingProgress: 10,
      topics: ['Document Ingestion', 'Knowledge Indexing'],
      course,
      contentPreview: 'Processing document structure, OCR embeddings, and knowledge chunks...'
    };

    this.materials.unshift(newMaterial);

    // Simulate multi-stage ingestion pipeline
    if (onProgress) {
      onProgress(25, 'Uploading to secure workspace...');
      await new Promise(r => setTimeout(r, 600));
      onProgress(55, 'Parsing document structure & OCR...');
      await new Promise(r => setTimeout(r, 700));
      onProgress(85, 'Extracting semantic chunks & indexing embeddings...');
      await new Promise(r => setTimeout(r, 600));
      onProgress(100, 'Ingestion complete. Ready to query.');
    }

    newMaterial.status = 'indexed';
    newMaterial.processingProgress = 100;
    newMaterial.topics = ['Concept Extraction', 'Core Lecture Notes', 'Verified Citations'];

    return {
      success: true,
      data: newMaterial,
      metadata: { latencyMs: 2000 }
    };
  }

  async deleteMaterial(id: string): Promise<ApiResponse<boolean>> {
    this.materials = this.materials.filter(m => m.id !== id);
    return {
      success: true,
      data: true,
      metadata: { latencyMs: 50 }
    };
  }
}

export const materialService = new MaterialService();
