import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  ScanEye,
  CheckSquare,
  Layers,
  Calendar,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  UserCheck,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingScreen: React.FC = () => {
  const { setCurrentRoute, login } = useApp();
  const [activeFeatureTab, setActiveFeatureTab] = useState<'tutor' | 'reader' | 'quiz' | 'streak'>('tutor');

  const handleDemoAccess = () => {
    login('student@cognilens.edu', 'Student Member');
    setCurrentRoute('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #0f172a)', color: 'var(--text-primary, #f8fafc)', fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* 1. TOP NAVIGATION BAR */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          backgroundColor: 'var(--bg-surface, rgba(15, 23, 42, 0.8))',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setCurrentRoute('landing')}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <GraduationCap size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              CogniLens <span style={{ color: '#3b82f6' }}>AI</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.875rem', fontWeight: 600 }}>
          <a href="#features" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Features</a>
          <a href="#workflow" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Architecture</a>
          <a href="#impact" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Analytics</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setCurrentRoute('login')}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px 16px', fontSize: '0.84375rem' }}
          >
            Sign In
          </button>
          <button
            onClick={() => setCurrentRoute('signup')}
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 18px', fontSize: '0.84375rem', gap: '6px' }}
          >
            <span>Get Started Free</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{ padding: '80px 24px 60px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '0.8125rem',
            fontWeight: 700,
            marginBottom: '24px'
          }}
        >
          <Sparkles size={14} />
          <span>Multimodal Agentic Learning & RAG Engine</span>
        </div>

        <h1 style={{ fontSize: '3.25rem', fontWeight: 850, lineHeight: 1.15, letterSpacing: '-0.03em', maxWidth: '900px', margin: '0 auto 20px', color: '#ffffff' }}>
          Master Complex Coursework with <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grounded AI Intelligence</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: '#94a3b8', maxWidth: '680px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          Upload PDF notes, solve LaTeX formulas, generate diagnostic quizzes, and review flashcards with a personal AI Tutor grounded in your exact syllabus.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentRoute('signup')}
            className="btn btn-primary btn-lg"
            style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700, gap: '8px' }}
          >
            <span>Create Free Account</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleDemoAccess}
            className="btn btn-secondary btn-lg"
            style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700, gap: '8px', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <Zap size={18} color="#f59e0b" />
            <span>Try Live Workspace Demo</span>
          </button>
        </div>

        {/* Feature Pill Highlights */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px', color: '#94a3b8', fontSize: '0.84375rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> No API Key Setup Required</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> Grounded in PDF Syllabi</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981" /> Dynamic Daily Streak Engine</span>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT SHOWCASE */}
      <section style={{ padding: '20px 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          className="card"
          style={{
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: '#1e293b',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Showcase Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#0f172a', padding: '8px' }}>
            <button
              onClick={() => setActiveFeatureTab('tutor')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeFeatureTab === 'tutor' ? '#1e293b' : 'transparent',
                color: activeFeatureTab === 'tutor' ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              <span>AI Agent Tutor</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('reader')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeFeatureTab === 'reader' ? '#1e293b' : 'transparent',
                color: activeFeatureTab === 'reader' ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FileText size={16} />
              <span>PDF Reader & RAG</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('quiz')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeFeatureTab === 'quiz' ? '#1e293b' : 'transparent',
                color: activeFeatureTab === 'quiz' ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckSquare size={16} />
              <span>Diagnostic Quizzes</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('streak')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeFeatureTab === 'streak' ? '#1e293b' : 'transparent',
                color: activeFeatureTab === 'streak' ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Flame size={16} />
              <span>Active Streak Engine</span>
            </button>
          </div>

          {/* Showcase Display Body */}
          <div style={{ padding: '36px 40px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {activeFeatureTab === 'tutor' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.84375rem', marginBottom: '8px' }}>
                  <Sparkles size={16} />
                  <span>Interactive Socratic & Grounded AI Tutor</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  Ask questions, derive LaTeX proofs, and analyze PDF notes seamlessly.
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
                  CogniLens connects to your uploaded course materials to synthesize answers with exact citations, page numbers, and action steps like generating targeted quizzes.
                </p>
                <div style={{ backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '0.84375rem', color: '#e2e8f0' }}>
                  <span style={{ color: '#60a5fa' }}>User:</span> Explain Coffman conditions for Operating Systems deadlocks.<br />
                  <span style={{ color: '#a855f7' }}>CogniLens Agent:</span> A deadlock requires 4 necessary conditions: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. <span style={{ color: '#10b981' }}>[Cited from OS_Unit3.pdf p. 18]</span>
                </div>
              </div>
            )}

            {activeFeatureTab === 'reader' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.84375rem', marginBottom: '8px' }}>
                  <FileText size={16} />
                  <span>Document Reader with Chunk Inspection</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  Read PDFs alongside intelligent semantic search and AI highlights.
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
                  Navigate page-by-page through textbooks, inspect vector embeddings, and select text to instantly ask the AI Tutor for explanations.
                </p>
                <div style={{ backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.84375rem', color: '#e2e8f0' }}>
                  📄 <strong>Operating Systems Notes.pdf</strong> — 42 Pages Vectorized & Indexed into Local Vector DB.
                </div>
              </div>
            )}

            {activeFeatureTab === 'quiz' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.84375rem', marginBottom: '8px' }}>
                  <CheckSquare size={16} />
                  <span>Automated Diagnostic Quizzes</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  Generate practice questions tailored to your exact weak areas.
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
                  Select question counts (5, 10, 20) and difficulty levels (Beginner, Intermediate, Advanced) to evaluate conceptual retention before exams.
                </p>
                <div style={{ backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.84375rem', color: '#e2e8f0' }}>
                  ❓ <strong>Deadlock Detection Quiz</strong> — 5 Questions • Instant Mastery Feedback & Score Breakdown.
                </div>
              </div>
            )}

            {activeFeatureTab === 'streak' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.84375rem', marginBottom: '8px' }}>
                  <Flame size={16} color="#f59e0b" />
                  <span>Dynamic Daily Active Streak Engine</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  Stay consistent with date-aware streak tracking and past 7-day logs.
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
                  Every day you read, quiz, or chat, your active streak advances automatically. Track past 7-day activity checkmarks on your dashboard.
                </p>
                <div style={{ backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.84375rem', color: '#e2e8f0' }}>
                  🔥 <strong>6 Days Consecutive Streak</strong> — Active study goal on track!
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FEATURE GRID SECTION */}
      <section id="features" style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Everything You Need for Academic Excellence
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
            Powered by a local FastAPI RAG server and modular frontend services.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[
            { icon: Sparkles, title: 'Agentic AI Tutor', desc: 'Socratic guided tutoring, LaTeX mathematical derivations, and grounded PDF citations.' },
            { icon: BookOpen, title: 'Materials Hub', desc: 'Centralized repository for PDF notes, slides, and syllabus documents with vector indexing.' },
            { icon: FileText, title: 'Document Reader', desc: 'Interactive PDF viewer with page jump, text selection HUD, and section bookmarks.' },
            { icon: ScanEye, title: 'Multimodal Vision', desc: 'Upload diagrams, charts, or handwritten notes for instant visual AI inspection.' },
            { icon: CheckSquare, title: 'Diagnostic Quizzes', desc: 'Customizable 5-20 question multiple-choice quizzes with instant answer rationale.' },
            { icon: Layers, title: 'Spaced Repetition', desc: 'Interactive flashcards with mastery rating controls for long-term memory retention.' },
            { icon: Calendar, title: 'Adaptive Study Plan', desc: 'Weekly milestone planner with priority badges and exam preparation checklists.' },
            { icon: TrendingUp, title: 'Analytics & Mastery', desc: 'Course-by-course mastery breakdown identifying weak topics before test day.' },
            { icon: Flame, title: 'Active Streak Engine', desc: 'Date-aware daily study tracking to keep your academic momentum going.' }
          ].map((feat, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: '28px',
                borderRadius: '16px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <feat.icon size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION FOOTER */}
      <section style={{ padding: '60px 24px 80px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '48px 32px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Ready to Accelerate Your Academic Learning?
          </h2>
          <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '28px' }}>
            Join CogniLens today and experience grounded AI tutoring tailored to your courses.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentRoute('signup')}
              className="btn btn-primary btn-lg"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              Create Free Account
            </button>
            <button
              onClick={handleDemoAccess}
              className="btn btn-secondary btn-lg"
              style={{ padding: '12px 24px', fontSize: '0.95rem', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              Enter Demo Workspace
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px', textAlign: 'center', fontSize: '0.8125rem', color: '#64748b' }}>
        CogniLens AI Multimodal Agent Workspace • © {new Date().getFullYear()} CogniLens. All rights reserved.
      </footer>
    </div>
  );
};
