# skillrisk

Local-first risk checker for reusable agent skill instructions.

## Quickstart

```sh
npm test
npm run smoke
```

## CLI

Run the CLI against the included fixture.

```sh
npm run smoke
node src/cli.js fixtures/safe-skill.md --format=json
node src/cli.js --help
node src/cli.js --version
```

The default output is Markdown for human review. Use `--format=json` when another local release check, agent workflow, or CI step needs to parse the risk status.

### Options

- `--format=markdown|json`: print Markdown by default or structured JSON for automation.
- `--help`: print usage and options.
- `--version`: print the package version.

Pass at most one input path (or `-` for stdin) and at most one `--format` option. Unknown
options, duplicate or conflicting format options, unsupported formats, and extra input paths
are usage errors. `--help` and `--version` must each be used alone. Usage errors print a
concise message and the usage line to stderr.

### Exit status

- `0`: the input passes the audit, or help/version was requested.
- `1`: the command line is invalid or the input cannot be read.
- `2`: the audit completed and produced a blocked report.

## Library

Import from `src/index.js` in local automation.

The audit evaluates rendered Markdown prose. Readiness declarations inside genuine inline code, HTML comments (`<!-- ... -->`), four-space/tab-indented code blocks, or backtick/tilde fenced code blocks are ignored. Backslash-escaped backtick literals remain visible prose rather than opening or closing inline code. An unclosed HTML comment hides everything from its opening marker through the end of the input, matching rendered Markdown behavior; visible prose before it remains eligible. Closing fences may be longer than their opener, following CommonMark. Keep required use-case, input, side-effect, approval, and validation guidance visible as prose.
HTML comment markers inside fenced code are treated as literal code, so they cannot hide visible declarations after the closing fence.

## Limitations

The package is intentionally local-first and does not publish, post, or write to external systems.
Its boundary audit recognizes explicit, short declarations rather than interpreting arbitrary prose.
Readiness headings and labels must include substantive declaration content; empty sections such as
`## Inputs` or a bare `Approval requirements:` label do not satisfy a rule.
Within a sentence-like clause, a side-effect or approval declaration containing `no`, `not`,
`missing`, `undocumented`, `unspecified`, `unknown`, or `TBD` does not satisfy that boundary rule,
regardless of whether the qualifier comes before or after the boundary term. The same unresolved
language is rejected for use-case, input, and validation declarations. The checker also recognizes
common explicit uncertainty forms such as “cannot be determined”, “don't know”, “can't determine”,
“isn't known”, and “haven't determined”. Explicit forms such as “Side effects: none”, “local-only”,
“no external writes”, “dry-run”, “approval required before”, and “ask before” remain affirmative
declarations. `local-only` and `dry-run` may each be the entire clause (ignoring surrounding
whitespace and punctuation); inline code, fenced examples, and indented code blocks are excluded from declaration matching. The
corresponding readiness rules also accept the explicit absence forms “no inputs
are required”, “no approval is required”, and “no tests are required”; reversed or qualified
negations such as “inputs are not required” or “no documented inputs are required” remain
unresolved. The checker splits clauses at newlines and `.`, `!`, or `?`; it does not perform semantic
interpretation across clauses.
The checker is a release-readiness prompt, not a substitute for human review of whether a
declaration is accurate or complete.

## Safety

Review generated output before using it in public content or external workflows.

## Example Workflow

1. Prepare the local fixture.
2. Run the smoke command.
3. Review the report before drafting or acting.

## Verification

```sh
npm ci
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

Run `npm ci` from a clean checkout, then use `npm run release:check` before publishing or
opening a release PR. The release gate rejects a missing or stale `package-lock.json`.
