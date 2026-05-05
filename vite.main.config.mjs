import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Keep MQTT + WebSocket stack out of the bundle so optional `ws` native deps resolve at runtime from node_modules.
      external: ['mqtt', 'ws', 'bufferutil', 'utf-8-validate'],
    },
  },
});
