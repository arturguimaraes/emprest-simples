import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const commitSha = execSync('git rev-parse --short HEAD').toString().trim();
const buildDate = new Date().toISOString().split('T')[0];

export default defineConfig({
  plugins: [react()],
  base: '/emprest-simples/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
});
