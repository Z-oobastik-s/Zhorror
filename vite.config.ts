import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const rootDir = dirname(fileURLToPath(import.meta.url));

function resolveBuildVersion(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }
  if (process.env.BUILD_VERSION) {
    return process.env.BUILD_VERSION;
  }
  return `${Date.now()}`;
}

function versionPlugin(): Plugin {
  let version = resolveBuildVersion();

  return {
    name: 'zhorror-version',
    config() {
      version = resolveBuildVersion();
      return {
        define: {
          __APP_VERSION__: JSON.stringify(version),
        },
      };
    },
    writeBundle(options) {
      const outDir = options.dir ?? resolve(rootDir, 'dist');
      const payload = {
        version,
        builtAt: new Date().toISOString(),
      };
      writeFileSync(resolve(outDir, 'version.json'), `${JSON.stringify(payload)}\n`, 'utf8');
    },
  };
}

export default defineConfig({
  base: '/Zhorror/',
  plugins: [versionPlugin()],
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
