import { defineConfig } from 'vite';

export default defineConfig({
	base: '/static/',
  root: './',
  build: {
    outDir: '/static/', // Ensure this path matches your Django static files configuration
    emptyOutDir: true,
    rollupOptions: {
      external: ['three', '@tweenjs/tween.js'],
    },
  },
  optimizeDeps: {
    include: ['three', '@tweenjs/tween.js'],
  },
  resolve: {
    alias: {
      // Add an alias for @tweenjs/tween.js to its main module
      '@tweenjs/tween.js': '/static/node_modules/@tweenjs/tween.js/dist/tween.esm.js',
    },
  },
});
