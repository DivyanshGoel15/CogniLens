import React, { useState } from 'react';
import { GraduationCap, User, Mail, BookOpen, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const SignupScreen: React.FC = () => {
  const { signup, setCurrentRoute } = useApp();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('Year 3');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Validation Error', 'Password must be at least 6 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    signup({
      fullName,
      email,
      major,
      academicYear
    });

    showToast('Account Created!', `Welcome to CogniLens, ${fullName}!`, 'success');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        color: 'var(--text-primary, #f8fafc)'
      }}
    >
      {/* Top Header Back Link */}
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <button
          onClick={() => setCurrentRoute('landing')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px', color: '#94a3b8' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Signup Card */}
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '36px 32px',
          borderRadius: '20px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <GraduationCap size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.84375rem', color: '#94a3b8', marginTop: '4px' }}>
            Get started with grounded AI tutoring and adaptive analytics.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-text"
                placeholder="e.g. Student Member"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ paddingLeft: '38px', backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="input-text"
                placeholder="student@cognilens.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px', backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Major / Field
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="Computer Science"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Academic Year
              </label>
              <select
                className="input-text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Password *
              </label>
              <input
                type="password"
                className="input-text"
                placeholder="At least 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                className="input-text"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-md"
            style={{ marginTop: '10px', width: '100%', padding: '12px', fontSize: '0.9rem', gap: '6px' }}
          >
            <span>Create Account & Enter Workspace</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer link to Login */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.84375rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <button
            onClick={() => setCurrentRoute('login')}
            style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
