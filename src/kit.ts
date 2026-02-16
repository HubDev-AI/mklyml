import type { BlockDefinition, BlockDocs, CompileContext, MklyDocument, CompileResult, MklyTheme, MklyPreset, ThemeDocs, MetaProperty } from './types';
import type { BlockSchema } from './schemas';
import { BlockRegistry } from './registry';

export interface MklyKitVersions {
  supported: number[];
  current: number;
}

export interface ParsedBlock {
  blockType: string;
  properties: Record<string, string>;
  styleEntries?: string[];
  content: string;
  children: ParsedBlock[];
  label?: string;
  verbatim?: boolean;
}

export interface ReverseBlockHandler {
  cssClass: string;
  blockType: string;
  parse?: (html: string) => ParsedBlock;
}

export interface ImportPattern {
  name: string;
  blockType: string;
  detect: (html: string) => boolean;
  parse: (html: string) => ParsedBlock;
}

export interface MklyKit {
  name: string;
  /** Human-readable display name shown in editor UI (e.g. "Newsletter" for newsletter). */
  displayName?: string;
  description?: string;
  versions?: MklyKitVersions;
  blocks?: BlockDefinition[];
  schemas?: BlockSchema[];
  styles?: string;
  /** CSS @keyframes provided by this kit. Keys are animation names, values are keyframe bodies. */
  keyframes?: Record<string, string>;
  themes?: MklyTheme[];
  defaultTheme?: string;
  themeDocs?: Record<string, ThemeDocs>;
  presets?: MklyPreset[];
  defaultPreset?: string;
  reverse?: ReverseBlockHandler[];
  importPatterns?: ImportPattern[];
  docs?: Record<string, BlockDocs>;
  metaProperties?: MetaProperty[];
  transform?: (doc: MklyDocument) => MklyDocument;
  afterCompile?: (result: CompileResult, ctx: CompileContext) => CompileResult;
}

export function defineKit(kit: MklyKit): MklyKit {
  return kit;
}

export function defineBlock(def: BlockDefinition): BlockDefinition {
  return def;
}

export function applyKits(
  registry: BlockRegistry,
  kits: MklyKit[],
  docVersion?: number,
): {
  registry: BlockRegistry;
  styles: string[];
  keyframes: Record<string, string>;
  transforms: Array<(doc: MklyDocument) => MklyDocument>;
  afterCompile: Array<(result: CompileResult, ctx: CompileContext) => CompileResult>;
  themes: Map<string, MklyTheme>;
  defaultThemes: string[];
  presets: Map<string, MklyPreset>;
  defaultPresets: string[];
} {
  const styles: string[] = [];
  const keyframes: Record<string, string> = {};
  const transforms: Array<(doc: MklyDocument) => MklyDocument> = [];
  const afterCompile: Array<(result: CompileResult, ctx: CompileContext) => CompileResult> = [];
  const themes = new Map<string, MklyTheme>();
  const defaultThemes: string[] = [];
  const presets = new Map<string, MklyPreset>();
  const defaultPresets: string[] = [];
  const version = docVersion ?? 1;

  for (const kit of kits) {
    if (kit.blocks) {
      for (const block of kit.blocks) {
        const since = block.since ?? 1;
        if (since <= version) {
          const qualified = `${kit.name}/${block.name}`;
          registry.register({ ...block, name: qualified });
        }
      }
    }
    if (kit.styles) {
      styles.push(kit.styles);
    }
    if (kit.keyframes) {
      for (const [name, body] of Object.entries(kit.keyframes)) {
        keyframes[name] = body;
      }
    }
    if (kit.themes) {
      for (const theme of kit.themes) {
        themes.set(`${kit.name}/${theme.name}`, theme);
        if (!themes.has(theme.name)) {
          themes.set(theme.name, theme);
        }
      }
    }
    if (kit.defaultTheme) {
      defaultThemes.push(`${kit.name}/${kit.defaultTheme}`);
    }
    if (kit.presets) {
      for (const preset of kit.presets) {
        presets.set(`${kit.name}/${preset.name}`, preset);
        if (!presets.has(preset.name)) {
          presets.set(preset.name, preset);
        }
      }
    }
    if (kit.defaultPreset) {
      defaultPresets.push(`${kit.name}/${kit.defaultPreset}`);
    }
    if (kit.transform) {
      transforms.push(kit.transform);
    }
    if (kit.afterCompile) {
      afterCompile.push(kit.afterCompile);
    }
  }

  return { registry, styles, keyframes, transforms, afterCompile, themes, defaultThemes, presets, defaultPresets };
}
