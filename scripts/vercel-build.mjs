import { rmSync, cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const outputDir = join(root, '.vercel', 'output');
const staticDir = join(outputDir, 'static');
const funcDir = join(outputDir, 'functions', '__nitro.func');

// Clean previous output
if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}

// 1. Copy static assets
mkdirSync(staticDir, { recursive: true });
cpSync(join(root, 'dist', 'client'), staticDir, { recursive: true });

// 2. Create serverless function wrapper
mkdirSync(funcDir, { recursive: true });

// We write the Vercel handler wrapper to a temporary file, then bundle it
const wrapperTemp = join(root, 'dist', 'server', 'vercel-wrapper.mjs');
writeFileSync(
  wrapperTemp,
  `
import server from './server.js';

module.exports = async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = new URL(req.url || '/', \`\${protocol}://\${host}\`);

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
`
);

// Bundle the wrapper and the entire server into a single file
console.log('Bundling server for Vercel...');
await esbuild.build({
  entryPoints: [wrapperTemp],
  bundle: true,
  outfile: join(funcDir, 'index.cjs'),
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  external: [
    'node:*',
    'stream', 'http', 'https', 'fs', 'path', 'os', 'crypto', 'events', 
    'url', 'util', 'zlib', 'buffer', 'net', 'tls', 'assert', 'child_process'
  ],
});

// Write the function config
writeFileSync(
  join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs20.x',
      handler: 'index.cjs',
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
        {
          src: '/assets/(.*)',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/__nitro' },
      ],
    },
    null,
    2
  )
);

console.log('✅ Vercel Build Output API assembled in .vercel/output/');
