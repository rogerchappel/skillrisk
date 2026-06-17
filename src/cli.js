#!/usr/bin/env node
const fs = require('node:fs');
const { auditSkill, formatReport } = require('./index');

const version = require('../package.json').version;
const file = process.argv[2];

if (file === '--help' || file === '-h') {
  process.stdout.write('Usage: skillrisk <SKILL.md|->\n\nAudit reusable agent skill instructions for release-readiness risk boundaries.\n');
  process.exit(0);
}

if (file === '--version' || file === '-v') {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}

try {
  const text = file && file !== '-' ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const report = auditSkill(text);
  process.stdout.write(formatReport(report));
  if (report.status === 'blocked') process.exitCode = 2;
} catch (error) {
  console.error(`skillrisk: ${error.message}`);
  process.exit(1);
}
