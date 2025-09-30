import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
});
