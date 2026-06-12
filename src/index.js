const RULES = [
  { code: 'missing-use-case', severity: 'warn', test: (t) => /use when|when to use/i.test(t), message: 'Add a clear when-to-use section.' },
  { code: 'missing-inputs', severity: 'warn', test: (t) => /input|required|requires/i.test(t), message: 'List required inputs or tools.' },
  { code: 'missing-side-effects', severity: 'block', test: (t) => /side effects|local-only|no external|dry-run/i.test(t), message: 'State side-effect boundaries.' },
  { code: 'missing-approval', severity: 'block', test: (t) => /approval|required before|ask before/i.test(t), message: 'Declare approval requirements for external actions.' },
  { code: 'missing-validation', severity: 'warn', test: (t) => /validate|verification|test|smoke/i.test(t), message: 'Describe validation or verification workflow.' }
];
function auditSkill(text) {
  const body = String(text || '');
  const findings = RULES.filter((rule) => !rule.test(body)).map((rule) => ({ code: rule.code, severity: rule.severity, message: rule.message }));
  const blocked = findings.some((f) => f.severity === 'block');
  return { status: blocked ? 'blocked' : findings.length ? 'review' : 'pass', findings };
}
function formatReport(result) {
  const lines = [`# Skill Risk Report`, '', `Status: ${result.status}`, '', '## Findings'];
  if (!result.findings.length) lines.push('- None');
  for (const finding of result.findings) lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
  lines.push('', '## Next Step', result.status === 'pass' ? 'Skill instructions are ready for human review.' : 'Revise the skill instructions and rerun this checker.', '');
  return lines.join('\n');
}
module.exports = { RULES, auditSkill, formatReport };
