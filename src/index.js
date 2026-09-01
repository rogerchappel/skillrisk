function withoutInlineCode(text) {
  const isEscaped = (position) => {
    let backslashes = 0;
    for (let index = position - 1; index >= 0 && text[index] === '\\'; index--) backslashes++;
    return backslashes % 2 === 1;
  };

  let result = '';
  for (let index = 0; index < text.length;) {
    if (text[index] !== '`') {
      result += text[index++];
      continue;
    }

    let end = index;
    while (text[end] === '`') end++;
    const delimiter = text.slice(index, end);
    if (isEscaped(index)) {
      result += delimiter;
      index = end;
      continue;
    }

    let closing = text.indexOf(delimiter, end);
    while (closing !== -1 && (
      isEscaped(closing) || text[closing - 1] === '`' || text[closing + delimiter.length] === '`'
    )) {
      closing = text.indexOf(delimiter, closing + delimiter.length);
    }
    if (closing === -1) {
      result += delimiter;
      index = end;
      continue;
    }

    result += ' ';
    index = closing + delimiter.length;
  }
  return result;
}

function withoutNonRenderedMarkdown(text) {
  const lines = String(text || '').split('\n');
  let fence = null;
  let comment = false;
  const visible = lines.map((line) => {
    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) fence = null;
      return '';
    }

    if (comment) {
      const closing = line.indexOf('-->');
      if (closing === -1) return '';
      comment = false;
      line = line.slice(closing + 3);
    }

    const opening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opening && !(opening[1][0] === '`' && opening[2].includes('`'))) {
      fence = { marker: opening[1][0], length: opening[1].length };
      return '';
    }

    if (/^(?: {4}|\t)/.test(line)) return '';

    let rendered = '';
    for (let index = 0; index < line.length;) {
      const openingComment = line.indexOf('<!--', index);
      if (openingComment === -1) {
        rendered += line.slice(index);
        break;
      }
      rendered += line.slice(index, openingComment);
      const closingComment = line.indexOf('-->', openingComment + 4);
      if (closingComment === -1) {
        comment = true;
        break;
      }
      rendered += ' ';
      index = closingComment + 3;
    }
    return rendered;
  }).join('\n');
  return withoutInlineCode(visible);
}

function hasDeclaration(text, affirmative, incomplete, explicitAbsence, standalone) {
  return withoutNonRenderedMarkdown(text)
    .split(/[\n.!?]+/)
    .some((clause) => {
      const unresolvedClause = clause.replace(/\bno external\b/gi, 'external');
      if (
        !affirmative.test(clause) ||
        (incomplete.test(unresolvedClause) && !(explicitAbsence && explicitAbsence.test(clause)))
      ) return false;

      if (standalone && standalone.test(clause.trim())) return true;

      const remainder = clause
        .replace(affirmative, ' ')
        .replace(/\brequirements?\b/gi, ' ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

      return remainder.length > 0;
    });
}

const UNRESOLVED = /\b(?:tbd|no|not|missing|undocumented|unspecified|unknown)\b|\b(?:cannot|can['’]t)\s+(?:be\s+)?determin(?:e|ed)\b|\b(?:do\s+not|don['’]t)\s+know\b|\b(?:has|have|had)\s+not\s+(?:been\s+)?determin(?:e|ed)\b|\b(?:hasn['’]t|haven['’]t|hadn['’]t)\s+(?:been\s+)?determin(?:e|ed)\b|\b(?:isn['’]t|aren['’]t|wasn['’]t|weren['’]t)\s+(?:known|documented|specified|determined)\b/i;
const NO_INPUTS_REQUIRED = /\bno\s+inputs?\s+(?:is|are)\s+required\b/i;
const NO_APPROVAL_REQUIRED = /\bno\s+approval\s+is\s+required\b/i;
const NO_TESTS_REQUIRED = /\bno\s+tests?\s+(?:is|are)\s+required\b/i;
const STANDALONE_SIDE_EFFECT = /^(?:local-only|dry-run)$/i;

const RULES = [
  { code: 'missing-use-case', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:use when|when to use)\b/i, UNRESOLVED), message: 'Add a clear when-to-use section.' },
  { code: 'missing-inputs', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:inputs?|requires?|required)\b/i, UNRESOLVED, NO_INPUTS_REQUIRED), message: 'List required inputs or tools.' },
  { code: 'missing-side-effects', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:side effects?|local-only|no external|dry-run)\b/i, UNRESOLVED, undefined, STANDALONE_SIDE_EFFECT), message: 'State side-effect boundaries.' },
  { code: 'missing-approval', severity: 'block', test: (t) => hasDeclaration(t, /\b(?:approval|required before|ask before)\b/i, UNRESOLVED, NO_APPROVAL_REQUIRED), message: 'Declare approval requirements for external actions.' },
  { code: 'missing-validation', severity: 'warn', test: (t) => hasDeclaration(t, /\b(?:validate|validation|verification|tests?|smoke)\b/i, UNRESOLVED, NO_TESTS_REQUIRED), message: 'Describe validation or verification workflow.' }
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
