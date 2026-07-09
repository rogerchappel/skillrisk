const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { auditSkill, formatReport } = require('../src/index');

test('passes complete skill text', () => {
  const result = auditSkill('Use when reviewing skills. Required inputs: SKILL.md. Side effects: none. Approval required before external writes. Validate with npm test.');
  assert.equal(result.status, 'pass');
});

test('blocks missing side-effect and approval boundaries', () => {
  const result = auditSkill('Use when making summaries. Required inputs: a file. Validate with smoke tests.');
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((f) => f.code === 'missing-side-effects'));
});

test('formats reports', () => {
  assert.match(formatReport(auditSkill('short')), /Skill Risk Report/);
});

test('cli exposes help and version', () => {
  const help = execFileSync(process.execPath, ['src/cli.js', '--help'], { encoding: 'utf8' });
  assert.match(help, /Usage: skillrisk/);

  const version = execFileSync(process.execPath, ['src/cli.js', '--version'], { encoding: 'utf8' }).trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

test('cli audits stdin and reports blocked input with exit code 2', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-'], {
    input: 'Use when making summaries. Required inputs: a file. Validate with smoke tests.',
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /Skill Risk Report/);
  assert.match(result.stdout, /blocked/);
});
