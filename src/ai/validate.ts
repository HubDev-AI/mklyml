import type { MklyDocument, MklyBlock, ParseError, CompileError } from '../types';
import type { MklyKit } from '../kit';
import type { BlockSchema } from '../schemas';
import { parse } from '../parser';
import { compile } from '../compiler';
import { createRegistry, CORE_KIT } from '../blocks';
import { validateBlock, createBlockSchemas } from '../schemas';
import { formatErrors } from './format';
import type { FormatOptions } from './format';
import { parseStyleGraph, serializeStyleGraph } from '../style-graph';
import type { StyleRule } from '../style-graph';

export interface ValidationSuggestion {
  line: number;
  message: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<ParseError | CompileError>;
  suggestions: ValidationSuggestion[];
  document?: MklyDocument;
}

export interface ValidateOptions {
  kits?: Record<string, MklyKit>;
  schemas?: BlockSchema[];
  extraSchemas?: BlockSchema[];
}

export interface MklyValidationResult {
  valid: boolean;
  errors: Array<ParseError | CompileError>;
  feedback: string;
  document?: MklyDocument;
}

function getSchemaMap(options?: ValidateOptions): Map<string, BlockSchema> {
  if (options?.schemas) {
    return createBlockSchemas(options.schemas);
  }
  const extras: BlockSchema[][] = [];
  if (options?.kits) {
    for (const kit of Object.values(options.kits)) {
      if (kit.schemas) {
        extras.push(kit.schemas);
      }
    }
  }
  if (options?.extraSchemas) {
    extras.push(options.extraSchemas);
  }
  return createBlockSchemas(...extras);
}

function generateSuggestion(error: ParseError | CompileError): ValidationSuggestion | null {
  const line = error.line;
  const msg = error.message;

  if (msg.includes('requires') && msg.includes('"')) {
    const propMatch = msg.match(/"(\w+)"/);
    if (propMatch) {
      return {
        line,
        message: `Missing required property "${propMatch[1]}"`,
        fix: `Add: ${propMatch[1]}: <value>`,
      };
    }
  }

  if ('property' in error && (error as CompileError).property) {
    if (msg.includes('expected') && msg.includes('received undefined')) {
      const prop = (error as CompileError).property;
      return {
        line,
        message: `Missing required property "${prop}"`,
        fix: `Add: ${prop}: <value>`,
      };
    }
  }

  if (msg.includes('Unknown block type')) {
    const typeMatch = msg.match(/Unknown block type[:" ]+([^\s"]+)/);
    if (typeMatch) {
      return {
        line,
        message: `Unknown block type "${typeMatch[1]}"`,
        fix: `Use a valid block type. Check available blocks with the schema.`,
      };
    }
  }

  if (msg.includes('Unknown kit')) {
    const kitMatch = msg.match(/Unknown kit "([^"]+)"/);
    if (kitMatch) {
      return {
        line,
        message: `Kit "${kitMatch[1]}" is not available`,
        fix: `Ensure the kit is registered. Available kits are passed via the kits option.`,
      };
    }
  }

  if (msg.includes('Unsupported version')) {
    return { line, message: msg, fix: `Use version: 1 (currently the only supported version).` };
  }

  if (msg.includes('Invalid version')) {
    return { line, message: msg, fix: `Version must be a number. Use: version: 1` };
  }

  if (msg.includes('no matching opening block')) {
    return { line, message: msg, fix: `Remove the closing tag or add a matching opening block above.` };
  }

  if (msg.includes('Duplicate property')) {
    const propMatch = msg.match(/"(\w+)"/);
    if (propMatch) {
      return {
        line,
        message: `Duplicate property "${propMatch[1]}"`,
        fix: `Remove the duplicate "${propMatch[1]}" line — only the last value is kept.`,
      };
    }
  }

  if (msg.includes('must appear before')) {
    return {
      line,
      message: msg,
      fix: `Move this directive earlier in the document. ${msg}`,
    };
  }

  if (msg.includes('does not support body content')) {
    return {
      line,
      message: msg,
      fix: `Remove the text content below properties, or move it to a block that supports content (e.g. core/text).`,
    };
  }

  if (msg.includes('cannot start with @')) {
    return {
      line,
      message: msg,
      fix: `Remove the @ prefix. Use a --- style block for visual styling.`,
    };
  }

  if (msg.includes('content mode mismatch')) {
    return {
      line,
      message: msg,
      fix: msg.includes('properties') && msg.includes('text')
        ? 'Remove the text content or use a block type that supports body content.'
        : 'Move content to the appropriate section for this block type.',
    };
  }

  return null;
}

/**
 * Run full parse + compile pipeline and return all errors/warnings.
 * This catches everything the core language generates — no manual reimplementation.
 */
export function validateMklyOutput(source: string, options?: ValidateOptions): ValidationResult {
  const doc = parse(source);

  // Run full compilation to catch ALL errors (parser + compiler + registry).
  // compile() handles kit resolution, block registration, theme/preset validation,
  // and all compile-time checks — no need to reimplement any of it.
  // Core kit is always included — callers provide additional kits.
  const registry = createRegistry();
  const kits = { core: CORE_KIT, ...options?.kits };
  const compileResult = compile(doc, registry, { kits });
  const allErrors: Array<ParseError | CompileError> = [...compileResult.errors];

  // Schema validation (structural checks beyond what compile catches)
  const schemaMap = getSchemaMap(options);
  function walkBlocks(blocks: MklyBlock[], fn: (b: MklyBlock) => void): void {
    for (const block of blocks) {
      fn(block);
      if (block.children.length > 0) walkBlocks(block.children, fn);
    }
  }
  walkBlocks(doc.blocks, (block) => {
    allErrors.push(...validateBlock(block, schemaMap));
  });

  // Generate suggestions for each error
  const suggestions: ValidationSuggestion[] = [];
  for (const error of allErrors) {
    const suggestion = generateSuggestion(error);
    if (suggestion) suggestions.push(suggestion);
  }

  return {
    valid: allErrors.filter(e => e.severity === 'error').length === 0,
    errors: allErrors,
    suggestions,
    document: doc,
  };
}

export function validateMkly(
  source: string,
  options?: ValidateOptions & FormatOptions,
): MklyValidationResult {
  const result = validateMklyOutput(source, options);
  // Always include feedback when there are any issues (errors OR warnings)
  // so the AI can fix warnings like duplicate properties or unused content.
  const hasIssues = result.errors.length > 0;
  const feedback = hasIssues
    ? formatErrors(result, source, options)
    : '';

  return {
    valid: result.valid,
    errors: result.errors,
    feedback,
    document: result.document,
  };
}

// ---------------------------------------------------------------------------
// Style block cleanup — strip AI slop that the parser can detect but not fix
// ---------------------------------------------------------------------------

const HTML_ELEMENTS = new Set([
  'body', 'div', 'span', 'main', 'section', 'article', 'aside', 'nav',
  'header', 'footer', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'form', 'input', 'button', 'label',
]);

const SASS_FN_RE = /\b(darken|lighten|saturate|desaturate|mix|adjust-hue)\s*\(/;

function isCleanRule(rule: StyleRule): boolean {
  if (HTML_ELEMENTS.has(rule.blockType)) return false;
  return true;
}

function cleanProperties(props: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!SASS_FN_RE.test(v)) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

/**
 * Clean AI-generated style slop from a mkly source string.
 * Strips: HTML element selectors, Sass functions, empty rules.
 * Returns the source with a cleaned --- style block.
 */
export function cleanStyleSlop(mklySource: string): string {
  const styleBlockRe = /^(--- style\s*\n)([\s\S]*?)(?=\n---|\s*$)/m;
  const match = mklySource.match(styleBlockRe);
  if (!match) return mklySource;

  const styleContent = match[2];
  const graph = parseStyleGraph(styleContent);

  const cleanedRules = graph.rules
    .filter(isCleanRule)
    .map(rule => ({
      ...rule,
      properties: cleanProperties(rule.properties),
    }))
    .filter(rule => Object.keys(rule.properties).length > 0);

  const cleanedVariables = graph.variables.filter(v => !SASS_FN_RE.test(v.value));

  const cleanedGraph = { variables: cleanedVariables, rules: cleanedRules };
  const serialized = serializeStyleGraph(cleanedGraph);

  return mklySource.replace(styleBlockRe, `--- style\n${serialized}`);
}
