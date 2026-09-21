import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { quizService, ALL_QUIZ_QUESTIONS } from '../services/quizService';
import { progressService } from '../services/progressService';
import { QuizConfig, QuizQuestion, QuizResult, QuizSubmission } from '../types/quiz';
import { QuizConfigModal } from '../components/quiz/QuizConfigModal';
import { QuizQuestionView } from '../components/quiz/QuizQuestionView';
import { QuizResultsView } from '../components/quiz/QuizResultsView';

export const QuizScreen: React.FC = () => {
  const { activeQuizConfig } = useApp();

  const [quizState, setQuizState] = useState<'config' | 'in_progress' | 'results'>('config');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

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

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      {quizState === 'config' && (
        <div style={{ padding: '40px 20px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
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

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Academic Knowledge Assessment
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Test your conceptual grasp across your indexed study materials. Receive immediate diagnostic breakdown and weak-point remediation.
          </p>

          <button
            onClick={() => handleStartQuiz({ questionCount: 5, difficulty: 'intermediate', questionType: 'all', course: 'Operating Systems' })}
            className="btn btn-primary btn-lg"
            style={{ gap: '8px' }}
          >
            <Plus size={18} />
            <span>Launch 5-Question Quiz</span>
          </button>
        </div>
      )}

      {quizState === 'in_progress' && questions.length > 0 && (
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

      {quizState === 'results' && result && (
        <QuizResultsView
          result={result}
          onRetake={() => setQuizState('config')}
        />
      )}
    </div>
  );
};
