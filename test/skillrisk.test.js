const test = require('node:test');
const assert = require('node:assert/strict');
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
