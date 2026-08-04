#!/usr/bin/env node
const fs = require('node:fs');
const { auditSkill, formatReport } = require('./index');

const version = require('../package.json').version;
const args = process.argv.slice(2);
const usage = 'Usage: skillrisk <SKILL.md|-> [--format=markdown|json]';

function usageError(message) {
  process.stderr.write(`skillrisk: ${message}\n${usage}\n`);
  process.exit(1);
}

const helpArgs = args.filter((arg) => arg === '--help' || arg === '-h');
const versionArgs = args.filter((arg) => arg === '--version' || arg === '-v');

if ((helpArgs.length || versionArgs.length) && args.length !== 1) {
  usageError('--help and --version must be used alone');
}

if (helpArgs.length) {
  process.stdout.write([
    usage,
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

if (versionArgs.length) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}

const formatArgs = args.filter((arg) => arg.startsWith('--format='));
if (formatArgs.length > 1) usageError('format option may only be specified once');

const unknownOption = args.find((arg) => arg.startsWith('-') && arg !== '-' && !arg.startsWith('--format='));
if (unknownOption) usageError(`unknown option: ${unknownOption}`);

const inputs = args.filter((arg) => arg === '-' || !arg.startsWith('-'));
if (inputs.length > 1) usageError('expected at most one input');

const format = formatArgs.length ? formatArgs[0].slice('--format='.length) : 'markdown';
if (format !== 'markdown' && format !== 'json') usageError(`invalid format: ${format || '(empty)'}`);

const file = inputs[0];

try {
  const text = file && file !== '-' ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const report = auditSkill(text);
  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatReport(report));
  }
  if (report.status === 'blocked') process.exitCode = 2;
} catch (error) {
  console.error(`skillrisk: ${error.message}`);
  process.exit(1);
}
