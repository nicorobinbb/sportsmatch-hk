import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../artifacts/api-server/.env') });

// Start the server with env vars
const serverPath = join(__dirname, '../artifacts/api-server/dist/index.mjs');

const child = spawn('node', ['--enable-source-maps', serverPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: '3000' }
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
