export { tokenize } from './tokenizer';
export { parse } from './parser';
export type { ParseOptions } from './parser';
export { compile } from './compiler';
export type { CompileWithKitsOptions } from './compiler';
export { BlockRegistry } from './registry';
export type { RegistryOptions } from './registry';
export {
  createRegistry,
  CORE_BLOCKS,
  CORE_KIT,
} from './blocks';
export { defineKit, defineBlock, applyKits } from './kit';
export type { MklyKit, MklyKitVersions, ReverseBlockHandler, ParsedBlock, ImportPattern } from './kit';
export { definePlugin, applyPlugins } from './plugin';
export type { MklyPlugin } from './plugin';
export { escapeHtml, markdownToHtml, isSafeUrl, toKebab } from './utils';
export { safeUrl, md, clampInt, slugify } from './kit-utils';
export {
  escapeRegex,
  extractAttr,
  findTagWithClass,
  extractAttrFromTag,
  extractInnerHtml,
  extractTextContent,
  stripElementsByClass,
  extractAttrByClass,
  decodeHtmlEntities,
} from './reverse/html-parsing';
export { DEFAULT_STYLES } from './styles';
export { CORE_THEMES } from './themes';
export { CORE_PRESETS } from './presets';
export { parseMklyStyle, themeToCSS, mergeVariables, VARIABLE_TO_CSS, STYLE_VARIABLES, resolveVariableName } from './style-parser';
export type { MklyStyleResult, StyleVariable } from './style-parser';
export { requireProp, warnMissing, compileError, errorHtml, prop, safeCss, cssVal } from './errors';
export {
  parseStyleGraph,
  serializeStyleGraph,
  compileStyleGraphToCSS,
  compileLayeredCSS,
  mergeRule,
  removeRule,
  getStyleValue,
  mergeStyleGraphs,
  emptyStyleGraph,
  resolveSelector,
  cssProperty,
  resolveValue,
  resolveForEmail,
  getEmailStyleMap,
  STYLE_ALIASES,
} from './style-graph';
export type { StyleGraph, StyleRule, StyleVariable as StyleGraphVariable } from './style-graph';
export {
  DEFAULT_SELF_SECTORS,
  HOVER_SECTOR,
  TARGET_SECTORS,
  getAllStylePropertyNames,
} from './style-schema';
export type { StylePropertyType, StylePreset, StylePropertyDef, StyleSector } from './style-schema';
export { createCompletionData } from './completions';
export type { CompletionItem, CompletionData, KitInfo, PropertyType } from './completions';
export { MKLY_DEFAULT_VERSION, resolveVersion, validateVersionAgainstKit, getAvailableFeatures } from './version';
export type { VersionResult } from './version';
export {
  buildMklySystemPrompt,
  buildKitAuthoringGuide,
  buildPluginAuthoringGuide,
  buildBlockReference,
  buildBlockDocsMarkdown,
  ANTI_PATTERNS,
  EXAMPLES,
  validateMklyOutput,
  validateMkly,
  formatErrors,
  estimateTokens,
  compareWithHtml,
} from './ai/index';
export type {
  PromptOptions,
  BlockReferenceOptions,
  BlockDocsMarkdownOptions,
  AntiPattern,
  Example,
  ValidationResult,
  ValidationSuggestion,
  ValidateOptions,
  MklyValidationResult,
  FormatOptions,
  TokenComparison,
} from './ai/index';
export {
  htmlToMkly,
  detectOrigin,
  reverseWeb,
  reverseEmail,
  reverseGeneric,
  htmlToMarkdown,
  importHtml,
} from './reverse/index';
export type { HtmlOrigin, HtmlToMklyOptions, ReverseWebOptions, ImportOptions } from './reverse/index';
export {
  CORE_SCHEMAS,
  createBlockSchemas,
  validateBlock,
} from './schemas';
export type { BlockSchema, MklyBlockSchema } from './schemas';

export { stripContent, injectSampleContent } from './template-ops';
export { getBlockDisplayName, getThemeDisplayName, getPresetDisplayName, blockTypeToCssClass, cls, lineAttr } from './types';
export type {
  MklyDocument,
  MklyBlock,
  ParseError,
  CompileError,
  CompileContext,
  CompileResult,
  CompileOptions,
  MklyOptions,
  MklyTheme,
  MklyPreset,
  ThemeDocs,
  TokenizedLine,
  SourcePosition,
  SourceRange,
  SourceMapEntry,
  BlockDefinition,
  BlockContentHints,
  ContentMode,
  BlockDocs,
  PropertyDoc,
  MetaProperty,
  TargetInfo,
} from './types';

import { parse } from './parser';
import { compile } from './compiler';
import { createRegistry } from './blocks';
import type { MklyOptions, CompileResult } from './types';
import type { MklyKit } from './kit';
import type { MklyPlugin } from './plugin';

export function mkly(
  source: string,
  options?: MklyOptions & { kits?: Record<string, MklyKit>; plugins?: MklyPlugin[]; theme?: Record<string, string> },
): CompileResult {
  // Extract verbatim block types from all available kits (using qualified names)
  const verbatimBlocks = new Set<string>();
  if (options?.kits) {
    for (const kit of Object.values(options.kits)) {
      if (kit.blocks) {
        for (const block of kit.blocks) {
          if (block.contentMode === 'verbatim') {
            verbatimBlocks.add(`${kit.name}/${block.name}`);
          }
        }
      }
    }
  }

  const doc = parse(source, {
    ...(verbatimBlocks.size > 0 ? { verbatimBlocks } : {}),
    ...(options?.sourceMap ? { sourceMap: true } : {}),
  });
  const registry = createRegistry(...(options?.presets ?? []));
  return compile(doc, registry, {
    ...options,
    kits: options?.kits,
    plugins: options?.plugins,
    theme: options?.theme,
  });
}
