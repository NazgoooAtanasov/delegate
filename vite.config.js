import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import prismjs from 'vite-plugin-prismjs'
import path from 'path';

export default defineConfig({
  plugins: [prismjs({ languages: ['markup'], theme: 'okaidia', css: true }), preact()],
  build: {
    minify: false,
    target: 'modules',
    outDir: 'dist/bundle',
    rollupOptions: {
      input: {
        popup: 'src/popup.tsx',
        sidepanel: 'src/sidepanel.tsx',
        reports: 'src/reports.tsx',
        sw: 'src/serviceWorker.ts',
        activityTracker: 'src/activityTracker.ts',
      },
      output: {
        esModule: true,
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      }
    }
  }
});


