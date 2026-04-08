#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (args.includes('--mcp')) {
  // Start MCP server on stdio
  const child = spawn('node', ['--import', 'tsx', path.join(__dirname, '../src/mcp/index.ts')], {
    stdio: 'inherit',
    env: { ...process.env },
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  // Start web UI
  const serverProc = spawn('node', ['--import', 'tsx', path.join(__dirname, '../src/server/index.ts')], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  // Also start vite dev server in development, or serve built files in production
  const fs = await import('fs');
  const distPath = path.join(__dirname, '../dist/index.html');

  if (fs.existsSync(distPath)) {
    // Production: serve built files via Express (add static serving to server)
    console.log('VibeSQL Admin starting in production mode...');
    console.log(`Open http://localhost:${process.env.VIBESQL_ADMIN_PORT || 5174}`);
  } else {
    // Development: start Vite dev server
    const vite = spawn('npx', ['vite', '--port', process.env.VIBESQL_ADMIN_PORT || '5174'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: true,
    });
    vite.on('exit', () => { serverProc.kill(); process.exit(0); });
  }

  serverProc.on('exit', (code) => process.exit(code || 0));
  process.on('SIGINT', () => { serverProc.kill(); process.exit(0); });
}
