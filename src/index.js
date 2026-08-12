function hasDeclaration(text, affirmative, incomplete) {
  return String(text || '')
    .split(/[\n.!?]+/)
    .some((clause) => {
      if (!affirmative.test(clause) || incomplete.test(clause.replace(/\bno external\b/gi, 'external'))) return false;

      const remainder = clause
        .replace(affirmative, ' ')
        .replace(/\brequirements?\b/gi, ' ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

      return remainder.length > 0;
    });
}

const UNRESOLVED = /\b(?:tbd|no|not|missing|undocumented|unspecified|unknown)\b|\b(?:cannot|can['’]t)\s+(?:be\s+)?determin(?:e|ed)\b|\b(?:do\s+not|don['’]t)\s+know\b|\b(?:has|have|had)\s+not\s+(?:been\s+)?determin(?:e|ed)\b|\b(?:hasn['’]t|haven['’]t|hadn['’]t)\s+(?:been\s+)?determin(?:e|ed)\b|\b(?:isn['’]t|aren['’]t|wasn['’]t|weren['’]t)\s+(?:known|documented|specified|determined)\b/i;

const RULES = [
  { code: 'missing-use-case', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:use when|when to use)\b/i, UNRESOLVED), message: 'Add a clear when-to-use section.' },
  { code: 'missing-inputs', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:inputs?|requires?|required)\b/i, UNRESOLVED), message: 'List required inputs or tools.' },
  { code: 'missing-side-effects', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:side effects?|local-only|no external|dry-run)\b/i, UNRESOLVED), message: 'State side-effect boundaries.' },
  { code: 'missing-approval', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:approval|required before|ask before)\b/i, UNRESOLVED), message: 'Declare approval requirements for external actions.' },
  { code: 'missing-validation', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:validate|validation|verification|tests?|smoke)\b/i, UNRESOLVED), message: 'Describe validation or verification workflow.' }
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
