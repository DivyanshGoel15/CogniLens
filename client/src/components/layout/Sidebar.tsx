import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  FileText,
  ScanEye,
  CheckSquare,
  Layers,
  Calendar,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Plus
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentRoute, setCurrentRoute, isSidebarCollapsed, setIsSidebarCollapsed, userProfile, startNewStudySession } = useApp();

  const primaryNav: NavItem[] = [
    { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, badge: 'Agentic' },
    { route: 'materials', label: 'Materials Hub', icon: BookOpen },
    { route: 'document-viewer', label: 'Document Reader', icon: FileText },
    { route: 'image-analysis', label: 'Multimodal Vision', icon: ScanEye, badge: 'Vision' },
    { route: 'quiz', label: 'Quizzes', icon: CheckSquare },
    { route: 'flashcards', label: 'Flashcards', icon: Layers },
    { route: 'study-plan', label: 'Study Plan', icon: Calendar },
    { route: 'progress', label: 'Progress & Mastery', icon: TrendingUp }
  ];

  return (
    <aside
      className={`sidebar-root ${isSidebarCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isSidebarCollapsed ? '68px' : '250px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width var(--transition-normal)',
        zIndex: 40,
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: isSidebarCollapsed ? '20px 14px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-sidebar)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
            }}
          >
            <GraduationCap size={20} />
          </div>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                CogniLens AI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-sidebar-muted)', lineHeight: 1 }}>
                Multimodal Study Agent
              </div>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            style={{
              color: 'var(--text-sidebar-muted)',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => setCurrentRoute(item.route)}
              title={isSidebarCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isSidebarCollapsed ? '10px 0' : '9px 12px',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-sidebar-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'all var(--transition-fast)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
                  e.currentTarget.style.color = 'var(--text-sidebar-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-sidebar-secondary)';
                }
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-primary-border)' : 'currentColor'} />
              {!isSidebarCollapsed && (
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
              {!isSidebarCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Expand Button if collapsed */}
      {isSidebarCollapsed && (
        <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            style={{
              color: 'var(--text-sidebar-secondary)',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-sidebar-surface)'
            }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Quick Action Button */}
      {!isSidebarCollapsed && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-sidebar)' }}>
          <button
            onClick={startNewStudySession}
            className="btn btn-primary"
            style={{ width: '100%', padding: '9px 12px', fontSize: '0.8125rem' }}
          >
            <Plus size={15} />
            <span>New Study Session</span>
          </button>
        </div>
      )}

      {/* Bottom Footer Section */}
      <div
        style={{
          padding: isSidebarCollapsed ? '12px 8px' : '12px 14px',
          borderTop: '1px solid var(--border-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <button
          onClick={() => setCurrentRoute('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: isSidebarCollapsed ? '8px 0' : '7px 10px',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--radius-md)',
            color: currentRoute === 'settings' ? '#ffffff' : 'var(--text-sidebar-muted)',
            fontSize: '0.8125rem'
          }}
        >
          <Settings size={16} />
          {!isSidebarCollapsed && <span>Settings</span>}
        </button>

        {/* User profile avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isSidebarCollapsed ? '8px 0' : '8px 10px',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            marginTop: '4px'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: userProfile.avatarBgColor || '#3b82f6',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {userProfile.avatarInitials || userProfile.fullName.charAt(0).toUpperCase() || 'S'}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {userProfile.fullName || 'Student Member'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-sidebar-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {userProfile.major} • {userProfile.academicYear}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
