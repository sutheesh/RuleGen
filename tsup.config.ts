import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  outDir: 'dist',
});
