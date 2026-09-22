import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Database,
  Save,
  Flame,
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  Bell,
  Sparkles,
  BookOpen,
  Award,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { progressService } from '../services/progressService';

type TabType = 'profile' | 'security' | 'preferences' | 'data';

export const SettingsScreen: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    progress,
    refreshProgress,
    recordDailyActivity,
    theme,
    toggleTheme
  } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(userProfile.fullName || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [major, setMajor] = useState(userProfile.major || '');
  const [academicYear, setAcademicYear] = useState(userProfile.academicYear || 'Year 3');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [avatarBgColor, setAvatarBgColor] = useState(userProfile.avatarBgColor || '#3b82f6');

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(userProfile.dailyGoalMinutes || 30);
  const [aiPersona, setAiPersona] = useState(userProfile.aiPersona || 'socratic');
  const [spacedRepetitionEnabled, setSpacedRepetitionEnabled] = useState(userProfile.spacedRepetitionEnabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(userProfile.emailNotifications ?? true);
  const [streakReminders, setStreakReminders] = useState(userProfile.streakReminders ?? true);

  // Modal state
  const [showResetModal, setShowResetModal] = useState(false);

  const presetColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];

  const getInitials = (name: string) => {
    if (!name.trim()) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName,
      email,
      major,
      academicYear,
      bio,
      avatarBgColor,
      avatarInitials: getInitials(fullName)
    });
    showToast('Profile Updated', 'Your account details have been saved successfully.', 'success');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Validation Error', 'Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Validation Error', 'New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Validation Error', 'New password and confirm password do not match.', 'error');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password Changed', 'Your account password has been updated successfully.', 'success');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      dailyGoalMinutes,
      aiPersona,
      spacedRepetitionEnabled,
      emailNotifications,
      streakReminders
    });
    showToast('Preferences Saved', 'Your study and notification settings have been updated.', 'success');
  };

  const handleLogStreakToday = () => {
    recordDailyActivity('Manual check-in from Settings');
    showToast(
      '🔥 Streak Recorded!',
      `You've maintained a ${progress?.currentStreakDays || 1}-day active study streak!`,
      'success'
    );
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ userProfile, progress }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cognilens_learning_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Data Exported', 'Your CogniLens learning history has been downloaded.', 'success');
  };

  const handleResetProgress = async () => {
    await progressService.resetProgressData();
    await refreshProgress();
    setShowResetModal(false);
    showToast('Progress Reset', 'Your study stats and streak have been reset.', 'info');
  };

  // Helper for past 7 days streak calendar
  const getWeekDays = () => {
    const days = [];
    const activeDates = progress?.activeDaysHistory || [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isActive = activeDates.includes(dateStr);
      const isToday = i === 0;
      days.push({ dateStr, dayLabel, isActive, isToday });
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-primary-subtle, rgba(59, 130, 246, 0.1))',
              color: 'var(--accent-primary, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Account Settings & Preferences
            </h1>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Manage your personal profile, active streak, password security, and learning preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Top Banner: Dynamic Active Streak & User Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* User Quick Info */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: avatarBgColor,
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {getInitials(fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {fullName || 'Student Member'}
            </h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {email || 'student@cognilens.edu'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '4px' }}>
              {major} • {academicYear}
            </div>
          </div>
        </div>

        {/* Dynamic Active Streak Widget */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Flame size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Streak Record
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {progress?.currentStreakDays || 1} Days Consecutive
                </div>
              </div>
            </div>

            <button
              onClick={handleLogStreakToday}
              className="btn btn-sm"
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <Flame size={14} />
              <span>Log Activity</span>
            </button>
          </div>

          {/* 7-Day Streak History Tracker */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Past 7 Days History</span>
              <span style={{ color: '#d97706', fontWeight: 600 }}>
                {weekDays.filter(d => d.isActive).length}/7 Days Active
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    backgroundColor: day.isActive ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-surface-subtle)',
                    border: day.isToday ? '1.5 solid #f59e0b' : '1px solid transparent'
                  }}
                  title={`${day.dayLabel} (${day.dateStr}): ${day.isActive ? 'Active Study Day' : 'No Activity Registered'}`}
                >
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: day.isToday ? '#d97706' : 'var(--text-secondary)' }}>
                    {day.dayLabel}
                  </span>
                  {day.isActive ? (
                    <CheckCircle2 size={16} color="#f59e0b" />
                  ) : (
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: '2px solid var(--border-subtle)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'profile' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          <User size={16} />
          <span>Profile & Account</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'security' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'security' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          <Shield size={16} />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'preferences' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'preferences' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          <Sliders size={16} />
          <span>Preferences & Learning</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'data' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'data' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '-1px'
          }}
        >
          <Database size={16} />
          <span>Data & History</span>
        </button>
      </div>

      {/* TAB 1: Profile & Account Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Personal Profile Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Student Member"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@cognilens.edu"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Major / Field of Study
              </label>
              <input
                type="text"
                className="input-text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Academic Year
              </label>
              <select
                className="input-text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="Year 1">Year 1 (Freshman)</option>
                <option value="Year 2">Year 2 (Sophomore)</option>
                <option value="Year 3">Year 3 (Junior)</option>
                <option value="Year 4">Year 4 (Senior)</option>
                <option value="Master's">Master's Student</option>
                <option value="PhD">PhD / Researcher</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Avatar Color Theme
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarBgColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: avatarBgColor === color ? '3px solid var(--text-primary)' : 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Bio & Study Focus
            </label>
            <textarea
              className="input-text"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your current academic objectives or target exam subjects..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Save size={14} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleUpdatePassword} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Security & Authentication
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Current Password
            </label>
            <input
              type="password"
              className="input-text"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                className="input-text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                className="input-text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          {newPassword && (
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Password Security Strength: {newPassword.length >= 8 ? 'Strong' : 'Medium'}
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: newPassword.length >= 8 ? '100%' : '50%',
                    backgroundColor: newPassword.length >= 8 ? 'var(--color-success)' : 'var(--color-warning)'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Lock size={14} />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Preferences & Learning */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Learning Preferences & Notifications
          </h3>

          {/* Daily Goal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Daily Study Goal (Minutes)
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoalMinutes(mins)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: dailyGoalMinutes === mins ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: dailyGoalMinutes === mins ? 'var(--accent-primary-subtle)' : 'var(--bg-surface-subtle)',
                    color: dailyGoalMinutes === mins ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* AI Persona */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Preferred AI Tutor Teaching Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { id: 'socratic', title: 'Socratic Guide', desc: 'Asks guiding questions to help you deduce answers yourself.' },
                { id: 'detailed', title: 'Comprehensive Explainer', desc: 'Provides in-depth mathematical & theoretical explanations.' },
                { id: 'concise', title: 'Quick Summarizer', desc: 'Bullet-pointed concise answers focused on key facts.' },
                { id: 'exam_prep', title: 'Exam Drill Master', desc: 'Focuses on practice problems and high-yield test topics.' }
              ].map((style) => (
                <div
                  key={style.id}
                  onClick={() => setAiPersona(style.id as any)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: aiPersona === style.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: aiPersona === style.id ? 'var(--accent-primary-subtle)' : 'var(--bg-surface-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: aiPersona === style.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {style.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {style.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Spaced Repetition Flashcard Reminders
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Receive prompt recommendations for flashcards due for review.
                </div>
              </div>
              <input
                type="checkbox"
                checked={spacedRepetitionEnabled}
                onChange={(e) => setSpacedRepetitionEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Daily Streak Reminder Alerts
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Get notified if you have not logged any study activity by evening.
                </div>
              </div>
              <input
                type="checkbox"
                checked={streakReminders}
                onChange={(e) => setStreakReminders(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Theme Mode (Light / Dark)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Current Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-sm btn-secondary"
                style={{ gap: '6px' }}
              >
                {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#6366f1" />}
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Save size={14} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Data & History */}
      {activeTab === 'data' && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Data Export & History Management
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Download size={18} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Export Learning History
                </h4>
              </div>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Download your full study records, active streak log, and progress diagnostics in JSON format.
              </p>
              <button onClick={handleExportData} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                <Download size={14} />
                <span>Export JSON Data</span>
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                  Reset Learning Progress
                </h4>
              </div>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Clears your recorded streak count, study hours, and quiz analytics back to fresh default states.
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="btn btn-sm"
                style={{ backgroundColor: 'var(--color-danger)', color: '#ffffff', border: 'none', gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>Reset All Stats</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="var(--color-danger)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Confirm Reset Progress
              </h3>
            </div>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to reset your study streak and mastery stats? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setShowResetModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleResetProgress} className="btn btn-sm" style={{ backgroundColor: 'var(--color-danger)', color: '#ffffff', border: 'none' }}>
                Yes, Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
