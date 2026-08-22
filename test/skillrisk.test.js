const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { auditSkill, formatReport } = require('../src/index');

const completeSkill = 'Use when reviewing skills. Required inputs: SKILL.md. Side effects: none. Approval required before external writes. Validate with npm test.';

test('passes complete skill text', () => {
  const result = auditSkill(completeSkill);
  assert.equal(result.status, 'pass');
});

test('ignores readiness declarations inside Markdown HTML comments', () => {
  const result = auditSkill(`<!--\n${completeSkill}\n-->`);
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.findings.map((finding) => finding.code), [
    'missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation'
  ]);
});

test('comments cannot complete visible placeholder declarations', () => {
  const result = auditSkill(`Use when TODO. Inputs: TBD.
<!-- Side effects: local-only. Approval required before publishing. Validate with npm test. -->`);
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.findings.map((finding) => finding.code), [
    'missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation'
  ]);
});

test('keeps equivalent visible declarations around comments', () => {
  const result = auditSkill(`Use when reviewing skills. <!-- internal note -->
Required inputs: SKILL.md. Side effects: none.
<!-- another note --> Approval required before external writes. Validate with npm test.`);
  assert.equal(result.status, 'pass');
});

test('rejects empty and placeholder-only readiness sections', () => {
  const cases = [
    '## When to use\n## Inputs\n## Side effects\n## Approval requirements\n## Validation',
    'When to use:\nInputs:\nSide effects:\nApproval requirements:\nValidation:',
  ];

  for (const text of cases) {
    const result = auditSkill(text);
    assert.equal(result.status, 'blocked', text);
    assert.deepEqual(
      result.findings.map((finding) => finding.code),
      ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation'],
      text
    );
  }
});

test('blocks missing side-effect and approval boundaries', () => {
  const result = auditSkill('Use when making summaries. Required inputs: a file. Validate with smoke tests.');
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((f) => f.code === 'missing-side-effects'));
});

test('does not treat negated and incomplete declarations as readiness evidence', () => {
  const result = auditSkill('Use when reviewing. Inputs required. There are no documented side effects or approval requirements. No validation test exists.');
  assert.equal(result.status, 'blocked');
  assert.deepEqual(
    result.findings.map((finding) => finding.code),
    ['missing-side-effects', 'missing-approval', 'missing-validation']
  );
});

test('rejects explicit unresolved language across every readiness rule', () => {
  const result = auditSkill("I don't know when to use this. Inputs are TBD. Side effects cannot be determined. Approval TBD. Tests TBD.");

  assert.equal(result.status, 'blocked');
  assert.deepEqual(
    result.findings.map((finding) => finding.code),
    ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation']
  );
});

test('rejects unresolved word orders and natural contractions', () => {
  const cases = [
    "When to use this isn't known. TBD inputs. Side effects haven't been determined. Approval can't be determined. Validation isn't specified.",
    "It is not known when to use this. Required inputs cannot be determined. Cannot determine side effects. We haven't determined approval requirements. We don't know the tests.",
  ];

  for (const text of cases) {
    const result = auditSkill(text);
    assert.equal(result.status, 'blocked', text);
    assert.deepEqual(
      result.findings.map((finding) => finding.code),
      ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation'],
      text
    );
  }
});

test('rejects incomplete boundary declarations regardless of word order', () => {
  const cases = [
    'Side effects are not documented. Approval is not required before external actions.',
    'Side effects remain unknown. Approval requirements are unspecified.',
    'Missing side effects. Undocumented approval requirements.',
  ];

  for (const boundaries of cases) {
    const result = auditSkill(`Use when reviewing. Inputs required. ${boundaries} Validate with npm test.`);
    assert.equal(result.status, 'blocked', boundaries);
    assert.ok(result.findings.some((finding) => finding.code === 'missing-side-effects'), boundaries);
    assert.ok(result.findings.some((finding) => finding.code === 'missing-approval'), boundaries);
  }
});

test('preserves explicit affirmative boundary declarations', () => {
  const cases = [
    'Side effects: none. Approval required before external writes.',
    'This is local-only. Ask before external actions.',
    'Dry-run mode. Approval is required before publishing.',
    'No external writes. Ask for approval before publishing.',
    'Side effects: no external writes. Approval required before publishing.',
  ];

  for (const boundaries of cases) {
    const result = auditSkill(`Use when reviewing. Inputs required. ${boundaries} Validate with npm test.`);
    assert.equal(result.status, 'pass', boundaries);
  }
});

test('accepts documented standalone side-effect declarations', () => {
  for (const boundary of ['local-only', 'dry-run']) {
    const result = auditSkill(`Use when reviewing. Inputs required.\n${boundary}\nApproval required before publishing. Validate with npm test.`);
    assert.equal(result.status, 'pass', boundary);
    assert.deepEqual(result.findings, [], boundary);
  }
});

test('does not accept guarded standalone side-effect lookalikes', () => {
  for (const boundary of [
    'Side effects:',
    'local-only is not documented',
    'dry-run remains unknown',
    '```text\nlocal-only\n```',
    '~~~text\ndry-run\n~~~',
  ]) {
    const result = auditSkill(`Use when reviewing. Inputs required.\n${boundary}\nApproval required before publishing. Validate with npm test.`);
    assert.ok(result.findings.some((finding) => finding.code === 'missing-side-effects'), boundary);
  }
});

test('accepts explicit absence declarations for inputs, approval, and tests', () => {
  const result = auditSkill(
    'When to use: audit a local skill. Inputs: no inputs are required. Side effects: none. Approval: no approval is required. Validation: no tests are required.'
  );

  assert.equal(result.status, 'pass');
  assert.deepEqual(result.findings, []);
});

test('does not generalize explicit absence declarations to unresolved negations', () => {
  const cases = [
    'Inputs: no documented inputs are required. Approval: no known approval is required. Validation: no specified tests are required.',
    'Inputs are not required. Approval is not required. Tests are not required.',
  ];

  for (const declarations of cases) {
    const result = auditSkill(`When to use: audit a local skill. ${declarations} Side effects: none.`);
    assert.deepEqual(
      result.findings.map((finding) => finding.code),
      ['missing-inputs', 'missing-approval', 'missing-validation'],
      declarations
    );
  }
});

test('cli blocks negated boundary declarations from stdin', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: 'Use when reviewing. Inputs required. There are no documented side effects or approval requirements. No validation test exists.\n',
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.ok(report.findings.some((finding) => finding.code === 'missing-side-effects'));
  assert.ok(report.findings.some((finding) => finding.code === 'missing-approval'));
});

test('cli passes explicit absence declarations from stdin', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: 'When to use: audit a local skill. Inputs: no inputs are required. Side effects: none. Approval: no approval is required. Validation: no tests are required.\n',
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), { status: 'pass', findings: [] });
});

test('cli blocks declarations supplied only by Markdown HTML comments', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: `<!-- ${completeSkill} -->\n`,
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  assert.deepEqual(
    JSON.parse(result.stdout).findings.map((finding) => finding.code),
    ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation']
  );
});

test('cli accepts visible declarations mixed with Markdown HTML comments', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: `<!-- draft note -->\n${completeSkill}\n`,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), { status: 'pass', findings: [] });
});

test('cli accepts standalone side-effect declarations from stdin', () => {
  for (const boundary of ['local-only', 'dry-run']) {
    const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
      input: `Use when reviewing. Inputs required. ${boundary}. Approval required before publishing. Validate with npm test.\n`,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, boundary);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'pass', findings: [] }, boundary);
  }
});

test('cli does not pass wholly unresolved declarations from stdin', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: "I don't know when to use this. Inputs are TBD. Side effects cannot be determined. Approval TBD. Tests TBD.\n",
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'blocked');
  assert.deepEqual(
    report.findings.map((finding) => finding.code),
    ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation']
  );
});

test('cli reports headings-only fixtures as missing in JSON and Markdown', () => {
  for (const format of ['json', 'markdown']) {
    const result = spawnSync(process.execPath, ['src/cli.js', 'fixtures/headings-only-skill.md', `--format=${format}`], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 2, format);
    if (format === 'json') {
      const report = JSON.parse(result.stdout);
      assert.equal(report.status, 'blocked');
      assert.deepEqual(
        report.findings.map((finding) => finding.code),
        ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation']
      );
    } else {
      assert.match(result.stdout, /Status: blocked/);
      for (const code of ['missing-use-case', 'missing-inputs', 'missing-side-effects', 'missing-approval', 'missing-validation']) {
        assert.match(result.stdout, new RegExp(code));
      }
    }
  }
});

test('cli blocks reversed-order incomplete boundary declarations from stdin', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', '-', '--format=json'], {
    input: 'Use when reviewing. Inputs required. Side effects are not documented. Approval is not required before external actions. Validate with npm test.\n',
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.ok(report.findings.some((finding) => finding.code === 'missing-side-effects'));
  assert.ok(report.findings.some((finding) => finding.code === 'missing-approval'));
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

test('cli exposes help and version for package smoke checks', () => {
  const help = execFileSync(process.execPath, ['src/cli.js', '--help'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.match(help, /Usage: skillrisk/);
  assert.match(help, /--format=markdown\|json/);

  const version = execFileSync(process.execPath, ['src/cli.js', '--version'], { cwd: process.cwd(), encoding: 'utf8' }).trim();
  assert.match(version, /^\d+\.\d+\.\d+/);
});

test('cli emits JSON for automation', () => {
  const output = execFileSync(process.execPath, ['src/cli.js', 'fixtures/safe-skill.md', '--format=json'], { cwd: process.cwd(), encoding: 'utf8' });
  const report = JSON.parse(output);
  assert.equal(report.status, 'pass');
  assert.deepEqual(report.findings, []);
});

test('cli rejects unknown output formats', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'fixtures/safe-skill.md', '--format=yaml'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid format: yaml/);
  assert.match(result.stderr, /Usage: skillrisk/);
});

test('cli rejects unknown options', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'fixtures/safe-skill.md', '--wat'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^skillrisk: unknown option: --wat\nUsage: skillrisk/m);
});

test('cli rejects duplicate and conflicting format options', () => {
  for (const formats of [
    ['--format=json', '--format=json'],
    ['--format=json', '--format=markdown'],
  ]) {
    const result = spawnSync(process.execPath, ['src/cli.js', 'fixtures/safe-skill.md', ...formats], { cwd: process.cwd(), encoding: 'utf8' });
    assert.equal(result.status, 1, formats.join(' '));
    assert.match(result.stderr, /format option may only be specified once/, formats.join(' '));
    assert.match(result.stderr, /Usage: skillrisk/, formats.join(' '));
  }
});

test('cli rejects extra positional inputs', () => {
  const result = spawnSync(process.execPath, ['src/cli.js', 'fixtures/safe-skill.md', 'fixtures/risky-skill.md'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /expected at most one input/);
  assert.match(result.stderr, /Usage: skillrisk/);
});

test('cli rejects help or version combined with other arguments', () => {
  for (const args of [['--help', 'fixtures/safe-skill.md'], ['--version', '--format=json']]) {
    const result = spawnSync(process.execPath, ['src/cli.js', ...args], { cwd: process.cwd(), encoding: 'utf8' });
    assert.equal(result.status, 1, args.join(' '));
    assert.match(result.stderr, /must be used alone/, args.join(' '));
    assert.match(result.stderr, /Usage: skillrisk/, args.join(' '));
  }
});
