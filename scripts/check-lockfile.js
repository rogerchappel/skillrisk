#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = process.cwd();
const lockfile = path.join(root, 'package-lock.json');

if (!fs.existsSync(lockfile)) {
  throw new Error('package-lock.json is required; run npm install --package-lock-only');
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'skillrisk-lockfile-'));
try {
  fs.copyFileSync(path.join(root, 'package.json'), path.join(temporary, 'package.json'));
  fs.copyFileSync(lockfile, path.join(temporary, 'package-lock.json'));
  execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], {
    cwd: temporary,
    stdio: 'pipe'
  });

  const tracked = fs.readFileSync(lockfile, 'utf8');
  const generated = fs.readFileSync(path.join(temporary, 'package-lock.json'), 'utf8');
  if (tracked !== generated) {
    throw new Error('package-lock.json is out of sync with package.json; run npm install --package-lock-only');
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

console.log('package-lock.json matches package.json');
