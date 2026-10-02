import { defineConfig } from 'vite';

// base: './' — CrazyGames serves the build from a sub-path, so all asset URLs must be relative.
export default defineConfig({
  base: './',
  build: { target: 'es2019', outDir: 'dist', assetsInlineLimit: 100000 },
});
