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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/scenes/')) return 'scenes';
          if (id.includes('/src/render/')) return 'render';
          if (id.includes('/src/core/') || id.includes('/src/systems/')) return 'core';
        },
      },
    },
  },
});
