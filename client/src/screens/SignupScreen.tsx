import React, { useState } from 'react';
import { GraduationCap, User, Mail, BookOpen, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../services/apiClient';

export const SignupScreen: React.FC = () => {
  const { signup, setCurrentRoute } = useApp();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('Year 3');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      showToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      showToast('Validation Error', 'Password must be at least 6 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      showToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const authData = await apiClient.signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        major,
        academicYear,
      });

      const user = authData.user;
      await signup({
        fullName: user.fullName,
        email: user.email,
        major: user.major,
        academicYear: user.academicYear,
        token: authData.access_token,
        profile: user,
      });

      showToast('Account Created!', `Welcome to CogniLens, ${user.fullName}!`, 'success');
    } catch (err: any) {
      console.warn('Signup API error, falling back locally if backend offline', err);
      // If server returned a business error (e.g. email already exists)
      if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setErrorMsg(err.message);
        showToast('Signup Error', err.message, 'error');
        setIsLoading(false);
        return;
      }

      // Offline fallback: still sign in client-side with user's real entered name
      await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        major,
        academicYear,
      });
      showToast('Account Created!', `Welcome to CogniLens, ${fullName.trim()}!`, 'success');
    } finally {
      setIsLoading(false);
    }
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

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>{errorMsg}</span>
          </div>
        )}

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
                placeholder="e.g. Alex Morgan"
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
            disabled={isLoading}
            className="btn btn-primary btn-md"
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '12px',
              fontSize: '0.9rem',
              gap: '6px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{isLoading ? 'Creating Account...' : 'Create Account & Enter Workspace'}</span>
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
