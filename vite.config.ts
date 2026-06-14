import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/Zhorror/',
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
    build: {
    target: 'es2022',
    cssCodeSplit: true,
  },
});
