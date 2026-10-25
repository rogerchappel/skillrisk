#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const binEntries = typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin || {};

for (const [name, entry] of Object.entries(binEntries)) {
  if (!fs.existsSync(entry)) {
    throw new Error(`missing bin entry for ${name}: ${entry}`);
  }
}

const packDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skillrisk-package-smoke-'));
try {
const output = execFileSync('npm', ['pack', '--json', '--pack-destination', packDirectory], { encoding: 'utf8' });
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path));
const packed = JSON.parse(execFileSync('tar', ['-xOf', path.join(packDirectory, pack.filename), 'package/package.json'], { encoding: 'utf8' }));
const packagedBin = typeof packed.bin === 'string' ? { [packed.name]: packed.bin } : packed.bin || {};
if (JSON.stringify(packagedBin) !== JSON.stringify(binEntries)) {
  throw new Error(`packed bin metadata differs: ${JSON.stringify(packagedBin)}`);
}

for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'src/index.js',
  'src/cli.js',
  'fixtures/safe-skill.md',
  'fixtures/risky-skill.md',
  'docs/RELEASE_CANDIDATE.md'
]) {
  if (!files.has(required)) {
    throw new Error(`npm pack is missing ${required}`);
  }
}

for (const file of files) {
  if (file.startsWith('test/') || file.startsWith('.github/')) {
    throw new Error(`npm pack includes non-runtime file ${file}`);
  }
}

const installDirectory = path.join(packDirectory, 'installed');
fs.mkdirSync(installDirectory);
execFileSync('npm', ['install', '--prefix', installDirectory, '--ignore-scripts', '--no-audit', '--no-fund', path.join(packDirectory, pack.filename)], { stdio: 'inherit' });
for (const [name, entry] of Object.entries(packagedBin)) {
  const executable = path.join(installDirectory, 'node_modules', '.bin', name);
  if (!fs.existsSync(executable)) throw new Error(`installed package is missing executable ${name}`);
  execFileSync(executable, ['--help'], { stdio: 'pipe' });
}
console.log(`package smoke passed for ${pkg.name} with ${files.size} packed files and installed CLI`);
} finally {
  fs.rmSync(packDirectory, { recursive: true, force: true });
}
