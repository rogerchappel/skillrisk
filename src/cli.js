#!/usr/bin/env node
const fs = require('node:fs');
const { auditSkill, formatReport } = require('./index');
const file = process.argv[2];
try {
  const text = file && file !== '-' ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const report = auditSkill(text);
  process.stdout.write(formatReport(report));
  if (report.status === 'blocked') process.exitCode = 2;
} catch (error) {
  console.error(`skillrisk: ${error.message}`);
  process.exit(1);
}
