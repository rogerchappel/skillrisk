# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - Release Candidate

- Added package metadata for the public GitHub repository, issue tracker, homepage, license, and Node.js runtime support.
- Added a conservative npm `files` allowlist and `package:smoke` check that verifies CLI entrypoints and packed runtime files.
- Added a `release:check` script and GitHub Actions workflow that run syntax checks, tests, fixture smoke coverage, and package dry-run verification.
