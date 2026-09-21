import React, { useState } from 'react';
import { Settings, Database, Code, CheckCircle2, Shield, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const SettingsScreen: React.FC = () => {
  const { showToast } = useToast();
  const [azureEndpoint, setAzureEndpoint] = useState('https://cognita-azure-openai.openai.azure.com/');
  const [azureModel, setAzureModel] = useState('gpt-4o-grounded-rag');
  const [vectorDbUrl, setVectorDbUrl] = useState('https://cognita-vector-search.search.windows.net');
  const [docIntelligenceKey, setDocIntelligenceKey] = useState('••••••••••••••••••••••••••••••••');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuration Saved', 'API endpoints synchronized for backend integration', 'success');
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={18} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            System Settings & API Architecture Hand-off
          </h1>
        </div>
        <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configured for Member 4 (Frontend/UX). Clean service interfaces ready for Backend team connection.
        </p>
      </div>

      {/* Team Architecture Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Code size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Backend API Contract Abstractions (`/src/services`)
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          The entire UI connects through typed modular services: <code>aiService.ts</code>, <code>materialService.ts</code>, <code>quizService.ts</code>, and <code>progressService.ts</code>. Your backend peers can replace mock implementations with real Azure AI endpoints without altering UI components.
        </p>
      </div>

      {/* Azure Service Configuration Form */}
      <form onSubmit={handleSave} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Azure AI & RAG Configuration
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Azure OpenAI Endpoint:
          </label>
          <input
            type="text"
            className="input-text"
            value={azureEndpoint}
            onChange={(e) => setAzureEndpoint(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Deployment Model:
          </label>
          <input
            type="text"
            className="input-text"
            value={azureModel}
            onChange={(e) => setAzureModel(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Azure AI Search / Vector DB Endpoint:
          </label>
          <input
            type="text"
            className="input-text"
            value={vectorDbUrl}
            onChange={(e) => setVectorDbUrl(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Azure Document Intelligence API Key:
          </label>
          <input
            type="password"
            className="input-text"
            value={docIntelligenceKey}
            onChange={(e) => setDocIntelligenceKey(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Save size={14} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
