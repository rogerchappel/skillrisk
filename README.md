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

## Library

Import from `src/index.js` in local automation.

## Limitations

The package is intentionally local-first and does not publish, post, or write to external systems.

## Safety

Review generated output before using it in public content or external workflows.

## Example Workflow

1. Prepare the local fixture.
2. Run the smoke command.
3. Review the report before drafting or acting.

## Verification

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

Use `npm run release:check` before publishing or opening a release PR.
