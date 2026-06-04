/**
 * Vercel Build Output API assembler.
 *
 * After `vite build` produces:
 *   dist/client/  – static assets
 *   dist/server/  – SSR server (server.js entry)
 *
 * This script creates:
 *   .vercel/output/static/       – copied from dist/client
 *   .vercel/output/functions/    – serverless function wrapping dist/server
 *   .vercel/output/config.json   – routing rules
 */

import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const outputDir = join(root, '.vercel', 'output');
const staticDir = join(outputDir, 'static');
const funcDir = join(outputDir, 'functions', '__nitro.func');

// Clean previous output
if (existsSync(outputDir)) {
  cpSync(outputDir, outputDir, { recursive: true }); // no-op, just ensure
}

// 1. Copy static assets
mkdirSync(staticDir, { recursive: true });
cpSync(join(root, 'dist', 'client'), staticDir, { recursive: true });

// 2. Create serverless function
mkdirSync(funcDir, { recursive: true });
cpSync(join(root, 'dist', 'server'), funcDir, { recursive: true });

// Write the function entry point that wraps the fetch handler
writeFileSync(
  join(funcDir, 'index.mjs'),
  `
import server from './server.js';

export default async function handler(req, res) {
  try {
    // Build a standard Request from the Node.js IncomingMessage
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = new URL(req.url, \`\${protocol}://\${host}\`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) { chunks.push(chunk); }
      body = Buffer.concat(chunks);
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
      duplex: 'half',
    });

    const response = await server.fetch(request, {}, {});

    // Write the Response back to the Node.js ServerResponse
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
`.trim()
);

// Write the function config
writeFileSync(
  join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs20.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
    },
    null,
    2
  )
);

// 3. Write the routing config
writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Serve static assets directly (they have hashed filenames)
        {
          src: '/assets/(.*)',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        // Try static files first, then fall through to the function
        { handle: 'filesystem' },
        // All other requests go to the SSR function
        { src: '/(.*)', dest: '/__nitro' },
      ],
    },
    null,
    2
  )
);

console.log('✅ Vercel Build Output API assembled in .vercel/output/');
