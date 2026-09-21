import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiService, INITIAL_CONVERSATION_MESSAGES } from '../services/aiService';
import { ChatMessage as ChatMessageType, SourceReference, MultimodalAttachment } from '../types/chat';
import { ChatMessage } from '../components/ai-tutor/ChatMessage';
import { MultimodalComposer } from '../components/ai-tutor/MultimodalComposer';
import { GroundingContextPanel } from '../components/ai-tutor/GroundingContextPanel';

interface ConversationSessionItem {
  id: string;
  title: string;
  courseTag: string;
  updatedAt: string;
  messages: ChatMessageType[];
}

const PRESET_SESSIONS: ConversationSessionItem[] = [
  {
    id: 'sess-os-deadlock',
    title: 'OS Deadlock Coffman Conditions',
    courseTag: 'Operating Systems',
    updatedAt: '10m ago',
    messages: [
      ...INITIAL_CONVERSATION_MESSAGES,
      {
        id: 'msg-user-1',
        role: 'user',
        content: 'Explain deadlock using my OS notes.',
        timestamp: '10:02 AM'
      },
      {
        id: 'msg-ai-1',
        role: 'assistant',
        content: `A **Deadlock** is a permanent blocking condition in an Operating System where a set of processes are unable to proceed because each process is holding a resource and waiting to acquire another resource currently held by another process in the same set.\n\n### The 4 Necessary Coffman Conditions:\n1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (only one process can use it at a time).\n2. **Hold and Wait**: A process is holding at least one resource while waiting to acquire additional resources held by other processes.\n3. **No Preemption**: Resources cannot be forcibly taken from a process; they can only be released voluntarily.\n4. **Circular Wait**: A closed chain of processes $\{P_0, P_1, \\dots, P_n\}$ exists such that $P_0$ is waiting for a resource held by $P_1$, and $P_n$ is waiting for a resource held by $P_0$.\n\n### Deadlock Detection via Resource Allocation Graph (RAG):\nIn a system where each resource type has **exactly one instance**, the presence of a **cycle in the Resource Allocation Graph (RAG)** is both a necessary and sufficient condition for deadlock.`,
        timestamp: '10:02 AM',
        agentActivity: {
          taskTitle: 'Grounding concepts in course materials',
          status: 'completed',
          steps: [
            { id: 's1', label: 'Scanned OS_Unit3_Deadlocks.pdf', status: 'completed', detail: 'Evaluated semantic chunk vectors' },
            { id: 's2', label: 'Retrieved Coffman conditions (p. 18) & RAG cycles (p. 42)', status: 'completed' },
            { id: 's3', label: 'Synthesized grounded academic explanation', status: 'completed' }
          ]
        },
        sources: [
          {
            id: 'src-os-1',
            documentId: 'mat-os-unit3',
            documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
            filename: 'OS_Unit3_Deadlocks.pdf',
            page: 18,
            snippet: 'Four Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait must hold simultaneously.',
            confidence: 0.98
          },
          {
            id: 'src-os-2',
            documentId: 'mat-os-unit3',
            documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
            filename: 'OS_Unit3_Deadlocks.pdf',
            page: 42,
            snippet: 'Resource Allocation Graph & Deadlock Detection: In single-instance resource systems, a cycle implies deadlock.',
            confidence: 0.95
          }
        ],
        suggestedActions: [
          { id: 'act-q-os', label: 'Create 5-Question Quiz on Deadlocks', actionType: 'create_quiz', payload: { course: 'Operating Systems', topic: 'Deadlock' } },
          { id: 'act-f-os', label: 'Review Flashcards for Coffman Conditions', actionType: 'create_flashcards', payload: { topic: 'Deadlock' } },
          { id: 'act-v-os', label: 'Open OS_Unit3.pdf Page 42 in Reader', actionType: 'open_source', payload: { documentId: 'mat-os-unit3', page: 42 } }
        ]
      }
    ]
  },
  {
    id: 'sess-ml-loss',
    title: 'Linear Regression MSE Formulation',
    courseTag: 'Machine Learning',
    updatedAt: '2h ago',
    messages: [
      {
        id: 'msg-ml-u',
        role: 'user',
        content: 'Why do we use Mean Squared Error as the cost function for Linear Regression?',
        timestamp: '8:45 AM'
      },
      {
        id: 'msg-ml-a',
        role: 'assistant',
        content: `### Mean Squared Error (MSE) Rationale\n\nMean Squared Error $J(\\theta)$ is chosen for Linear Regression due to several mathematical advantages:\n\n1. **Convexity**: MSE produces a smooth, bowl-shaped convex paraboloid with a unique global minimum and no local minima.\n2. **Differentiability**: The derivative of squared error is continuous and linear, allowing gradient descent to take smooth steps.\n3. **Penalization of Outliers**: Squaring errors penalizes large residuals more heavily than linear error metrics like MAE.`,
        timestamp: '8:45 AM',
        sources: [
          {
            id: 'src-ml-1',
            documentId: 'mat-ml-linear',
            documentTitle: 'Machine Learning — Linear Regression & Cost Functions',
            filename: 'Machine Learning — Linear Regression.pdf',
            page: 4,
            snippet: 'MSE convex loss surface properties and gradient descent derivation.',
            confidence: 0.99
          }
        ]
      }
    ]
  },
  {
    id: 'sess-dbms-norm',
    title: '3NF vs BCNF Decomposition',
    courseTag: 'DBMS',
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'msg-db-u',
        role: 'user',
        content: 'When is a table in 3NF but NOT in BCNF?',
        timestamp: 'Yesterday'
      },
      {
        id: 'msg-db-a',
        role: 'assistant',
        content: `A relation is in **3NF but NOT in BCNF** when it contains a functional dependency $X \\to A$ where:\n\n- $X$ is **NOT a Superkey**, but\n- $A$ is a **Prime Attribute** (part of some candidate key).\n\nBCNF strictly forbids non-superkey determinants on the left side, eliminating all anomalies at the cost of sometimes losing dependency preservation.`,
        timestamp: 'Yesterday',
        sources: [
          {
            id: 'src-dbms-1',
            documentId: 'mat-dbms-norm',
            documentTitle: 'DBMS — Normalization Notes & Functional Dependencies',
            filename: 'DBMS — Normalization Notes.pdf',
            page: 14,
            snippet: '3NF allows prime attribute on RHS; BCNF requires LHS to always be superkey.',
            confidence: 0.97
          }
        ]
      }
    ]
  }
];

export const AITutorScreen: React.FC = () => {
  const { prefilledPrompt } = useApp();
  const [sessions, setSessions] = useState<ConversationSessionItem[]>(PRESET_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(PRESET_SESSIONS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages]);

  const handleNewSession = () => {
    const newSess: ConversationSessionItem = {
      id: `sess-${Date.now()}`,
      title: 'New Study Conversation',
      courseTag: 'General',
      updatedAt: 'Just now',
      messages: [...INITIAL_CONVERSATION_MESSAGES]
    };
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
  };

  const handleSendMessage = async (text: string, attachments: MultimodalAttachment[]) => {
    const userMsg: ChatMessageType = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments
    };

    // Update active session with user message
    const placeholderAiMsgId = `ai-${Date.now()}`;
    const initialAiMsg: ChatMessageType = {
      id: placeholderAiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: s.messages.length <= 1 ? text.slice(0, 32) + '...' : s.title,
            messages: [...s.messages, userMsg, initialAiMsg]
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    try {
      await aiService.processUserMessage(
        text,
        attachments,
        [],
        (event) => {
          if (event.type === 'activity_step' && event.activity) {
            setSessions(prev =>
              prev.map(s => {
                if (s.id === activeSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m => m.id === placeholderAiMsgId ? { ...m, agentActivity: event.activity } : m)
                  };
                }
                return s;
              })
            );
          } else if (event.type === 'chunk' && event.textChunk) {
            setSessions(prev =>
              prev.map(s => {
                if (s.id === activeSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m => m.id === placeholderAiMsgId ? { ...m, content: event.textChunk || '' } : m)
                  };
                }
                return s;
              })
            );
          } else if (event.type === 'complete' && event.fullResponse) {
            setSessions(prev =>
              prev.map(s => {
                if (s.id === activeSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === placeholderAiMsgId
                        ? {
                            ...m,
                            content: event.fullResponse!.answer,
                            sources: event.fullResponse!.sources,
                            agentActivity: event.fullResponse!.agentActivity,
                            suggestedActions: event.fullResponse!.suggestedActions,
                            isStreaming: false
                          }
                        : m
                    )
                  };
                }
                return s;
              })
            );
          }
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Collect all active source references from messages in this session
  const allSessionSources: SourceReference[] = activeSession.messages
    .flatMap(m => m.sources || [])
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', height: 'calc(100vh - 88px)', overflow: 'hidden' }}>
      {/* 1. LEFT SIDEBAR: Recent Conversations */}
      <aside
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Conversations
          </span>
          <button
            onClick={handleNewSession}
            className="btn btn-primary btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
            title="New Conversation"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>

        <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <button
                key={sess.id}
                onClick={() => setActiveSessionId(sess.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--bg-surface-subtle)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.8125rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sess.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                  <span>{sess.courseTag}</span>
                  <span>{sess.updatedAt}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)', position: 'relative' }}>
        {/* Messages List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeSession.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Multimodal Composer Box */}
        <MultimodalComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          prefilledPrompt={prefilledPrompt}
        />
      </main>

      {/* 3. RIGHT CONTEXT PANEL */}
      <GroundingContextPanel recentSources={allSessionSources} />
    </div>
  );
};
