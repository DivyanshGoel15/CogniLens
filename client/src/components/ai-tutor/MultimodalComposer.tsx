import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  X,
  FileText,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { MultimodalAttachment } from '../../types/chat';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface MultimodalComposerProps {
  onSendMessage: (text: string, attachments: MultimodalAttachment[]) => void;
  isLoading: boolean;
  prefilledPrompt?: string | null;
}

export const MultimodalComposer: React.FC<MultimodalComposerProps> = ({
  onSendMessage,
  isLoading,
  prefilledPrompt
}) => {
  const { materials, setPrefilledPrompt } = useApp();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MultimodalAttachment[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedSourcesCount, setSelectedSourcesCount] = useState<number>(materials.length || 7);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefilledPrompt) {
      setText(prefilledPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      setPrefilledPrompt(null);
    }
  }, [prefilledPrompt, setPrefilledPrompt]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImg = file.type.startsWith('image/');
    const newAttachment: MultimodalAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      type: isImg ? 'image' : 'pdf',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };

    setAttachments((prev) => [...prev, newAttachment]);
    showToast('Attached File', `${file.name} ready for multimodal analysis`, 'info');
    e.target.value = '';
  };

  const toggleVoice = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      showToast('Voice Input Active', 'Listening for speech prompt...', 'info');
      // Simulate voice transcription after 2.5s
      setTimeout(() => {
        setText('Explain how Banker algorithm prevents deadlocks in multi-process systems.');
        setIsRecordingVoice(false);
        showToast('Transcribed Voice Input', 'Speech converted to prompt', 'success');
      }, 2400);
    } else {
      setIsRecordingVoice(false);
    }
  };

  return (
    <div
      style={{
        padding: '14px 20px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative'
      }}
    >
      {/* Attached Files Chips */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--accent-primary-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                animation: 'scaleUp 120ms ease'
              }}
            >
              {att.type === 'image' ? <ImageIcon size={14} color="var(--color-purple)" /> : <FileText size={14} color="var(--accent-primary)" />}
              <span style={{ fontWeight: 600 }}>{att.name}</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>({att.size})</span>
              <button
                onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '1px' }}
                aria-label="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all var(--transition-fast)',
          overflow: 'hidden'
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your learning material, attach diagrams, or request practice..."
          rows={2}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            lineHeight: 1.5,
            fontFamily: 'inherit'
          }}
        />

        {/* Toolbar & Send Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {/* Multimodal Attachment Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.pptx"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost btn-sm"
              title="Attach Document or PDF"
              style={{ padding: '6px', color: 'var(--text-secondary)' }}
            >
              <Paperclip size={16} />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost btn-sm"
              title="Upload Diagram or Image"
              style={{ padding: '6px', color: 'var(--text-secondary)' }}
            >
              <ImageIcon size={16} />
            </button>

            <button
              onClick={toggleVoice}
              className={`btn btn-ghost btn-sm ${isRecordingVoice ? 'recording-pulse' : ''}`}
              title={isRecordingVoice ? 'Stop Recording' : 'Dictate with Voice'}
              style={{
                padding: '6px',
                color: isRecordingVoice ? 'var(--color-danger)' : 'var(--text-secondary)',
                backgroundColor: isRecordingVoice ? 'var(--color-danger-subtle)' : 'transparent'
              }}
            >
              {isRecordingVoice ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Source Context Indicator */}
            <div
              className="badge badge-neutral"
              style={{
                marginLeft: '8px',
                fontSize: '0.725rem',
                gap: '4px',
                padding: '3px 8px',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
              title="Sources indexed and available for grounding"
            >
              <Layers size={12} color="var(--accent-primary)" />
              <span>{selectedSourcesCount} sources active</span>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 14px', gap: '6px' }}
          >
            <span>Ask Agent</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
