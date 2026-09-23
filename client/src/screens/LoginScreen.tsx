import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../services/apiClient';

export const LoginScreen: React.FC = () => {
  const { login, setCurrentRoute } = useApp();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Call real backend API — gets actual user data (fullName, major, etc.)
      const authData = await apiClient.login(email.trim().toLowerCase(), password);
      const user = authData.user;

      await login(user.email, user.fullName, authData.access_token, {
        fullName: user.fullName,
        major: user.major,
        academicYear: user.academicYear,
        avatarInitials: user.avatarInitials,
        avatarBgColor: user.avatarBgColor,
      });

      showToast('Welcome Back!', `Signed in as ${user.fullName}.`, 'success');
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
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
      {/* Back Link */}
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

      {/* Login Card */}
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 32px',
          borderRadius: '20px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            Sign In to CogniLens
          </h2>
          <p style={{ fontSize: '0.84375rem', color: '#94a3b8', marginTop: '4px' }}>
            Access your AI Tutor, grounded notes, and study streak.
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            fontSize: '0.8125rem', color: '#fca5a5'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="input-text"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                style={{ paddingLeft: '38px', backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-text"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                style={{ paddingLeft: '38px', paddingRight: '38px', backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.785rem' }}>
            <button
              type="button"
              onClick={() => showToast('Password Reset', 'Contact support or use your registered email to reset your password.', 'info')}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-md"
            style={{ marginTop: '6px', width: '100%', padding: '12px', fontSize: '0.9rem', gap: '6px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.84375rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <button
            onClick={() => setCurrentRoute('signup')}
            style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </div>
  );
};
