import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: 'src/background.js',
        content: 'src/content.js',
        popup: 'popup.html',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
});
