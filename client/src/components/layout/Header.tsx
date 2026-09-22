import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Sun, Moon, Menu, BookOpen, Sparkles, HelpCircle, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MaterialUploadModal } from '../materials/MaterialUploadModal';

export const Header: React.FC = () => {
  const {
    currentRoute,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    setIsMobileDrawerOpen,
    setCurrentRoute,
    materials,
    openDocumentViewer,
    setPrefilledPrompt,
    startQuiz,
    goBack,
    canGoBack
  } = useApp();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  const matchingMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenMaterial = (materialId: string, course?: string, title?: string) => {
    if (currentRoute === 'quiz') {
      startQuiz({
        course: course || 'Operating Systems',
        topic: title || searchQuery,
        questionCount: 5,
        difficulty: 'intermediate',
        questionType: 'all'
      });
    } else {
      openDocumentViewer(materialId, 1);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleAskAITutor = () => {
    setPrefilledPrompt(`Can you explain "${searchQuery}" based on my course materials?`);
    setCurrentRoute('ai-tutor');
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleLaunchQuiz = () => {
    startQuiz({
      course: 'Operating Systems',
      topic: searchQuery,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header
        style={{
          height: '56px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        {/* Left: Mobile Toggle, Universal Back Button & Global Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '620px' }}>
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="btn btn-ghost btn-icon mobile-only"
            aria-label="Open navigation menu"
            style={{ display: 'none' }}
          >
            <Menu size={18} />
          </button>

          {/* Universal Back Button */}
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: canGoBack ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              opacity: canGoBack ? 1 : 0.45,
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            title={canGoBack ? 'Back to previous page' : 'No previous page'}
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>

          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="input-text"
              placeholder="Search concepts, materials, topics (e.g. 'Deadlock', 'Linear Regression')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
              style={{
                paddingLeft: '32px',
                paddingRight: '60px',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: isDropdownOpen ? 'var(--accent-primary-border)' : 'transparent'
              }}
            />

            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setIsDropdownOpen(false); }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                ⌘K
              </span>
            )}

            {/* Interactive Search Results Dropdown Overlay */}
            {isDropdownOpen && searchQuery.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 100,
                  maxHeight: '380px',
                  overflowY: 'auto'
                }}
              >
                {/* Matching Materials */}
                <div style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Matching Materials ({matchingMaterials.length})
                </div>

                {matchingMaterials.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    {matchingMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => handleOpenMaterial(mat.id, mat.course, mat.title)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {currentRoute === 'quiz' ? (
                            <HelpCircle size={14} color="var(--color-warning)" />
                          ) : (
                            <BookOpen size={14} color="var(--accent-primary)" />
                          )}
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {currentRoute === 'quiz' ? `Take Quiz: ${mat.title}` : mat.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              {mat.course} • {currentRoute === 'quiz' ? 'Click to generate quiz on this topic' : mat.filename}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={14} color="var(--text-tertiary)" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px', fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    No exact title match. Use AI Tutor search below:
                  </div>
                )}

                {/* AI Quick Actions */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={handleAskAITutor}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-primary-light)',
                      border: '1px solid var(--accent-primary-border)',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      fontSize: '0.785rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Ask AI Tutor: "{searchQuery}"</span>
                  </button>

                  <button
                    onClick={handleLaunchQuiz}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.785rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <HelpCircle size={14} color="var(--color-warning)" />
                    <span>Generate Quiz on "{searchQuery}"</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Upload size={14} />
            <span>Upload Material</span>
          </button>

          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {isUploadModalOpen && (
        <MaterialUploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </>
  );
};
