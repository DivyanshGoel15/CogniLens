declare const __GEMINI_API_KEY__: string | undefined;

const STORAGE_KEY = 'cognilens_gemini_key';

export function getGeminiApiKey(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch {
    // fallback
  }

  // Injected via Vite define
  try {
    if (typeof __GEMINI_API_KEY__ === 'string' && __GEMINI_API_KEY__.trim().length > 0) {
      return __GEMINI_API_KEY__.trim();
    }
  } catch {
    // ignore
  }

  // Fallback to Vite env
  try {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === 'string' && viteKey.trim().length > 0) {
      return viteKey.trim();
    }
  } catch {
    // ignore
  }

  // Fallback to global process env if exists
  try {
    const procKey = (globalThis as any)?.process?.env?.GEMINI_API_KEY;
    if (procKey && typeof procKey === 'string' && procKey.trim().length > 0) {
      return procKey.trim();
    }
  } catch {
    // ignore
  }

  return null;
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
