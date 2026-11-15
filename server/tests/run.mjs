// One-command test run:  node tests/run.mjs   (from the server folder)
// Uses a throw-away database, so your real data is never touched.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'pll-test-'));
const env = {
  ...process.env,
  DATABASE_FILE: path.join(folder, 'test.db'),
  PORT: '3101',
  CLIENT_ORIGIN: 'http://localhost:5173',
  DICTIONARY_API_BASE: 'http://localhost:3199/api/v2/entries/en',
  DICTIONARY_TIMEOUT_MS: '600'
};

for (const script of ['src/db/init.js', 'src/db/seed.js']) {
  const step = spawnSync(process.execPath, [script], { env, stdio: 'inherit' });
  if (step.status !== 0) process.exit(1);
}
const mock = spawn(process.execPath, ['tests/mock-dictionary.mjs'], { stdio: 'inherit' });
const server = spawn(process.execPath, ['src/app.js'], { env, stdio: 'inherit' });
await new Promise((resolve) => setTimeout(resolve, 1500));
const run = spawnSync(process.execPath, ['tests/api.check.mjs'], { env, stdio: 'inherit' });
mock.kill();
server.kill();
fs.rmSync(folder, { recursive: true, force: true });
process.exit(run.status ?? 1);
