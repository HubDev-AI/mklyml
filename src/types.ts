import type { StyleGraph } from './style-graph';

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

// Tokenizer output — classified lines
export type TokenizedLine =
  | { type: 'block_start'; blockType: string; label?: string; line: number }
  | { type: 'block_end'; blockType: string; line: number }
  | { type: 'property'; key: string; value: string; raw: string; line: number }
  | { type: 'text'; content: string; line: number }
  | { type: 'blank'; line: number }
  | { type: 'comment'; content: string; line: number };

// Themes
export interface MklyTheme {
  name: string;
  /** Human-readable display name shown in editor UI (e.g. "Warm Night" for dark). */
  displayName?: string;
  description?: string;
  variables?: Record<string, string>;
  /** Raw CSS injected as-is (for real CSS selectors that parseMklyStyle can't handle). */
  rawCss?: string;
  /** mkly indented-syntax CSS parsed through parseMklyStyle. */
  css?: string;
}

// Presets — structural visual treatments that compose with themes
export interface MklyPreset {
  name: string;
  /** Human-readable display name shown in editor UI (e.g. "Frosted Glass" for glass). */
  displayName?: string;
  description?: string;
  /** Suggested default theme to pair with this preset */
  defaultTheme?: string;
  /** mkly-syntax CSS for structural block styles (same format as MklyTheme.css) */
  css: string;
  /** Raw CSS injected as-is (for complex selectors that can't be expressed in mkly syntax) */
  rawCss?: string;
  /** Additional @keyframes animations this preset needs */
  keyframes?: Record<string, string>;
}

export interface ThemeDocs {
  /** Human-readable display name shown in editor UI. */
  displayName?: string;
  summary: string;
  preview?: string;
}

// Preserved comment (for round-trip fidelity)
export interface MklyComment {
  content: string;
  line: number;
}

// AST
export interface MklyDocument {
  version: number;
  blocks: MklyBlock[];
  meta: Record<string, string>;
  styles: string[];
  uses: string[];
  themes: string[];
  presets: string[];
  /** Inline theme definitions from --- define-theme blocks */
  inlineThemes: MklyTheme[];
  /** Inline preset definitions from --- define-preset blocks */
  inlinePresets: MklyPreset[];
  comments: MklyComment[];
  errors: ParseError[];
}

export interface MklyBlock {
  blockType: string;
  properties: Record<string, string>;
  content: string;
  children: MklyBlock[];
  position: SourceRange;
  label?: string;
  contentLineMap?: number[];
  propertyLines?: Record<string, number>;
}

export interface ParseError {
  message: string;
  line: number;
  severity: 'error' | 'warning';
  range?: SourceRange;
}

// Compile-time errors produced by block validation
export interface CompileError {
  message: string;
  blockType: string;
  line: number;
  property?: string;
  severity: 'error' | 'warning';
  range?: SourceRange;
}

export interface SourceMapEntry {
  sourceLine: number;
  sourceEndLine: number;
  blockType: string;
  htmlOffset: number;
  htmlLength: number;
  children: SourceMapEntry[];
}

// Context passed to every block compile function
export interface CompileContext {
  variables: Record<string, string>;
  errors: CompileError[];
  /** Blocks can push CSS here to be included in the document-level `<style>` tag (deduplicated). */
  extraStyles: Set<string>;
  /** StyleGraph from --- style blocks, available for plugins (e.g. email inlining). */
  styleGraph?: StyleGraph;
}

// Block registry
export type ContentMode = 'properties' | 'text' | 'mixed' | 'verbatim';

export interface TargetInfo {
  label: string;
  description?: string;
}

export interface BlockContentHints {
  /** Properties that are editorial content (stripped from templates). */
  contentProps?: string[];
  /** Whether the text body (block.content) is editorial content. */
  contentBody?: boolean;
  /** Whether all children contain editorial content (e.g., category's items). */
  contentChildren?: boolean;
}

export interface BlockDefinition {
  name: string;
  /** Human-readable display name for editor UI. Falls back to BlockDocs.displayName or auto Title Case. */
  displayName?: string;
  contentMode: ContentMode;
  isContainer?: boolean;
  since?: number;
  targets?: Record<string, TargetInfo>;
  /**
   * Hints for which CSS properties are meaningful for this block in the style editor.
   * Keys are target names ('self', 'self:hover', or sub-element names like 'img').
   * Values are arrays of CSS property names (kebab-case).
   * If omitted, all default properties are shown.
   */
  styleHints?: Record<string, string[]>;
  /** Hints for separating editorial content from structural layout in templates. */
  contentHints?: BlockContentHints;
  compile: (block: MklyBlock, ctx: CompileContext) => string;
}

// Compiler options
export interface CompileOptions {
  variables?: Record<string, string>;
  maxWidth?: number;
  sourceMap?: boolean;
}

// Convenience function options
export interface MklyOptions extends CompileOptions {
  presets?: BlockDefinition[][];
}

// Compiler output
export interface CompileResult {
  html: string;
  errors: Array<ParseError | CompileError>;
  sourceMap?: SourceMapEntry[];
  styleGraph?: StyleGraph;
}

export interface BlockDocs {
  /** Human-readable display name shown in editor UI (e.g. "Tip of the Day" for tipOfTheDay). */
  displayName: string;
  summary: string;
  usage: string;
  htmlPreview: string;
  properties?: PropertyDoc[];
  tips?: string[];
  /** Hex color for UI display (icon tint, syntax highlight). Falls back to kit default. */
  color?: string;
  /** Icon identifier for editor UIs. Maps to an icon registry in the editor. */
  icon?: string;
}

export interface PropertyDoc {
  name: string;
  description: string;
  required?: boolean;
  example?: string;
}

export interface MetaProperty {
  name: string;
  description: string;
  required?: boolean;
  example?: string;
}

/**
 * Returns a human-readable display name for a block type.
 * Uses docs.displayName if available, otherwise converts camelCase to Title Case.
 */
export function getBlockDisplayName(blockType: string, docs?: BlockDocs): string {
  if (docs?.displayName) return docs.displayName;
  const shortName = blockType.includes('/') ? blockType.split('/')[1]! : blockType;
  return shortName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Returns a human-readable display name for a theme.
 * Uses theme.displayName if available, otherwise converts name to Title Case.
 */
export function getThemeDisplayName(theme: MklyTheme): string {
  if (theme.displayName) return theme.displayName;
  return theme.name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Returns a human-readable display name for a preset.
 * Uses preset.displayName if available, otherwise converts name to Title Case.
 */
export function getPresetDisplayName(preset: MklyPreset): string {
  if (preset.displayName) return preset.displayName;
  return preset.name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

export function blockTypeToCssClass(blockType: string): string {
  return `mkly-${blockType.replace('/', '-')}`;
}

export function cls(block: MklyBlock, suffix?: string): string {
  const base = blockTypeToCssClass(block.blockType) + (suffix ?? '');
  if (block.label && !suffix) {
    return `${base} ${blockTypeToCssClass(block.blockType)}--${block.label}`;
  }
  return base;
}

export function lineAttr(block: MklyBlock, ...propNames: string[]): string {
  if (!block.propertyLines) return '';
  for (const name of propNames) {
    const line = block.propertyLines[name];
    if (line !== undefined) return ` data-mkly-line="${line}"`;
  }
  return '';
}
