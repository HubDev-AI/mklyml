/**
 * StyleGraph — unified canonical style model for mkly documents.
 *
 * All styles are represented as a single StyleGraph, parsed from
 * --- style block content using mkly v2 indented syntax.
 *
 * The StyleGraph is:
 * - Parsed from --- style block content
 * - Serialized back to mkly v2 indented syntax
 * - Compiled to CSS with @layer cascade
 * - Mutated immutably by the inspector
 */

import { toKebab } from './utils';
import { resolveVariableName, VARIABLE_TO_CSS } from './style-parser';
import { blockTypeToCssClass } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StyleRule {
  /** Block type selector: "core/card", "core/heading", etc. */
  blockType: string;
  /** Sub-element target: "self" for the block root, or "img", "link", etc. */
  target: string;
  /** Optional block instance label for per-instance styling (e.g. "hero" from core/card:hero) */
  label?: string;
  /** CSS properties as camelCase or kebab-case keys → values */
  properties: Record<string, string>;
}

export interface StyleVariable {
  name: string;
  value: string;
}

export interface StyleWarning {
  message: string;
  severity: 'warning' | 'error';
}

export interface StyleGraph {
  variables: StyleVariable[];
  rules: StyleRule[];
  warnings?: StyleWarning[];
}

// ---------------------------------------------------------------------------
// Aliases & property normalization
// ---------------------------------------------------------------------------

export const STYLE_ALIASES: Record<string, string> = {
  bg: 'background',
  fg: 'color',
  rounded: 'border-radius',
};

/** CSS properties that inherit to child elements. When set on a sub-element
 *  target, we also propagate them to child text elements so they override
 *  theme rawCss rules like `.mkly-document p { color: ... }`. */
const INHERITED_CSS_PROPS = new Set([
  'color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-transform',
  'text-indent', 'word-spacing',
]);

/** Convert a style property key to CSS property name. */
export function cssProperty(key: string): string {
  return STYLE_ALIASES[key] ?? (key.includes('-') ? key : toKebab(key));
}

function safeCssValue(v: string): string {
  return v.replace(/<\//gi, '<\\/');
}

/** Resolve $variable references to var(--mkly-*) */
export function resolveValue(value: string): string {
  return safeCssValue(value.replace(/\$(\w+)/g, (_, name: string) => {
    return `var(${resolveVariableName(name)})`;
  }));
}

// ---------------------------------------------------------------------------
// Selector resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a target string + blockType to a CSS selector.
 *
 * Examples:
 *   ("self", "core/card")                → ".mkly-core-card"
 *   ("self", "core/card", "hero")         → ".mkly-core-card--hero"
 *   ("self:hover", "core/card")           → ".mkly-core-card:hover"
 *   ("self:hover", "core/card", "hero")   → ".mkly-core-card--hero:hover"
 *   ("img", "core/card")                  → ".mkly-core-card__img"
 *   ("img", "core/card", "hero")          → ".mkly-core-card--hero__img"
 *   ("img:hover", "core/card")            → ".mkly-core-card__img:hover"
 */
export function resolveSelector(target: string, blockType: string, label?: string): string {
  const base = blockTypeToCssClass(blockType);
  const labelSuffix = label ? `--${label}` : '';

  if (target === 'self') return `.${base}${labelSuffix}`;

  // self:pseudo
  if (target.startsWith('self:')) {
    return `.${base}${labelSuffix}${target.slice(4)}`;
  }

  // Tag descendant target: ">p" → ".mkly-block p", ">p:hover" → ".mkly-block p:hover"
  if (target.startsWith('>')) {
    const tag = target.slice(1);
    return `.${base}${labelSuffix} ${tag}`;
  }

  // BEM sub-element with optional pseudo
  const pseudoIdx = target.indexOf(':');
  if (pseudoIdx !== -1) {
    const sub = target.slice(0, pseudoIdx);
    const pseudo = target.slice(pseudoIdx);
    return `.${base}${labelSuffix}__${sub}${pseudo}`;
  }

  return `.${base}${labelSuffix}__${target}`;
}

// ---------------------------------------------------------------------------
// Parsing: --- style block content → StyleGraph
// ---------------------------------------------------------------------------

const COMMENT_RE = /^\s*\/\//;
const INLINE_COMMENT_RE = /\s+\/\/\s.*$/;
const PROP_RE = /^([\w-]+)\s*:\s*(.+)$/;
// Matches "heading" or "core/card" (no colon — labels/pseudos handled separately)
const SELECTOR_RE = /^[\w]+(?:\/[\w]+)?$/;
const SUB_ELEMENT_RE = /^\.([\w][\w-]*)$/;
const PSEUDO_RE = /^(::?\w[\w-]*)$/;
// Combined sub-element + pseudo: ".img:hover", ".img::before"
const SUB_PSEUDO_RE = /^\.([\w][\w-]*)(::?\w[\w-]*)$/;
// Tag descendant target: ">p", ">h1" — generates descendant CSS selector
// Also matches class descendant: ">.s1" — generates ".mkly-block .s1"
const TAG_TARGET_RE = /^>(\.?[\w][\w-]*)$/;
// Tag descendant + pseudo: ">p:hover", ">a:visited", ">p:nth-of-type(2)"
// Also matches class + pseudo: ">.s1:hover"
const TAG_PSEUDO_RE = /^>(\.?[\w][\w-]*)(::?[\w-]+(?:\([^)]*\))?)$/;
// Label selector: requires kit prefix — "core/card:hero" (not "card:hover")
const LABEL_SELECTOR_RE = /^([\w]+\/[\w]+):(\w+)$/;

/** Strip inline `// comment` from a value (e.g. "#4A3728 // Dark brown" → "#4A3728"). */
function stripComment(value: string): string {
  return value.replace(INLINE_COMMENT_RE, '').trim();
}

function getIndent(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === ' ') count++;
    else if (ch === '\t') count += 2;
    else break;
  }
  return count;
}

function cssPropertyName(key: string): string {
  if (key.includes('-')) return key;
  return toKebab(key);
}

/**
 * Parse a --- style block's content into a StyleGraph.
 * Supports v2 indented syntax (the default) and auto-detects v1 brace syntax.
 */
export function parseStyleGraph(source: string): StyleGraph {
  if (!source.trim()) return { variables: [], rules: [] };

  // Auto-detect legacy brace syntax
  const usesLegacy = source.split('\n').some(line => {
    const t = line.trim();
    return !COMMENT_RE.test(t) && (t.endsWith('{') || t === '}');
  });

  return usesLegacy ? parseLegacyToGraph(source) : parseIndentedToGraph(source);
}

function parseLegacyToGraph(source: string): StyleGraph {
  const lines = source.split('\n');
  const variables: StyleVariable[] = [];
  const rules: StyleRule[] = [];

  const RULE_OPEN_RE = /^([\w]+(?:\/[\w]+)?(?::\w+)?(?:[.:]\w[\w-]*)?)\s*\{$/;

  let currentBlockType: string | null = null;
  let currentTarget = 'self';
  let currentLabel: string | undefined;
  let currentProps: Record<string, string> = {};

  function flushRule() {
    if (currentBlockType && Object.keys(currentProps).length > 0) {
      const rule: StyleRule = { blockType: currentBlockType, target: currentTarget, properties: { ...currentProps } };
      if (currentLabel) rule.label = currentLabel;
      rules.push(rule);
    }
    currentProps = {};
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || COMMENT_RE.test(trimmed)) continue;

    if (trimmed === '}') {
      flushRule();
      currentBlockType = null;
      currentTarget = 'self';
      currentLabel = undefined;
      continue;
    }

    if (currentBlockType) {
      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        currentProps[cssPropertyName(propMatch[1])] = stripComment(propMatch[2]);
      }
      continue;
    }

    const ruleMatch = trimmed.match(RULE_OPEN_RE);
    if (ruleMatch) {
      const selector = ruleMatch[1];
      const { blockType, target, label } = decomposeSelector(selector);
      currentBlockType = blockType;
      currentTarget = target;
      currentLabel = label;
      continue;
    }

    const propMatch = trimmed.match(PROP_RE);
    if (propMatch) {
      variables.push({ name: propMatch[1], value: stripComment(propMatch[2]) });
    }
  }

  flushRule();
  return { variables, rules };
}

/** Sass/LESS functions that AI commonly generates but are not valid CSS. */
const SASS_FN_RE = /\b(darken|lighten|saturate|desaturate|mix|adjust-hue|rgba)\s*\(/;

/** Block names that look like HTML elements — not valid mkly block selectors. */
const HTML_ELEMENT_NAMES = new Set([
  'body', 'div', 'span', 'main', 'section', 'article', 'aside', 'nav',
  'header', 'footer', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'form', 'input', 'button', 'label',
]);

function validateValue(value: string, warnings: StyleWarning[]): void {
  const sassMatch = value.match(SASS_FN_RE);
  if (sassMatch) {
    warnings.push({
      message: `"${sassMatch[1]}()" is a Sass function, not valid CSS — value will be ignored by browsers`,
      severity: 'warning',
    });
  }
}

function parseIndentedToGraph(source: string): StyleGraph {
  const lines = source.split('\n');
  const variables: StyleVariable[] = [];
  const rules: StyleRule[] = [];
  const warnings: StyleWarning[] = [];

  let currentBlock: string | null = null;
  let currentTarget = 'self';
  let currentLabel: string | undefined;
  let currentProps: Record<string, string> = {};
  let isRawContext = false;
  let blockBaseIndent = -1;
  let targetFromSubElement = false;

  function flushRule() {
    if (currentBlock && Object.keys(currentProps).length > 0) {
      const rule: StyleRule = { blockType: currentBlock, target: currentTarget, properties: { ...currentProps } };
      if (currentLabel) rule.label = currentLabel;
      rules.push(rule);
    }
    currentProps = {};
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || COMMENT_RE.test(trimmed)) continue;

    const indent = getIndent(line);

    // Indent 0: top-level — selector, variable, or raw CSS selector
    if (indent === 0) {
      flushRule();
      currentTarget = 'self';
      isRawContext = false;
      blockBaseIndent = -1;
      targetFromSubElement = false;

      // Variable declaration: "key: value" (must have space after colon to
      // distinguish from pseudo selectors like "card:hover")
      const varMatch = trimmed.match(/^([\w-]+)\s*:\s+(.+)$/);
      if (varMatch) {
        const val = stripComment(varMatch[2]);
        validateValue(val, warnings);
        variables.push({ name: varMatch[1], value: val });
        currentBlock = null;
        currentLabel = undefined;
        continue;
      }

      // Check for label selector: "core/card:hero" (requires kit/)
      const labelMatch = trimmed.match(LABEL_SELECTOR_RE);
      if (labelMatch) {
        currentBlock = labelMatch[1];
        currentLabel = labelMatch[2];
        currentTarget = 'self';
        continue;
      }

      // Simple block selector: "heading", "core/heading"
      if (SELECTOR_RE.test(trimmed)) {
        if (HTML_ELEMENT_NAMES.has(trimmed)) {
          warnings.push({
            message: `"${trimmed}" looks like an HTML element, not a mkly block — use document-level variables for page styles (e.g. "bg: #fff" at indent 0)`,
            severity: 'warning',
          });
        }
        currentBlock = trimmed;
        currentLabel = undefined;
        currentTarget = 'self';
        continue;
      }

      // Compound block selector at indent 0 (e.g. card:hover, core/card.img)
      // Only for word-starting selectors (not raw CSS like .class or #id)
      if (/^\w/.test(trimmed)) {
        const { blockType, target, label } = decomposeSelector(trimmed);
        if (blockType) {
          currentBlock = blockType;
          currentTarget = target;
          currentLabel = label;
          continue;
        }
      }

      // Raw CSS selector (anything else: .my-class, #my-id, [attr], * etc.)
      currentBlock = '__raw';
      currentTarget = trimmed;
      currentLabel = undefined;
      isRawContext = true;
      continue;
    }

    // Indent 1+: inside a block or raw selector
    if (!currentBlock) {
      // Indented variable (rare but supported)
      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        variables.push({ name: propMatch[1], value: stripComment(propMatch[2]) });
      }
      continue;
    }

    // In raw context: only collect properties (no sub-element/pseudo parsing)
    if (isRawContext) {
      const propMatch = trimmed.match(PROP_RE);
      if (propMatch) {
        currentProps[cssPropertyName(propMatch[1])] = stripComment(propMatch[2]);
      }
      continue;
    }

    // Track the base indent for content under a block selector.
    // Properties at this indent belong to 'self', deeper ones to sub-elements.
    if (blockBaseIndent === -1) {
      blockBaseIndent = indent;
    }

    // Tag descendant + pseudo: >p:hover, >a:visited
    const tagPseudoMatch = trimmed.match(TAG_PSEUDO_RE);
    if (tagPseudoMatch) {
      flushRule();
      currentTarget = `>${tagPseudoMatch[1]}${tagPseudoMatch[2]}`;
      targetFromSubElement = true;
      continue;
    }

    // Tag descendant: >p, >h1
    const tagMatch = trimmed.match(TAG_TARGET_RE);
    if (tagMatch) {
      flushRule();
      currentTarget = `>${tagMatch[1]}`;
      targetFromSubElement = true;
      continue;
    }

    // Combined sub-element + pseudo: .img:hover, .img::before
    const subPseudoMatch = trimmed.match(SUB_PSEUDO_RE);
    if (subPseudoMatch) {
      flushRule();
      currentTarget = `${subPseudoMatch[1]}${subPseudoMatch[2]}`;
      targetFromSubElement = true;
      continue;
    }

    // Sub-element: .img
    const subMatch = trimmed.match(SUB_ELEMENT_RE);
    if (subMatch) {
      flushRule();
      currentTarget = subMatch[1] === 'self' ? 'self' : subMatch[1];
      targetFromSubElement = true;
      continue;
    }

    // Pseudo: :hover, ::before
    const pseudoMatch = trimmed.match(PSEUDO_RE);
    if (pseudoMatch) {
      flushRule();
      currentTarget = `self${pseudoMatch[1]}`;
      targetFromSubElement = true;
      continue;
    }

    // Property at the block's base indent resets target to 'self'
    // (e.g. `padding: 24px` after `.source` properties).
    // Only resets when the target was set by a sub-element/pseudo inside
    // the block — NOT when the target was set at indent 0 (e.g. card:hover).
    if (indent <= blockBaseIndent && currentTarget !== 'self' && targetFromSubElement) {
      flushRule();
      currentTarget = 'self';
      targetFromSubElement = false;
    }

    // Property inside a rule
    const propMatch = trimmed.match(PROP_RE);
    if (propMatch) {
      const val = stripComment(propMatch[2]);
      validateValue(val, warnings);
      currentProps[cssPropertyName(propMatch[1])] = val;
    }
  }

  flushRule();
  return { variables, rules, warnings: warnings.length > 0 ? warnings : undefined };
}

/** Decompose a compound selector like "card.img", "card:hover", or "card:hero" (label) */
function decomposeSelector(selector: string): { blockType: string; target: string; label?: string } {
  const dotIdx = selector.indexOf('.');
  const colonIdx = selector.indexOf(':');

  if (dotIdx !== -1) {
    const block = selector.slice(0, dotIdx);
    const sub = selector.slice(dotIdx + 1);
    // Check if block part has a label: "core/card:hero.img"
    const labelMatch = block.match(LABEL_SELECTOR_RE);
    if (labelMatch) {
      return { blockType: labelMatch[1], target: sub === 'self' ? 'self' : sub, label: labelMatch[2] };
    }
    return { blockType: block, target: sub === 'self' ? 'self' : sub };
  }

  if (colonIdx !== -1) {
    const block = selector.slice(0, colonIdx);
    const rest = selector.slice(colonIdx + 1);
    // Distinguish label (word chars only, no leading ':' pattern like :hover)
    // At indent 0, "core/card:hero" is a label; ":hover" at indent 1+ is pseudo
    // When called from indent 0 parsing, single-word after colon = label
    if (/^\w+$/.test(rest) && block.includes('/')) {
      return { blockType: block, target: 'self', label: rest };
    }
    // Pseudo-class like ":hover"
    return { blockType: block, target: `self${selector.slice(colonIdx)}` };
  }

  return { blockType: selector, target: 'self' };
}

// ---------------------------------------------------------------------------
// Serialization: StyleGraph → mkly v2 indented syntax
// ---------------------------------------------------------------------------

/**
 * Serialize a StyleGraph to mkly v2 indented style syntax.
 * Output is suitable for placing inside a --- style block.
 */
export function serializeStyleGraph(graph: StyleGraph): string {
  const lines: string[] = [];

  // Variables first
  for (const v of graph.variables) {
    lines.push(`${v.name}: ${v.value}`);
  }

  // Separate raw rules from block rules
  const rawRules = graph.rules.filter(r => r.blockType === '__raw');
  const blockRulesAll = graph.rules.filter(r => r.blockType !== '__raw');

  // Group block rules by blockType + label
  const grouped = new Map<string, StyleRule[]>();
  for (const rule of blockRulesAll) {
    const key = rule.label ? `${rule.blockType}:${rule.label}` : rule.blockType;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(rule);
    } else {
      grouped.set(key, [rule]);
    }
  }

  for (const [selectorKey, blockRules] of grouped) {
    if (lines.length > 0) lines.push('');

    // Find the "self" rule (block root properties)
    const selfRule = blockRules.find(r => r.target === 'self');
    const otherRules = blockRules.filter(r => r.target !== 'self');

    lines.push(selectorKey);

    if (selfRule) {
      for (const [prop, value] of Object.entries(selfRule.properties)) {
        lines.push(`  ${prop}: ${value}`);
      }
    }

    for (const rule of otherRules) {
      const { sub, pseudo, isTag } = parseTarget(rule.target);
      if (pseudo && !sub) {
        // Pseudo on self: :hover
        lines.push(`  ${pseudo}`);
      } else if (isTag && sub && !pseudo) {
        // Tag descendant: >p
        lines.push(`  >${sub}`);
      } else if (isTag && sub && pseudo) {
        // Tag descendant with pseudo: >p:hover
        lines.push(`  >${sub}${pseudo}`);
      } else if (sub && !pseudo) {
        // BEM sub-element: .img
        lines.push(`  .${sub}`);
      } else if (sub && pseudo) {
        // BEM sub-element with pseudo: .img:hover
        lines.push(`  .${sub}${pseudo}`);
      }

      for (const [prop, value] of Object.entries(rule.properties)) {
        lines.push(`    ${prop}: ${value}`);
      }
    }
  }

  // Raw CSS rules (blockType === '__raw', target is the CSS selector)
  for (const rule of rawRules) {
    if (lines.length > 0) lines.push('');
    lines.push(rule.target);
    for (const [prop, value] of Object.entries(rule.properties)) {
      lines.push(`  ${prop}: ${value}`);
    }
  }

  return lines.join('\n');
}

/** Parse a target like "self:hover", "img", "img:hover", ">p", ">p:hover" into parts */
function parseTarget(target: string): { sub: string | null; pseudo: string | null; isTag?: boolean } {
  if (target === 'self') return { sub: null, pseudo: null };

  if (target.startsWith('self:')) {
    return { sub: null, pseudo: target.slice(4) };
  }

  // Tag descendant target: ">p", ">p:hover"
  if (target.startsWith('>')) {
    const tag = target.slice(1);
    const colonIdx = tag.indexOf(':');
    if (colonIdx !== -1) {
      return { sub: tag.slice(0, colonIdx), pseudo: tag.slice(colonIdx), isTag: true };
    }
    return { sub: tag, pseudo: null, isTag: true };
  }

  const colonIdx = target.indexOf(':');
  if (colonIdx !== -1) {
    return { sub: target.slice(0, colonIdx), pseudo: target.slice(colonIdx) };
  }

  return { sub: target, pseudo: null };
}

// ---------------------------------------------------------------------------
// Compilation: StyleGraph → CSS
// ---------------------------------------------------------------------------

/**
 * Compile a StyleGraph to CSS for the user layer.
 * Uses proper CSS selectors based on block type classes.
 */
export function compileStyleGraphToCSS(graph: StyleGraph): string {
  const cssLines: string[] = [];

  // Variables → .mkly-document { --mkly-*: value }
  if (graph.variables.length > 0) {
    const varLines: string[] = [];
    for (const v of graph.variables) {
      if (v.name in VARIABLE_TO_CSS) {
        varLines.push(`  ${VARIABLE_TO_CSS[v.name]}: ${v.value};`);
      } else {
        varLines.push(`  ${cssProperty(v.name)}: ${resolveValue(v.value)};`);
      }
    }
    cssLines.push(`.mkly-document {\n${varLines.join('\n')}\n}`);
  }

  // Rules → CSS selectors
  for (const rule of graph.rules) {
    // Raw CSS rules: use target as selector directly
    if (rule.blockType === '__raw') {
      const props = Object.entries(rule.properties)
        .map(([k, v]) => `  ${cssProperty(k)}: ${resolveValue(v)};`)
        .join('\n');
      if (props) {
        cssLines.push(`${rule.target} {\n${props}\n}`);
      }
      continue;
    }

    const selector = resolveSelector(rule.target, rule.blockType, rule.label);
    const isSubElement = rule.target !== 'self' && !rule.target.startsWith('self:');
    const isTagTarget = rule.target.startsWith('>');

    const props = Object.entries(rule.properties)
      .map(([k, v]) => `  ${cssProperty(k)}: ${resolveValue(v)};`)
      .join('\n');
    if (props) {
      cssLines.push(`${selector} {\n${props}\n}`);

      // For BEM sub-element targets: propagate inherited properties to child text
      // elements so they override theme rawCss rules like `.mkly-document p`.
      // Skip for tag targets — they already target specific tags directly.
      if (isSubElement && !isTagTarget) {
        const inheritedProps = Object.entries(rule.properties)
          .filter(([k]) => INHERITED_CSS_PROPS.has(cssProperty(k)))
          .map(([k, v]) => `  ${cssProperty(k)}: ${resolveValue(v)};`)
          .join('\n');
        if (inheritedProps) {
          cssLines.push(`${selector} :is(p, li, h1, h2, h3, h4, h5, h6, blockquote) {\n${inheritedProps}\n}`);
        }
      }
    }
  }

  return cssLines.join('\n\n');
}

// ---------------------------------------------------------------------------
// Immutable mutations
// ---------------------------------------------------------------------------

/**
 * Merge (add or update) a style property in the graph. Returns a new graph.
 */
export function mergeRule(
  graph: StyleGraph,
  blockType: string,
  target: string,
  prop: string,
  value: string,
  label?: string,
): StyleGraph {
  const rules = [...graph.rules];
  const idx = rules.findIndex(r =>
    r.blockType === blockType && r.target === target && (r.label ?? undefined) === label,
  );

  if (idx !== -1) {
    rules[idx] = {
      ...rules[idx],
      properties: { ...rules[idx].properties, [prop]: value },
    };
  } else {
    const rule: StyleRule = { blockType, target, properties: { [prop]: value } };
    if (label) rule.label = label;
    rules.push(rule);
  }

  return { variables: graph.variables, rules };
}

/**
 * Remove a style property from the graph. Returns a new graph.
 * Removes the entire rule if no properties remain.
 */
export function removeRule(
  graph: StyleGraph,
  blockType: string,
  target: string,
  prop: string,
  label?: string,
): StyleGraph {
  const rules = graph.rules.map(r => {
    if (r.blockType === blockType && r.target === target && (r.label ?? undefined) === label) {
      const { [prop]: _, ...rest } = r.properties;
      return { ...r, properties: rest };
    }
    return r;
  }).filter(r => Object.keys(r.properties).length > 0);

  return { variables: graph.variables, rules };
}

/**
 * Get the value of a style property from the graph.
 */
export function getStyleValue(
  graph: StyleGraph,
  blockType: string,
  target: string,
  prop: string,
  label?: string,
): string | undefined {
  const rule = graph.rules.find(r =>
    r.blockType === blockType && r.target === target && (r.label ?? undefined) === label,
  );
  return rule?.properties[prop];
}

/**
 * Merge multiple StyleGraphs. Later graphs override earlier ones.
 */
export function mergeStyleGraphs(...graphs: StyleGraph[]): StyleGraph {
  const variables: StyleVariable[] = [];
  const seenVars = new Map<string, number>();
  const rules: StyleRule[] = [];

  for (const graph of graphs) {
    for (const v of graph.variables) {
      const existingIdx = seenVars.get(v.name);
      if (existingIdx !== undefined) {
        variables[existingIdx] = v;
      } else {
        seenVars.set(v.name, variables.length);
        variables.push(v);
      }
    }

    for (const rule of graph.rules) {
      const existingIdx = rules.findIndex(
        r => r.blockType === rule.blockType && r.target === rule.target && (r.label ?? undefined) === (rule.label ?? undefined),
      );
      if (existingIdx !== -1) {
        rules[existingIdx] = {
          ...rules[existingIdx],
          properties: { ...rules[existingIdx].properties, ...rule.properties },
        };
      } else {
        rules.push({ ...rule });
      }
    }
  }

  return { variables, rules };
}

// ---------------------------------------------------------------------------
// CSS @layer compilation (full document)
// ---------------------------------------------------------------------------

export interface LayeredCSSOptions {
  kitCSS?: string[];
  kitKeyframes?: Record<string, string>;
  themeCSS?: string[];
  presetCSS?: string[];
  apiThemeCSS?: string;
  blockContribCSS?: string[];
  diagnosticCSS?: string;
}

/**
 * Compile a full document's CSS using @layer for explicit cascade ordering.
 *
 * Layer order (lowest → highest priority):
 *   kit → theme → preset → user
 */
export function compileLayeredCSS(
  graph: StyleGraph,
  options: LayeredCSSOptions = {},
): string {
  const parts: string[] = [];

  // Layer declaration
  parts.push('@layer kit, theme, preset, user;');

  // Kit layer
  const kitParts: string[] = [];
  if (options.diagnosticCSS) kitParts.push(options.diagnosticCSS);
  if (options.kitCSS && options.kitCSS.length > 0) kitParts.push(options.kitCSS.join('\n'));
  if (options.kitKeyframes) {
    const kfEntries = Object.entries(options.kitKeyframes);
    if (kfEntries.length > 0) {
      kitParts.push(kfEntries.map(([name, body]) => `@keyframes ${name}{${body}}`).join('\n'));
    }
  }
  if (kitParts.length > 0) {
    parts.push(`@layer kit {\n${kitParts.join('\n')}\n}`);
  }

  // Theme layer
  if (options.themeCSS && options.themeCSS.length > 0) {
    parts.push(`@layer theme {\n${options.themeCSS.join('\n')}\n}`);
  }

  // Preset layer
  const presetParts: string[] = [];
  if (options.presetCSS && options.presetCSS.length > 0) presetParts.push(...options.presetCSS);
  if (options.apiThemeCSS) presetParts.push(options.apiThemeCSS);
  if (options.blockContribCSS && options.blockContribCSS.length > 0) presetParts.push(...options.blockContribCSS);
  if (presetParts.length > 0) {
    parts.push(`@layer preset {\n${presetParts.join('\n')}\n}`);
  }

  // User layer (from StyleGraph — document --- style blocks)
  const userCSS = compileStyleGraphToCSS(graph);
  if (userCSS) {
    parts.push(`@layer user {\n${userCSS}\n}`);
  }

  return parts.join('\n\n');
}

/**
 * Create an empty StyleGraph.
 */
export function emptyStyleGraph(): StyleGraph {
  return { variables: [], rules: [] };
}

// ---------------------------------------------------------------------------
// Email-safe value resolution
// ---------------------------------------------------------------------------

/** Build reverse map: CSS custom property name → mkly variable key */
const CSS_TO_VARIABLE: Record<string, string> = {};
for (const [key, cssVar] of Object.entries(VARIABLE_TO_CSS)) {
  CSS_TO_VARIABLE[cssVar] = key;
}

/**
 * Resolve a CSS value for email output where CSS custom properties are unsupported.
 *
 * - `$varName` → looks up variables[varName]
 * - `var(--mkly-foo)` → looks up variables[mapped-key]
 * - Other values pass through as-is
 */
export function resolveForEmail(value: string, variables: Record<string, string>): string {
  let resolved = value;

  // Resolve $variable shorthand
  resolved = resolved.replace(/\$(\w+)/g, (_, name: string) => {
    return variables[name] ?? value;
  });

  // Resolve var(--mkly-*) references (handles nested var() via loop)
  let prev = '';
  while (prev !== resolved && resolved.includes('var(')) {
    prev = resolved;
    resolved = resolved.replace(/var\(([^()]+)\)/g, (match, varExpr: string) => {
      const commaIdx = varExpr.indexOf(',');
      const varName = commaIdx !== -1 ? varExpr.slice(0, commaIdx).trim() : varExpr.trim();
      const fallback = commaIdx !== -1 ? varExpr.slice(commaIdx + 1).trim() : undefined;

      // Try reverse mapping
      const mklyKey = CSS_TO_VARIABLE[varName];
      if (mklyKey && variables[mklyKey] !== undefined) return variables[mklyKey];

      // Try direct variable name (strip --mkly- prefix)
      const stripped = varName.replace(/^--mkly-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (variables[stripped] !== undefined) return variables[stripped];

      // Use CSS fallback value if present
      if (fallback !== undefined) return fallback;

      return match;
    });
  }

  return resolved;
}

/**
 * Get all resolved style properties for a block type + target from the StyleGraph,
 * with all variable references resolved to concrete values for email output.
 */
export function getEmailStyleMap(
  graph: StyleGraph,
  blockType: string,
  target: string,
  variables: Record<string, string>,
  label?: string,
): Record<string, string> {
  const rule = graph.rules.find(r =>
    r.blockType === blockType && r.target === target && (r.label ?? undefined) === label,
  );
  if (!rule) return {};

  const result: Record<string, string> = {};
  for (const [prop, val] of Object.entries(rule.properties)) {
    result[cssProperty(prop)] = resolveForEmail(val, variables);
  }
  return result;
}
