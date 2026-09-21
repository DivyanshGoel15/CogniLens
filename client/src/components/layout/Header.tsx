import React, { useState } from 'react';
import { Search, Upload, Sun, Moon, Menu, Layers, CheckCircle, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MaterialUploadModal } from '../materials/MaterialUploadModal';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    setIsMobileDrawerOpen,
    setCurrentRoute
  } = useApp();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
        {/* Left: Mobile Toggle & Global Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '520px' }}>
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="btn btn-ghost btn-icon mobile-only"
            aria-label="Open navigation menu"
            style={{ display: 'none' }}
          >
            <Menu size={18} />
          </button>

          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-text"
              placeholder="Search concepts, documents, slides, formulas (e.g. 'Deadlock', 'MSE loss')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingRight: '60px',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'transparent'
              }}
            />
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
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* API Backend State Pill */}
          <div
            className="badge badge-neutral"
            style={{
              gap: '6px',
              padding: '4px 9px',
              fontSize: '0.725rem',
              color: 'var(--text-secondary)'
            }}
            title="Frontend Service Layer is modular and ready for Azure AI / RAG REST endpoints."
          >
            <Database size={12} color="var(--accent-primary)" />
            <span>API Layer: <strong style={{ color: 'var(--text-primary)' }}>Simulated / Ready</strong></span>
          </div>

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
