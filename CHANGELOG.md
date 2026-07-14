# Changelog

## Unreleased

- Add `--format=json` CLI output for automation-friendly release checks.
- Document the CLI help, version, and output-format options in the README.

## 0.1.0

- Initial public release candidate for the reusable skill risk checker.
- Includes CLI smoke coverage, package smoke checks, and release-readiness scripts.
- Added public package metadata for the repository, issue tracker, homepage, license, and Node.js runtime support.
- Added a conservative npm `files` allowlist and `package:smoke` check that verifies CLI entrypoints and packed runtime files.
- Added a `release:check` script and GitHub Actions workflow that run syntax checks, tests, fixture smoke coverage, and package dry-run verification.
