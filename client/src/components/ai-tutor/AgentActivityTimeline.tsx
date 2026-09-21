import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, Clock, Sparkles } from 'lucide-react';
import { AgentTaskActivity } from '../../types/chat';

interface AgentActivityTimelineProps {
  activity: AgentTaskActivity;
}

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({ activity }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(activity.status === 'running');

  const completedCount = activity.steps.filter(s => s.status === 'completed').length;
  const isRunning = activity.status === 'running';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        marginBottom: '10px',
        fontSize: '0.8125rem'
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRunning ? (
            <Loader2 size={14} className="spin-icon" color="var(--accent-primary)" />
          ) : (
            <Sparkles size={14} color="var(--color-purple)" />
          )}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {activity.taskTitle}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>
            ({completedCount}/{activity.steps.length} steps)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
          <span style={{ fontSize: '0.7rem' }}>{isExpanded ? 'Hide' : 'Details'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {activity.steps.map((step) => {
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {step.status === 'completed' && <CheckCircle2 size={13} color="var(--color-success)" />}
                  {step.status === 'in_progress' && <Loader2 size={13} className="spin-icon" color="var(--accent-primary)" />}
                  {step.status === 'pending' && <Clock size={13} color="var(--text-muted)" />}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: step.status === 'in_progress' ? 'var(--text-primary)' :
                             step.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontWeight: step.status === 'in_progress' ? 600 : 400
                    }}
                  >
                    {step.label}
                  </div>
                  {step.detail && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
