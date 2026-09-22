import { QuizConfig, QuizQuestion, QuizResult, QuizSubmission } from '../types/quiz';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';

export const ALL_QUIZ_QUESTIONS: QuizQuestion[] = [
  // OS Deadlocks
  {
    id: 'q-os-1',
    course: 'Operating Systems',
    topic: 'Deadlock',
    type: 'mcq',
    questionText: 'Which of the following conditions is NOT one of the four necessary Coffman conditions for a deadlock to occur?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemptive Resource Allocation',
      'Circular Wait'
    ],
    correctOptionIndex: 2,
    explanation: 'The condition is NO PREEMPTION (resources cannot be preempted). If preemptive resource allocation is allowed, deadlocks are prevented.',
    sourceDoc: 'OS_Unit3_Deadlocks.pdf',
    sourcePage: 18
  },
  {
    id: 'q-os-2',
    course: 'Operating Systems',
    topic: 'Deadlock Detection',
    type: 'mcq',
    questionText: 'In a Resource Allocation Graph where every resource type has exactly ONE instance, what does a cycle indicate?',
    options: [
      'Deadlock might exist, but not guaranteed',
      'A deadlock definitely exists (necessary and sufficient condition)',
      'The system is in a safe state',
      'Starvation has occurred without deadlock'
    ],
    correctOptionIndex: 1,
    explanation: 'When every resource has only a single instance, the existence of a cycle in the RAG is both necessary and sufficient for a deadlock.',
    sourceDoc: 'OS_Unit3_Deadlocks.pdf',
    sourcePage: 42
  },
  {
    id: 'q-os-3',
    course: 'Operating Systems',
    topic: 'Banker Algorithm',
    type: 'mcq',
    questionText: 'Dijkstra’s Banker’s algorithm is primarily utilized for which OS strategy?',
    options: [
      'Deadlock Prevention',
      'Deadlock Avoidance',
      'Deadlock Detection & Recovery',
      'Deadlock Ignorance (Ostrich Algorithm)'
    ],
    correctOptionIndex: 1,
    explanation: 'Banker\'s Algorithm dynamically inspects allocation states to avoid unsafe states before granting requests.',
    sourceDoc: 'OS_Unit3_Deadlocks.pdf',
    sourcePage: 31
  },
  // Machine Learning
  {
    id: 'q-ml-1',
    course: 'Machine Learning',
    topic: 'Linear Regression',
    type: 'mcq',
    questionText: 'In Linear Regression, what happens if the learning rate α is chosen to be excessively large during Gradient Descent?',
    options: [
      'Convergence will take too many iterations',
      'The cost function will overshoot the minimum and diverge',
      'The model will severely overfit training samples',
      'Gradient descent will get trapped in local saddle points'
    ],
    correctOptionIndex: 1,
    explanation: 'An oversized learning rate causes weights to oscillate with increasing amplitude, overshooting the convex bowl minimum and diverging.',
    sourceDoc: 'Machine Learning — Linear Regression.pdf',
    sourcePage: 12
  },
  {
    id: 'q-ml-2',
    course: 'Machine Learning',
    topic: 'Cost Functions',
    type: 'mcq',
    questionText: 'Why is Mean Squared Error (MSE) preferred over Mean Absolute Error (MAE) as the loss function in standard Linear Regression?',
    options: [
      'MSE is immune to outliers',
      'MSE yields a convex, continuously differentiable loss surface with a single global minimum',
      'MSE is faster to compute without matrix multiplications',
      'MSE prevents multicollinearity in features'
    ],
    correctOptionIndex: 1,
    explanation: 'MSE produces a smooth paraboloid convex function whose derivative is linear, enabling straightforward analytical and gradient descent solutions.',
    sourceDoc: 'Machine Learning — Linear Regression.pdf',
    sourcePage: 4
  },
  // DBMS Normalization
  {
    id: 'q-dbms-1',
    course: 'DBMS',
    topic: 'Normalization',
    type: 'mcq',
    questionText: 'What distinguishes Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF)?',
    options: [
      '3NF permits transitive dependencies whereas BCNF eliminates partial dependencies',
      'In 3NF, if X -> A, A can be a prime attribute; in BCNF, X must strictly be a Superkey for all dependencies',
      'BCNF preserves all functional dependencies while 3NF does not',
      'BCNF applies only to non-relational document stores'
    ],
    correctOptionIndex: 1,
    explanation: '3NF has an exception allowing prime attributes on the right-hand side. BCNF removes this relaxation, mandating LHS is always a superkey.',
    sourceDoc: 'DBMS — Normalization Notes.pdf',
    sourcePage: 14
  },
  // Java OOP
  {
    id: 'q-java-1',
    course: 'Java OOP',
    topic: 'Polymorphism',
    type: 'mcq',
    questionText: 'In Java, dynamic method dispatch is resolved at which stage?',
    options: [
      'Bytecode compile-time via method overloading',
      'Runtime using the actual object instance’s virtual method table (vtable)',
      'Classloading time by the JVM verification engine',
      'Garbage collection mark-and-sweep cycle'
    ],
    correctOptionIndex: 1,
    explanation: 'Dynamic method dispatch occurs at runtime when the JVM invokes the method implementation associated with the object\'s concrete class type.',
    sourceDoc: 'Java OOP Lecture 08.pdf',
    sourcePage: 8
  }
];

class QuizService {
  async generateQuiz(config: QuizConfig): Promise<ApiResponse<QuizQuestion[]>> {
    const isOnline = await apiClient.isServerOnline();
    if (isOnline) {
      try {
        const topicName = config.topic || (config.course && config.course !== 'All Courses' ? config.course : 'General Academic Study');
        const backendQuiz = await apiClient.generateQuiz({
          topic: topicName,
          num_questions: config.questionCount || 5,
          difficulty: config.difficulty || 'Medium',
        });
        if (backendQuiz && backendQuiz.questions && backendQuiz.questions.length > 0) {
          const parsedQuestions: QuizQuestion[] = backendQuiz.questions.map((q: any, idx: number) => ({
            id: `q-backend-${Date.now()}-${idx}`,
            course: config.course || 'General',
            topic: q.topic || topicName,
            type: 'mcq',
            questionText: q.question_text,
            options: q.options ? q.options.map((opt: any) => opt.text || opt) : [],
            correctOptionIndex: q.correct_option_id === 'A' ? 0 : q.correct_option_id === 'B' ? 1 : q.correct_option_id === 'C' ? 2 : 3,
            explanation: q.explanation || 'Backend grounded explanation.',
            sourceDoc: config.sourceId || 'Course Notes',
            sourcePage: 1
          }));
          return {
            success: true,
            data: parsedQuestions,
            metadata: { latencyMs: 300 }
          };
        }
      } catch (err) {
        console.warn('Backend quiz API call failed, using dynamic local generation:', err);
      }
    }

    let filtered = ALL_QUIZ_QUESTIONS;

    if (config.sourceId) {
      // Find the material dynamically
      const materials = await import('./materialService').then(m => m.materialService.getMaterialsSync());
      const source = materials.find(m => m.id === config.sourceId);
      
      if (source) {
        // Generate dynamic questions based on this document's text or topics
        const dynamicQuestions: QuizQuestion[] = [];
        const baseTitle = source.title;
        const textContent = source.textContent || source.contentPreview || 'General concepts in ' + baseTitle;
        const words = textContent.split(/\s+/).filter(w => w.length > 5);
        
        for (let i = 0; i < config.questionCount; i++) {
          const randomWord = words[Math.floor(Math.random() * words.length)] || baseTitle;
          dynamicQuestions.push({
            id: `q-dyn-${Date.now()}-${i}`,
            course: source.course,
            topic: source.topics[i % source.topics.length] || baseTitle,
            type: 'mcq',
            questionText: `Based on "${baseTitle}", what is the significance of the concept related to "${randomWord.replace(/[^a-zA-Z]/g, '')}"?`,
            options: [
              `It is the primary methodology used for analysis.`,
              `It refers to a key principle or theoretical foundation.`,
              `It was discussed as a historical anecdote.`,
              `It represents a common edge case or exception.`
            ],
            correctOptionIndex: 1,
            explanation: `This is a dynamically generated question based on the document text containing the word "${randomWord}".`,
            sourceDoc: source.filename,
            sourcePage: 1
          });
        }
        return {
          success: true,
          data: dynamicQuestions,
          metadata: { latencyMs: 350 }
        };
      }
    }

    if (config.course && config.course !== 'All Courses') {
      filtered = filtered.filter(q => q.course === config.course);
    }
    if (config.topic) {
      const topicLower = config.topic.toLowerCase();
      const specific = filtered.filter(q => q.topic.toLowerCase().includes(topicLower) || q.questionText.toLowerCase().includes(topicLower));
      if (specific.length > 0) filtered = specific;
    }

    // If needed, cycle or pad to question count
    let result = [...filtered];
    if (result.length < config.questionCount) {
      // pad with general questions
      const pool = ALL_QUIZ_QUESTIONS.filter(q => !result.some(r => r.id === q.id));
      result = [...result, ...pool].slice(0, config.questionCount);
    } else {
      result = result.slice(0, config.questionCount);
    }

    return {
      success: true,
      data: result,
      metadata: { latencyMs: 350 }
    };
  }

  async evaluateQuiz(
    questions: QuizQuestion[],
    submissions: QuizSubmission[],
    timeSpentSec: number,
    difficulty: QuizConfig['difficulty'] = 'intermediate'
  ): Promise<ApiResponse<QuizResult>> {
    const total = questions.length;
    let correct = 0;
    const strongTopics = new Set<string>();
    const weakTopics = new Set<string>();
    const recommendedRevision: QuizResult['recommendedRevision'] = [];

    questions.forEach((q, idx) => {
      const sub = submissions[idx];
      const isCorrect = sub && sub.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) {
        correct++;
        strongTopics.add(q.topic);
      } else {
        weakTopics.add(q.topic);
        recommendedRevision.push({
          topic: q.topic,
          action: `Review ${q.topic} definitions & complete practice flashcards`,
          sourceDoc: q.sourceDoc || 'Course Materials',
          sourcePage: q.sourcePage
        });
      }
    });

    const scorePct = Math.round((correct / total) * 100);

    const result: QuizResult = {
      id: `quiz-res-${Date.now()}`,
      title: questions[0]?.course ? `${questions[0].course} Assessment` : 'Multimodal Knowledge Assessment',
      date: 'Today',
      totalQuestions: total,
      correctAnswers: correct,
      scorePercentage: scorePct,
      timeSpentSec,
      difficulty,
      strongTopics: Array.from(strongTopics),
      weakTopics: Array.from(weakTopics),
      recommendedRevision,
      answers: submissions
    };

    return {
      success: true,
      data: result,
      metadata: { latencyMs: 200 }
    };
  }
}

export const quizService = new QuizService();
