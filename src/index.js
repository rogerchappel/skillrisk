function hasDeclaration(text, affirmative, incomplete) {
  return String(text || '')
    .split(/[\n.!?]+/)
    .some((clause) => affirmative.test(clause) && !incomplete.test(clause));
}

const RULES = [
  { code: 'missing-use-case', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:use when|when to use)\b/i, /\b(?:no|not|missing|undocumented|unspecified)\b/i), message: 'Add a clear when-to-use section.' },
  { code: 'missing-inputs', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:inputs?|requires?|required)\b/i, /\b(?:no|not|missing|undocumented|unspecified|unknown)\b/i), message: 'List required inputs or tools.' },
  { code: 'missing-side-effects', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:side effects?|local-only|no external|dry-run)\b/i, /\b(?:no|not|missing|undocumented|unspecified|unknown)\b.*\bside effects?\b/i), message: 'State side-effect boundaries.' },
  { code: 'missing-approval', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:approval|required before|ask before)\b/i, /\b(?:no|not|missing|undocumented|unspecified|unknown)\b.*\bapproval requirements?\b/i), message: 'Declare approval requirements for external actions.' },
  { code: 'missing-validation', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:validate|validation|verification|tests?|smoke)\b/i, /\b(?:no|not|missing|undocumented|unspecified|unknown)\s+(?:validation|verification|tests?|smoke)\b/i), message: 'Describe validation or verification workflow.' }
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
