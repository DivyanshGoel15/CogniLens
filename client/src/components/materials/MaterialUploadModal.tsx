import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { materialService } from '../../services/materialService';
import { progressService } from '../../services/progressService';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { MaterialSource } from '../../types/material';

interface MaterialUploadModalProps {
  onClose: () => void;
}

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({ onClose }) => {
  const { refreshMaterials, setCurrentRoute, openDocumentViewer } = useApp();
  const { showToast } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<MaterialSource['course']>('Operating Systems');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [completedMaterial, setCompletedMaterial] = useState<MaterialSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    setCurrentStage('Initializing ingestion pipeline...');

    try {
      let textContent = '';
      if (!selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        textContent = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).slice(0, 50000));
          reader.onerror = () => resolve('');
          reader.readAsText(selectedFile);
        });
      }

      const res = await materialService.uploadMaterial(
        selectedFile,
        selectedCourse,
        (progress, stage) => {
          setUploadProgress(progress);
          setCurrentStage(stage);
        },
        textContent
      );

      if (res.success) {
        setCompletedMaterial(res.data);
        await refreshMaterials();
        await progressService.recordMaterialUpload(
          res.data.id,
          res.data.title,
          res.data.filename,
          selectedCourse,
          res.data.pagesCount || 12
        );
        showToast('Document Indexed', `${res.data.filename} is now saved in Your Materials`, 'success');
      }
    } catch (err) {
      showToast('Ingestion Error', 'Failed to parse document embeddings', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Upload Study Material
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Add PDFs, lecture slides, diagrams, or handwritten notes to your agent knowledge base.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {!completedMaterial ? (
            <>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '30px 20px',
                  textAlign: 'center',
                  backgroundColor: dragActive ? 'var(--accent-primary-light)' : 'var(--bg-surface-subtle)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.pptx"
                  disabled={isUploading}
                />
                
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <Upload size={20} color="var(--accent-primary)" />
                </div>

                {selectedFile ? (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Click to choose file or drag & drop here
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Supports PDF, PPTX, DOCX, JPG, PNG (Max 50MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Course Selector */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Assign to Course Subject:
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value as any)}
                  className="input-text"
                  disabled={isUploading}
                  style={{ fontSize: '0.8125rem' }}
                >
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="DBMS">DBMS</option>
                  <option value="Java OOP">Java OOP</option>
                  <option value="Computer Networks">Computer Networks</option>
                </select>
              </div>

              {/* Ingestion Progress Simulation */}
              {isUploading && (
                <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Loader2 size={13} className="spin-icon" color="var(--accent-primary)" />
                      <span>{currentStage}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{uploadProgress}%</span>
                  </div>

                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent-primary)',
                        transition: 'width 300ms ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--color-success)'
                }}
              >
                <CheckCircle2 size={26} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Ingestion & Indexing Complete
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0' }}>
                <strong>{completedMaterial.filename}</strong> was chunked into OCR embeddings and is now fully grounded for AI reasoning.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    onClose();
                    openDocumentViewer(completedMaterial.id);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <BookOpen size={14} />
                  <span>Open in Reader</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    setCurrentRoute('ai-tutor');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Sparkles size={14} />
                  <span>Ask AI Tutor</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!completedMaterial && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} disabled={isUploading} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button
              onClick={handleStartUpload}
              disabled={!selectedFile || isUploading}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              {isUploading ? <Loader2 size={14} className="spin-icon" /> : <Upload size={14} />}
              <span>{isUploading ? 'Ingesting Material...' : 'Ingest & Index'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
