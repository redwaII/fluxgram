import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** PNG in HTML avoids a separate /favicon request (SPA rewrites, aggressive caches). */
function inlinePngFaviconPlugin() {
  return {
    name: 'inline-png-favicon',
    transformIndexHtml(html) {
      const png = readFileSync(join(__dirname, 'public', 'favicon.png'));
      const href = `data:image/png;base64,${png.toString('base64')}`;
      return html.replace(
        /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon\.png" \/>/,
        `<link rel="icon" type="image/png" sizes="32x32" href="${href}" />`
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_URL || 'http://localhost:3001';
  return {
    plugins: [react(), inlinePngFaviconPlugin()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
        '/socket.io': { target, ws: true },
      },
    },
  };
});
