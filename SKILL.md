# skillrisk

## When To Use

Use skillrisk when reviewing a SKILL.md proposal for missing approvals, side-effect boundaries, unclear inputs, or absent verification.

## Required Inputs

- A local fixture or text file relevant to the review.

## Side Effects

This skill is local-only. It reads supplied files and writes output to stdout unless the caller redirects it.

## Approval Requirements

Ask for explicit approval before using the output to publish, post, message, create tickets, or modify external systems.

## Examples

Run `npm run smoke` after installing dependencies.

## Verification

Run `npm test`, `npm run check`, and `npm run smoke`.
