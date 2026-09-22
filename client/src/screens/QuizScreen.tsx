import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Loader2, Search, BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { quizService } from '../services/quizService';
import { progressService } from '../services/progressService';
import { QuizConfig, QuizQuestion, QuizResult, QuizSubmission } from '../types/quiz';
import { QuizConfigModal } from '../components/quiz/QuizConfigModal';
import { QuizQuestionView } from '../components/quiz/QuizQuestionView';
import { QuizResultsView } from '../components/quiz/QuizResultsView';

export const QuizScreen: React.FC = () => {
  const { activeQuizConfig, materials } = useApp();

  const [quizState, setQuizState] = useState<'config' | 'in_progress' | 'results'>('config');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [quizSearchTopic, setQuizSearchTopic] = useState('');

  const popularTopics = [
    { course: 'Operating Systems', topic: 'Deadlock & Coffman Conditions', count: 5 },
    { course: 'Machine Learning', topic: 'Linear Regression & Cost Functions', count: 5 },
    { course: 'DBMS', topic: 'Relational Normalization & 3NF', count: 5 },
    { course: 'Java OOP', topic: 'Polymorphism & Abstraction', count: 5 },
    { course: 'Computer Networks', topic: 'TCP 3-Way Handshake & OSI Layers', count: 5 }
  ];

  const handleStartQuiz = async (config: QuizConfig) => {
    setIsLoading(true);
    try {
      const res = await quizService.generateQuiz(config);
      if (res.success && res.data.length > 0) {
        setQuestions(res.data);
        setCurrentIndex(0);
        setSubmissions([]);
        setResult(null);
        setStartTime(Date.now());
        setQuizState('in_progress');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeQuizConfig) {
      handleStartQuiz(activeQuizConfig);
    }
  }, [activeQuizConfig]);

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    const isCorrect = currentQ.correctOptionIndex === optionIndex;

    const newSub: QuizSubmission = {
      questionId: currentQ.id,
      selectedOptionIndex: optionIndex,
      isCorrect,
      timeSpentSec: Math.round((Date.now() - startTime) / 1000)
    };

    setSubmissions(prev => {
      const copy = [...prev];
      copy[currentIndex] = newSub;
      return copy;
    });
  };

  const handleFinishQuiz = async () => {
    setIsLoading(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const evalRes = await quizService.evaluateQuiz(questions, submissions, timeSpent);
      if (evalRes.success) {
        setResult(evalRes.data);
        setQuizState('results');

        // Record progress in learning state
        await progressService.recordQuizCompletion(
          evalRes.data.scorePercentage,
          questions[0]?.course || 'Operating Systems',
          evalRes.data.weakTopics[0]
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizSearchTopic.trim()) return;
    handleStartQuiz({
      course: 'Operating Systems',
      topic: quizSearchTopic,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(quizSearchTopic.toLowerCase()) ||
    m.course.toLowerCase().includes(quizSearchTopic.toLowerCase()) ||
    m.topics.some(t => t.toLowerCase().includes(quizSearchTopic.toLowerCase()))
  );

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      {quizState === 'config' && (
        <div style={{ padding: '32px 24px', maxWidth: '840px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--color-warning-subtle)',
                color: 'var(--color-warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <HelpCircle size={28} />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Academic Quiz & Knowledge Assessment
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
              Choose or search any topic to launch an instant grounded practice quiz. Tests your conceptual grasp with instant diagnostic feedback.
            </p>
          </div>

          {/* Search Quiz Topic Input */}
          <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '16px 20px', marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Search Any Topic for a Practice Quiz:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-text"
                  placeholder="Type a topic (e.g. 'Deadlock', 'Linear Regression', 'DBMS Normalization')..."
                  value={quizSearchTopic}
                  onChange={(e) => setQuizSearchTopic(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
                <Sparkles size={16} />
                <span>Start Quiz</span>
              </button>
            </div>

            {/* Quick Material Topic Results when searching */}
            {quizSearchTopic.trim() && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  Matching Course Topics ({filteredMaterials.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredMaterials.map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => handleStartQuiz({ course: mat.course, topic: mat.title, questionCount: 5, difficulty: 'intermediate', questionType: 'all' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HelpCircle size={16} color="var(--color-warning)" />
                        <div>
                          <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {mat.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            {mat.course} • 5 Questions
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} color="var(--text-tertiary)" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Featured Topic Quizzes */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Popular Course Quiz Topics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {popularTopics.map((pt) => (
                <div
                  key={pt.topic}
                  className="card"
                  onClick={() => handleStartQuiz({ course: pt.course, topic: pt.topic, questionCount: 5, difficulty: 'intermediate', questionType: 'all' })}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--accent-primary-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {pt.topic}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {pt.course} • {pt.count} Questions
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          </div>

          {/* Configure Custom Quiz Option */}
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn btn-secondary btn-md"
              style={{ gap: '8px' }}
            >
              <Plus size={16} />
              <span>Advanced Quiz Configuration (Custom Count / Difficulty)</span>
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={32} className="spin" color="var(--accent-primary)" />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Generating grounded questions...
          </div>
        </div>
      )}

      {quizState === 'in_progress' && questions.length > 0 && !isLoading && (
        <QuizQuestionView
          questions={questions}
          currentIndex={currentIndex}
          submissions={submissions}
          onSelectOption={handleSelectOption}
          onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          onNext={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          onFinish={handleFinishQuiz}
        />
      )}

      {quizState === 'results' && result && !isLoading && (
        <QuizResultsView
          result={result}
          onRetake={() => setQuizState('config')}
        />
      )}

      {showConfigModal && (
        <QuizConfigModal
          onStart={(config) => {
            setShowConfigModal(false);
            handleStartQuiz(config);
          }}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
};
