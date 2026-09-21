import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Upload,
  FileText,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MaterialCard } from '../components/materials/MaterialCard';
import { MaterialUploadModal } from '../components/materials/MaterialUploadModal';
import { MaterialType } from '../types/material';

export const MaterialsScreen: React.FC = () => {
  const { materials, searchQuery, setSearchQuery } = useApp();
  const [activeTab, setActiveTab] = useState<MaterialType | 'all'>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filter materials
  const filteredMaterials = materials.filter((mat) => {
    const matchesTab = activeTab === 'all' || mat.type === activeTab;
    const matchesCourse = selectedCourseFilter === 'all' || mat.course === selectedCourseFilter;
    const matchesSearch = !searchQuery ||
      mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesCourse && matchesSearch;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={18} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Materials Knowledge Library
            </h1>
          </div>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            All indexed textbooks, lecture slides, diagrams, and handwritten notes grounding the AI agent.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary btn-md"
          style={{ gap: '8px' }}
        >
          <Plus size={16} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Tab Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: 'var(--bg-surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}
      >
        {/* Type Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Materials' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'image', label: 'Images & Notes' },
            { id: 'slides', label: 'Presentations' },
            { id: 'doc', label: 'Documents' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                backgroundColor: activeTab === tab.id ? 'var(--accent-primary-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.id ? 'var(--accent-primary-border)' : 'transparent'}`,
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.785rem', color: 'var(--text-tertiary)' }}>Filter Course:</span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="input-text"
            style={{ width: '180px', padding: '6px 10px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Subjects</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="DBMS">DBMS</option>
            <option value="Java OOP">Java OOP</option>
            <option value="Computer Networks">Computer Networks</option>
          </select>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            No materials found matching criteria
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 16px' }}>
            Try adjusting your search query or upload a new PDF / diagram to your knowledge base.
          </p>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Upload size={14} />
            <span>Upload Material</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredMaterials.map((mat) => (
            <MaterialCard key={mat.id} material={mat} />
          ))}
        </div>
      )}

      {isUploadModalOpen && (
        <MaterialUploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
};
