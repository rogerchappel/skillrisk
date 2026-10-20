const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkLockfile } = require('../scripts/check-lockfile');

test('accepts a matching package lockfile', () => {
  assert.equal(checkLockfile(process.cwd()), 'package-lock.json matches package.json');
});

test('rejects a missing lockfile with actionable guidance', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillrisk-test-'));
  try {
    fs.writeFileSync(path.join(root, 'package.json'), '{}');
    assert.throws(() => checkLockfile(root), /package-lock.json is required/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a lockfile that differs from package metadata', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillrisk-test-'));
  try {
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'wrong', version: '9.9.9' }));
    fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ name: 'wrong', version: '9.9.9', lockfileVersion: 3, packages: { '': { name: 'wrong', version: '9.9.9' } } }));
    assert.throws(() => checkLockfile(root), /out of sync/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
