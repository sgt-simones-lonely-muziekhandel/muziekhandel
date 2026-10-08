import { defineConfig } from 'vite';

// Relative base so the build works on any static host (GitHub Pages, a sub-folder, a USB stick at the demo).
export default defineConfig({
  base: './',
  server: { port: 5173, open: false },
  // Phaser alone is ~1.2 MB minified; that's expected for a game build.
  build: { chunkSizeWarningLimit: 2000 },
});
