#!/usr/bin/env node
const fs = require('node:fs');
const { auditSkill, formatReport } = require('./index');

const version = require('../package.json').version;
const args = process.argv.slice(2);
const formatArg = args.find((arg) => arg.startsWith('--format='));
const format = formatArg ? formatArg.split('=')[1] : 'markdown';
const file = args.find((arg) => !arg.startsWith('-'));

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write([
    'Usage: skillrisk <SKILL.md|-> [--format=markdown|json]',
    '',
    'Audit reusable agent skill instructions for release-readiness risk boundaries.',
    '',
    'Options:',
    '  --format=markdown|json  Print Markdown by default or JSON for automation',
    '  --version               Print the package version',
    '  --help                  Show this help',
    ''
  ].join('\n'));
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}

try {
  const text = file && file !== '-' ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const report = auditSkill(text);
  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (format === 'markdown') {
    process.stdout.write(formatReport(report));
  } else {
    throw new Error('format must be markdown or json');
  }
  if (report.status === 'blocked') process.exitCode = 2;
} catch (error) {
  console.error(`skillrisk: ${error.message}`);
  process.exit(1);
}
