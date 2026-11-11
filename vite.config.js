import { defineConfig } from 'vite';
export default defineConfig({ base: './', optimizeDeps: { noDiscovery: true, include: [] },build:{rollupOptions:{input:{city:'index.html',about:'about.html',stories:'stories.html'}}} });
