import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const commitSha = execSync('git rev-parse --short HEAD').toString().trim();
const now = new Date();
const buildDate = now.toISOString().split('T')[0];
const buildTime = now.toISOString().split('T')[1].slice(0, 5);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/emprest-simples/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
});
