/**
 * mkly CSS parser — simplified syntax that compiles to real CSS.
 *
 * v2 syntax (indentation-based):
 *   // comments
 *   accent: #e2725b              → CSS custom property --mkly-accent
 *   fontBody: Georgia, serif     → --mkly-font-body
 *   color: #fff                  → direct CSS: color: #fff
 *   fontSize: 16px               → direct CSS: font-size: 16px
 *
 *   heading                      → .mkly-heading { ... }
 *     letterSpacing: -0.5px        → letter-spacing: -0.5px
 *     color: $accent               → color: var(--mkly-accent)
 *
 *   card                         → .mkly-card { ... }
 *     borderRadius: $radius        → border-radius: var(--mkly-radius)
 *     .img                       → .mkly-card__img { ... }
 *       objectFit: cover
 *     :hover                     → .mkly-card:hover { ... }
 *       transform: translateY(-2px)
 *
 * Legacy v1 syntax (brace-based) is auto-detected and still supported.
 */

export interface MklyStyleResult {
  css: string;
  variables: Record<string, string>;
}

export interface StyleVariable {
  name: string;
  cssVar: string;
  description: string;
}

const COMMENT_RE = /^\s*\/\//;
const INLINE_COMMENT_RE = /\s+\/\/\s.*$/;
const PROP_RE = /^([\w-]+)\s*:\s*(.+)$/;
const VAR_REF_RE = /\$(\w+)/g;

export const VARIABLE_TO_CSS: Record<string, string> = {
  accent: '--mkly-accent',
  accentHover: '--mkly-accent-hover',
  bg: '--mkly-bg',
  text: '--mkly-text',
  muted: '--mkly-muted',
  border: '--mkly-border',
  textAlign: '--mkly-text-align',
  fontSize: '--mkly-font-size',
  lineHeight: '--mkly-line-height',
  fontBody: '--mkly-font-body',
  fontHeading: '--mkly-font-heading',
  fontMono: '--mkly-font-mono',
  radius: '--mkly-radius',
  spacing: '--mkly-spacing',
  bgSubtle: '--mkly-bg-subtle',
  gapScale: '--mkly-gap-scale',
  lineHeightScale: '--mkly-line-height-scale',
};

export function resolveVariableName(key: string): string {
  return VARIABLE_TO_CSS[key] ?? `--mkly-${toKebab(key)}`;
}

export const STYLE_VARIABLES: StyleVariable[] = [
  { name: 'accent', cssVar: '--mkly-accent', description: 'Primary accent color' },
  { name: 'accentHover', cssVar: '--mkly-accent-hover', description: 'Accent color on hover' },
  { name: 'bg', cssVar: '--mkly-bg', description: 'Document background color' },
  { name: 'text', cssVar: '--mkly-text', description: 'Main text color' },
  { name: 'muted', cssVar: '--mkly-muted', description: 'Muted/secondary text color' },
  { name: 'border', cssVar: '--mkly-border', description: 'Border color' },
  { name: 'textAlign', cssVar: '--mkly-text-align', description: 'Global text alignment' },
  { name: 'fontSize', cssVar: '--mkly-font-size', description: 'Base font size for document text' },
  { name: 'lineHeight', cssVar: '--mkly-line-height', description: 'Base line-height multiplier for body text' },
  { name: 'fontBody', cssVar: '--mkly-font-body', description: 'Body font family' },
  { name: 'fontHeading', cssVar: '--mkly-font-heading', description: 'Heading font family' },
  { name: 'fontMono', cssVar: '--mkly-font-mono', description: 'Monospace font family' },
  { name: 'radius', cssVar: '--mkly-radius', description: 'Default border radius' },
  { name: 'spacing', cssVar: '--mkly-spacing', description: 'Default spacing between blocks' },
  { name: 'bgSubtle', cssVar: '--mkly-bg-subtle', description: 'Subtle section background color' },
  { name: 'gapScale', cssVar: '--mkly-gap-scale', description: 'Scale multiplier for gaps between blocks (default 1)' },
  { name: 'lineHeightScale', cssVar: '--mkly-line-height-scale', description: 'Scale multiplier for body text line-height (default 1)' },
];

import { toKebab } from './utils';

function stripComment(value: string): string {
  return value.replace(INLINE_COMMENT_RE, '').trim();
}

function blockToClass(name: string): string {
  return `mkly-${name.replace('/', '-')}`;
}

function selectorToCSS(selector: string): string {
  const dotIdx = selector.indexOf('.');
  const colonIdx = selector.indexOf(':');

  if (dotIdx !== -1) {
    const block = selector.slice(0, dotIdx);
    const sub = selector.slice(dotIdx + 1);
    return `.${blockToClass(block)}__${sub}`;
  }

  if (colonIdx !== -1) {
    const block = selector.slice(0, colonIdx);
    const pseudo = selector.slice(colonIdx);
    return `.${blockToClass(block)}${pseudo}`;
  }

  return `.${blockToClass(selector)}`;
}

function resolveVariableRefs(value: string): string {
  return value.replace(VAR_REF_RE, (_, name: string) => {
    return `var(${resolveVariableName(name)})`;
  });
}

function cssPropertyName(key: string): string {
  // If already kebab-case (contains a dash), use as-is
  if (key.includes('-')) return key;
  // Convert camelCase to kebab-case
  return toKebab(key);
}

// ---------------------------------------------------------------------------
// Auto-detect: if source contains `{`, use legacy brace parser
// ---------------------------------------------------------------------------

function usesLegacySyntax(source: string): boolean {
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (COMMENT_RE.test(trimmed)) continue;
    if (trimmed.endsWith('{') || trimmed === '}') return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Legacy v1 parser (brace-based)
// ---------------------------------------------------------------------------

const RULE_OPEN_RE = /^([\w]+(?:\/[\w]+)?(?:[.:]\w+)?)\s*\{$/;
const RULE_CLOSE_RE = /^\}$/;

function parseLegacy(source: string): MklyStyleResult {
  const lines = source.split('\n');
  const variables: Record<string, string> = {};
  const rules: Array<{ selector: string; properties: Array<[string, string]> }> = [];

  let currentRule: { selector: string; properties: Array<[string, string]> } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || COMMENT_RE.test(trimmed)) continue;

    if (currentRule) {
      if (RULE_CLOSE_RE.test(trimmed)) {
        rules.push(currentRule);
        currentRule = null;
        continue;
      }

      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        currentRule.properties.push([propMatch[1], stripComment(propMatch[2])]);
      }
      continue;
    }

    const ruleMatch = trimmed.match(RULE_OPEN_RE);
    if (ruleMatch) {
      currentRule = { selector: ruleMatch[1], properties: [] };
      continue;
    }

    const propMatch = trimmed.match(PROP_RE);
    if (propMatch) {
      variables[propMatch[1]] = stripComment(propMatch[2]);
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  return buildCSS(variables, rules);
}

// ---------------------------------------------------------------------------
// v2 parser (indentation-based)
// ---------------------------------------------------------------------------

// A selector line: word-only at indent 0, optionally with .sub or :pseudo suffix
const SELECTOR_RE = /^[\w]+(?:\/[\w]+)?(?:[.:]\w[\w-]*)?$/;
const SUB_ELEMENT_RE = /^\.([\w]+)$/;
const PSEUDO_RE = /^(:\w[\w-]*)$/;

function getIndent(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === ' ') count++;
    else if (ch === '\t') count += 2;
    else break;
  }
  return count;
}

interface ParsedRule {
  selector: string;
  properties: Array<[string, string]>;
}

function parseIndented(source: string): MklyStyleResult {
  const lines = source.split('\n');
  const variables: Record<string, string> = {};
  const rules: ParsedRule[] = [];

  let currentBlock: string | null = null;
  let currentSelector: string | null = null;
  let currentProps: Array<[string, string]> = [];

  function flushRule() {
    if (currentSelector && currentProps.length > 0) {
      rules.push({ selector: currentSelector, properties: [...currentProps] });
    }
    currentProps = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || COMMENT_RE.test(trimmed)) continue;

    const indent = getIndent(line);

    // Indent 0: top-level — variable or block selector
    if (indent === 0) {
      flushRule();
      currentSelector = null;

      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        // Variable declaration (has colon)
        variables[propMatch[1]] = stripComment(propMatch[2]);
        currentBlock = null;
        continue;
      }

      if (SELECTOR_RE.test(trimmed)) {
        // Block selector — extract base block for sub-element composition
        const dotIdx = trimmed.indexOf('.');
        const colonIdx = trimmed.indexOf(':');
        const compoundIdx = dotIdx !== -1 ? dotIdx : colonIdx;
        currentBlock = compoundIdx !== -1 ? trimmed.slice(0, compoundIdx) : trimmed;
        currentSelector = trimmed;
        continue;
      }

      continue;
    }

    // Indent 1+: inside a block (or top-level variable with extra whitespace)
    if (!currentBlock) {
      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        variables[propMatch[1]] = stripComment(propMatch[2]);
      }
      continue;
    }

    // Check for sub-element or pseudo at indent 1
    const subMatch = trimmed.match(SUB_ELEMENT_RE);
    if (subMatch) {
      flushRule();
      currentSelector = `${currentBlock}.${subMatch[1]}`;
      continue;
    }

    const pseudoMatch = trimmed.match(PSEUDO_RE);
    if (pseudoMatch) {
      flushRule();
      currentSelector = `${currentBlock}${pseudoMatch[1]}`;
      continue;
    }

    // Property inside a rule
    const propMatch = trimmed.match(PROP_RE);
    if (propMatch) {
      const key = cssPropertyName(propMatch[1]);
      currentProps.push([key, stripComment(propMatch[2])]);
    }
  }

  flushRule();

  return buildCSS(variables, rules);
}

// ---------------------------------------------------------------------------
// Shared CSS builder
// ---------------------------------------------------------------------------

function buildCSS(
  variables: Record<string, string>,
  rules: Array<{ selector: string; properties: Array<[string, string]> }>,
): MklyStyleResult {
  const cssLines: string[] = [];

  const docRuleLines: string[] = [];
  for (const [key, value] of Object.entries(variables)) {
    if (key in VARIABLE_TO_CSS) {
      docRuleLines.push(`  ${VARIABLE_TO_CSS[key]}: ${value};`);
    } else {
      docRuleLines.push(`  ${cssPropertyName(key)}: ${resolveVariableRefs(value)};`);
    }
  }
  if (docRuleLines.length > 0) {
    cssLines.push(`.mkly-document {\n${docRuleLines.join('\n')}\n}`);
  }

  for (const rule of rules) {
    const selector = selectorToCSS(rule.selector);
    const props = rule.properties
      .map(([k, v]) => `  ${k}: ${resolveVariableRefs(v)};`)
      .join('\n');
    cssLines.push(`${selector} {\n${props}\n}`);
  }

  return {
    css: cssLines.join('\n\n'),
    variables,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseMklyStyle(source: string): MklyStyleResult {
  if (usesLegacySyntax(source)) {
    return parseLegacy(source);
  }
  return parseIndented(source);
}

/**
 * Merge multiple variable sources. Later sources override earlier ones.
 */
export function mergeVariables(...sources: Array<Record<string, string> | undefined>): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const source of sources) {
    if (source) {
      Object.assign(merged, source);
    }
  }
  return merged;
}

/**
 * Convert a theme config object to CSS custom property declarations.
 */
export function themeToCSS(theme: Record<string, string>): string {
  const overrides: string[] = [];
  for (const [key, value] of Object.entries(theme)) {
    if (!value) continue;
    overrides.push(`  ${resolveVariableName(key)}: ${value};`);
  }
  if (overrides.length === 0) return '';
  return `.mkly-document {\n${overrides.join('\n')}\n}`;
}
