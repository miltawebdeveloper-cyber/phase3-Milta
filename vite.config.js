import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite injects the bundled CSS/JS at the end of <head>. This post-build step
// runs afterwards and moves the JSON-LD <script> blocks to the very end of
// <head>, so the final head order is: SEO tags → favicon → CSS/JS → JSON-LD.
function seoHeadOrder() {
  return {
    name: 'seo-head-order',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // 1. Move Vite's bundled stylesheet ahead of the module script so all
        //    CSS precedes all JS (section 8 before 9).
        const cssRe = /[ \t]*<link rel="stylesheet" crossorigin href="[^"]+\.css">\n?/;
        const css = html.match(cssRe);
        if (css) {
          html = html.replace(cssRe, '');
          html = html.replace(
            /([ \t]*)(<script type="module" crossorigin)/,
            `$1${css[0].trim()}\n$1$2`,
          );
        }
        // 2. Move JSON-LD blocks to the very end of <head> (section 10, last).
        const ldRe = /[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g;
        const blocks = html.match(ldRe);
        if (blocks) {
          html = html.replace(ldRe, '');
          const moved = blocks.map((b) => '  ' + b.trim()).join('\n') + '\n';
          html = html.replace('</head>', moved + '</head>');
        }
        return html;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), seoHeadOrder()],
  build: {
    // Vite inlines any imported asset under 4 KB as a base64 data: URI. Sixteen
    // of this site's images qualify, and the two carousels that use them
    // (CertificationsSection, ToolsSection) are Swiper loops, which render every
    // slide twice. The home page therefore shipped 61.3 KB of base64 inside its
    // HTML - 39% of the whole document, repeated on every single request because
    // markup is not cacheable the way an image file is. Emitting them as files
    // costs a few more requests and takes that 39% off the page.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Split large third-party libs into their own cacheable chunks so the
        // browser can download them in parallel and reuse them across deploys.
        //
        // The function form exists for @mui/icons-material. Every icon is its
        // own module, so a page importing thirty of them produced thirty
        // separate chunks of 170-300 bytes each, every one of them a
        // <link rel="modulepreload"> and a round trip. A state page was making
        // 46 script requests for 1.9 MB; on a 150ms RTT the request count cost
        // more than the bytes did. Collapsing the icons into one chunk trades
        // that for a single fetch that every page reuses from cache.
        manualChunks(id) {
          if (id.includes('node_modules/@mui/icons-material')) return 'mui-icons';
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return 'react-vendor';
          if (/node_modules\/(@mui\/material|@mui\/system|@emotion\/react|@emotion\/styled)\//.test(id))
            return 'mui-vendor';
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor';
          return undefined;
        },
      },
    },
  },
  preview: {
    // Render sets PORT automatically and requires the server to bind on 0.0.0.0
    // so it can detect the open port. Without this, vite preview defaults to
    // localhost:4173 which Render never sees, triggering the restart loop.
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173,
    strictPort: true,
  },
  server: {
    port: 3000,
    open: true,
    // Forward API calls to the local Express backend (server/server.js, port 5000)
    // so contact / newsletter / application submissions work in development.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
