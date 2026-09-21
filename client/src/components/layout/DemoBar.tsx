import React, { useState } from 'react';
import { Play, Sparkles, ChevronDown, Check, Zap, Info } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

export const DemoBar: React.FC = () => {
  const { scenarios, runScenario } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    runScenario(id);
    setIsOpen(false);
  };

  const currentScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <div
      style={{
        backgroundColor: '#18181b',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.785rem',
        zIndex: 50,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          <Zap size={11} />
          Demo Mode
        </div>

        <span style={{ color: '#a1a1aa' }}>
          Evaluate Multimodal Agent workflows:
        </span>

        {/* Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '6px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.75rem',
              transition: 'background 0.15s'
            }}
          >
            <span>{currentScenario.name}</span>
            <ChevronDown size={13} color="#a1a1aa" />
          </button>

          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                backgroundColor: '#27272a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                width: '380px',
                padding: '6px',
                zIndex: 100
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                PRE-CONFIGURED JUDGE / TEACHER SCENARIOS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: activeScenarioId === sc.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: activeScenarioId === sc.id ? '#93c5fd' : '#e4e4e7',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.785rem' }}>
                      <span>{sc.name}</span>
                      {activeScenarioId === sc.id && <Check size={13} color="#60a5fa" />}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{sc.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => runScenario(activeScenarioId)}
          className="btn btn-primary btn-sm"
          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
        >
          <Play size={11} />
          <span>Run Scenario</span>
        </button>
      </div>
    </div>
  );
};
