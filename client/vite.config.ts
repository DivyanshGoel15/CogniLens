import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [tailwindcss(), react()],
    define: {
      '__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY || ''),
      '__GEMINI_MODEL__': JSON.stringify(env.GEMINI_MODEL || 'gemini-2.0-flash'),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || 'gemini-2.0-flash'),
      'import.meta.env.VITE_AZURE_SPEECH_KEY': JSON.stringify(env.AZURE_SPEECH_KEY || ''),
      'import.meta.env.VITE_AZURE_SPEECH_REGION': JSON.stringify(env.AZURE_SPEECH_REGION || ''),
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
