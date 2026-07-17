import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockDir = path.resolve(__dirname, './src/__mocks__/firebase');

// Firebase subpath imports go through the package's `exports` field, which has
// higher priority than both Vite aliases and normal plugin resolveId hooks once
// deps are pre-bundled. We exclude firebase from pre-bundling so our plugin's
// resolveId hook can intercept each import before esbuild sees them.
function mockFirebasePlugin(): Plugin {
  return {
    name: 'mock-firebase',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'firebase/app') return path.join(mockDir, 'app.ts');
      if (id === 'firebase/firestore') return path.join(mockDir, 'firestore.ts');
      if (id === 'firebase/auth') return path.join(mockDir, 'auth.ts');
    },
  };
}

export default defineConfig({
  plugins: [mockFirebasePlugin(), react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  define: {
    __APP_VERSION__: JSON.stringify('e2e'),
    __COMMIT_SHA__: JSON.stringify('e2e'),
    __BUILD_DATE__: JSON.stringify('e2e'),
    __BUILD_TIME__: JSON.stringify('e2e'),
  },
});
