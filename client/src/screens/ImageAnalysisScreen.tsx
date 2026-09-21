import React from 'react';
import { DiagramInspector } from '../components/multimodal/DiagramInspector';

export const ImageAnalysisScreen: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <DiagramInspector />
    </div>
  );
};
