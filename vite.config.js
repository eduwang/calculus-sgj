import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'cavalieri-method': resolve(__dirname, 'cavalieri_method-of-indivisibles.html'),
        'cavalieri-principle': resolve(__dirname, 'cavalieri-principle.html'),
        'archimedes-equilibrium': resolve(__dirname, 'archimedes-equilibrium.html'),
      },
    },
    assetsInclude: ['**/*.gltf', '**/*.glb'],
  },
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
});

