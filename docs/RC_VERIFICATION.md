# Verification Record

This document is the repeatable release-candidate verification procedure. The
results from an individual run are transient; do not record an old passing
result as evidence for a later candidate. Record the exact commit and fresh
command results in the pull request or release review instead.

## Procedure

Start from a clean checkout of the exact candidate commit and record its
`git rev-parse HEAD` value. Then run the repository's full release gate:

```sh
npm ci
npm run release:check
```

The release gate checks the lockfile, JavaScript syntax, automated tests,
fixture smoke output, and packed-package contents. If either command fails,
record the failing command and relevant output, fix the candidate, and rerun the
procedure against the resulting commit.

## Review record

For each candidate, capture:

- candidate commit SHA;
- `npm ci` result;
- `npm run release:check` result, including any failed subcommand;
- reviewer and date; and
- final classification (`ship` or `hold`) with any outstanding issue.

Do not classify a candidate as `ship` unless all checks pass on the recorded
commit and the reviewer has assessed the output. This file describes the
procedure; update it only when the release checks or review criteria change.
