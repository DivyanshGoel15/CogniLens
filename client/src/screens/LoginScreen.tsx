import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const LoginScreen: React.FC = () => {
  const { login, setCurrentRoute } = useApp();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Validation Error', 'Please enter your email and password.', 'error');
      return;
    }

    login(email);
    showToast('Welcome Back!', 'Logged into CogniLens study workspace.', 'success');
  };

  const handleDemoLogin = () => {
    login('student@cognilens.edu', 'Student Member');
    showToast('Demo Access Granted', 'Logged in as Student Member.', 'success');
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

      {/* Main Login Card */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address / Username
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
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', paddingRight: '38px', backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                required
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.785rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ borderRadius: '4px' }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-md"
            style={{ marginTop: '6px', width: '100%', padding: '12px', fontSize: '0.9rem', gap: '6px' }}
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Divider & Button */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <button
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.84375rem', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontWeight: 700 }}
          >
            <Zap size={16} />
            <span>⚡ Quick Demo Login (One Click)</span>
          </button>
        </div>

        {/* Footer link to Signup */}
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
