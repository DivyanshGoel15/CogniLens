import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'cognilens_gemini_key';

export function getGeminiApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

interface ApiKeySetupProps {
  onKeySet?: (key: string) => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = () => {
  return null;
};
