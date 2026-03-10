import type { BlockDocs, MetaProperty, TargetInfo } from './types';
import type { BlockSchema } from './schemas';
import type { MklyKit } from './kit';
import { STYLE_VARIABLES } from './style-parser';
import type { StyleVariable } from './style-parser';
import { getAllStylePropertyNames } from './style-schema';

export type PropertyType = 'text' | 'url' | 'number' | 'boolean' | 'select';

export interface CompletionItem {
  label: string;
  description: string;
  type: 'block' | 'property' | 'kit' | 'variable';
  propType?: PropertyType;
  options?: string[];
  optional?: boolean;
}

export interface KitInfo {
  name: string;
  displayName: string;
  description: string;
  blockNames: string[];
  themeNames: string[];
  presetNames: string[];
  defaultPreset?: string;
}

export type { MetaProperty } from './types';

export interface CompletionData {
  blocks: CompletionItem[];
  properties: Map<string, CompletionItem[]>;
  kits: CompletionItem[];
  themes: CompletionItem[];
  presets: CompletionItem[];
  variables: CompletionItem[];
  docs: Map<string, BlockDocs>;
  blockKits: Map<string, string>;
  kitInfo: Map<string, KitInfo>;
  metaProperties: MetaProperty[];
  targets: Map<string, Record<string, TargetInfo>>;
  styleHints: Map<string, Record<string, string[]>>;
  styleProperties: CompletionItem[];
  contentModes: Map<string, string>;
}

function unwrapZodType(zodType: unknown): unknown {
  if (!zodType || typeof zodType !== 'object') return zodType;
  const z = zodType as Record<string, unknown>;
  if (z._def && typeof z._def === 'object') {
    const def = z._def as Record<string, unknown>;
    if (def.innerType) return unwrapZodType(def.innerType);
  }
  return zodType;
}

function zodDefType(zodType: unknown): string | undefined {
  if (!zodType || typeof zodType !== 'object') return undefined;
  const def = (zodType as Record<string, unknown>)._def as Record<string, unknown> | undefined;
  if (!def) return undefined;
  // Zod v4: _def.type; Zod v3: _def.typeName
  return (def.type as string) ?? (def.typeName as string);
}

function isOptionalType(zodType: unknown): boolean {
  const t = zodDefType(zodType);
  if (t === 'optional' || t === 'nullable' || t === 'ZodOptional' || t === 'ZodNullable') return true;
  if (!zodType || typeof zodType !== 'object') return false;
  const def = (zodType as Record<string, unknown>)._def as Record<string, unknown> | undefined;
  if (def?.innerType) return isOptionalType(def.innerType);
  return false;
}

function getDefField(zodType: unknown): Record<string, unknown> | undefined {
  if (!zodType || typeof zodType !== 'object') return undefined;
  const def = (zodType as Record<string, unknown>)._def;
  if (def && typeof def === 'object') return def as Record<string, unknown>;
  return undefined;
}

function extractEnumOptions(zodType: unknown): string[] | undefined {
  // Zod v4: .options array on the ZodEnum object itself
  if (zodType && typeof zodType === 'object' && 'options' in zodType) {
    const opts = (zodType as Record<string, unknown>).options;
    if (Array.isArray(opts) && opts.every((v) => typeof v === 'string')) return opts as string[];
  }
  // Zod v4: _def.entries object
  const def = getDefField(zodType);
  if (def?.entries && typeof def.entries === 'object') {
    return Object.values(def.entries as Record<string, string>);
  }
  // Zod v3: _def.values array
  if (def && Array.isArray(def.values)) return def.values as string[];
  return undefined;
}

function hasUrlCheck(def: Record<string, unknown>): boolean {
  if (!Array.isArray(def.checks)) return false;
  return (def.checks as Array<Record<string, unknown>>).some(
    (c) => c.format === 'url' || c.kind === 'url',
  );
}

function detectPropertyType(zodType: unknown): { propType: PropertyType; options?: string[]; optional: boolean } {
  const optional = isOptionalType(zodType);
  const inner = unwrapZodType(zodType);
  const def = getDefField(inner);
  const t = zodDefType(inner);

  if (!def) return { propType: 'text', optional };

  // Enum — boolean toggle or select dropdown
  const enumOpts = extractEnumOptions(inner);
  if (enumOpts) {
    if (enumOpts.length === 2 && enumOpts.includes('true') && enumOpts.includes('false')) {
      return { propType: 'boolean', options: enumOpts, optional };
    }
    return { propType: 'select', options: enumOpts, optional };
  }

  // Number (including z.coerce.number())
  if (t === 'number' || t === 'ZodNumber') {
    return { propType: 'number', optional };
  }

  // String with .url() check
  if ((t === 'string' || t === 'ZodString') && hasUrlCheck(def)) {
    return { propType: 'url', optional };
  }

  return { propType: 'text', optional };
}

function extractPropertyItems(schema: BlockSchema): CompletionItem[] {
  const shape = schema.properties.shape;
  const items: CompletionItem[] = [];

  for (const [key, zodType] of Object.entries(shape)) {
    let description = '';
    if (zodType && typeof zodType === 'object' && 'description' in zodType) {
      description = (zodType as { description?: string }).description ?? '';
    }

    const { propType, options, optional } = detectPropertyType(zodType);

    items.push({
      label: key,
      description: description || `Property of ${schema.name}`,
      type: 'property',
      propType,
      ...(options ? { options } : {}),
      ...(optional ? { optional } : {}),
    });
  }

  return items;
}

export function createCompletionData(
  schemas: BlockSchema[],
  kits?: MklyKit[],
): CompletionData {
  const blocks: CompletionItem[] = [];
  const properties = new Map<string, CompletionItem[]>();

  // Only use raw schemas when no kits are provided (kits include their own schemas with qualified names)
  if (!kits || kits.length === 0) {
    for (const schema of schemas) {
      blocks.push({
        label: schema.name,
        description: schema.description,
        type: 'block',
      });

      const propItems = extractPropertyItems(schema);
      if (propItems.length > 0) {
        properties.set(schema.name, propItems);
      }
    }
  }

  const kitItems: CompletionItem[] = [];
  if (kits) {
    for (const kit of kits) {
      kitItems.push({
        label: kit.name,
        description: kit.displayName ?? kit.description ?? `${kit.name} kit`,
        type: 'kit',
      });
    }
  }

  const variableItems: CompletionItem[] = STYLE_VARIABLES.map((v: StyleVariable) => ({
    label: v.name,
    description: v.description,
    type: 'variable' as const,
  }));

  const stylePropertyItems: CompletionItem[] = getAllStylePropertyNames().map(name => ({
    label: name,
    description: `CSS property: ${name}`,
    type: 'property' as const,
  }));

  const themeItems: CompletionItem[] = [];
  const presetItems: CompletionItem[] = [];
  const docsMap = new Map<string, BlockDocs>();
  const blockKits = new Map<string, string>();
  const kitInfoMap = new Map<string, KitInfo>();
  const targetsMap = new Map<string, Record<string, TargetInfo>>();
  const styleHintsMap = new Map<string, Record<string, string[]>>();
  const contentModesMap = new Map<string, string>();
  const seenMeta = new Set<string>();
  const metaProperties: MetaProperty[] = [];
  if (kits) {
    for (const kit of kits) {
      const info: KitInfo = {
        name: kit.name,
        displayName: kit.displayName ?? kit.name,
        description: kit.description ?? `${kit.name} kit`,
        blockNames: [],
        themeNames: [],
        presetNames: [],
      };
      if (kit.blocks) {
        for (const block of kit.blocks) {
          const qualified = `${kit.name}/${block.name}`;
          blockKits.set(qualified, kit.name);
          info.blockNames.push(qualified);
          if (block.targets) {
            targetsMap.set(qualified, block.targets);
          }
          if (block.styleHints) {
            styleHintsMap.set(qualified, block.styleHints);
          }
          if (block.contentMode) {
            contentModesMap.set(qualified, block.contentMode);
          }
        }
      }
      if (kit.schemas) {
        for (const schema of kit.schemas) {
          const qualified = `${kit.name}/${schema.name}`;
          blocks.push({
            label: qualified,
            description: schema.description,
            type: 'block',
          });
          const propItems = extractPropertyItems(schema);
          if (propItems.length > 0) {
            properties.set(qualified, propItems);
          }
        }
      }
      if (kit.docs) {
        for (const [name, doc] of Object.entries(kit.docs)) {
          // Doc keys are already qualified (e.g. 'core/heading'), use as-is
          docsMap.set(name, doc);
        }
      }
      if (kit.themes) {
        for (const theme of kit.themes) {
          themeItems.push({
            label: `${kit.name}/${theme.name}`,
            description: theme.displayName ?? theme.description ?? `${theme.name} theme from ${kit.name} kit`,
            type: 'kit',
          });
          info.themeNames.push(`${kit.name}/${theme.name}`);
        }
      }
      if (kit.presets) {
        for (const preset of kit.presets) {
          presetItems.push({
            label: `${kit.name}/${preset.name}`,
            description: preset.displayName ?? preset.description ?? `${preset.name} preset from ${kit.name} kit`,
            type: 'kit',
          });
          info.presetNames.push(`${kit.name}/${preset.name}`);
        }
      }
      if (kit.defaultPreset) {
        info.defaultPreset = `${kit.name}/${kit.defaultPreset}`;
      }
      if (kit.metaProperties) {
        for (const mp of kit.metaProperties) {
          if (!seenMeta.has(mp.name)) {
            seenMeta.add(mp.name);
            metaProperties.push(mp);
          }
        }
      }
      kitInfoMap.set(kit.name, info);
    }
  }

  return {
    blocks,
    properties,
    kits: kitItems,
    themes: themeItems,
    presets: presetItems,
    variables: variableItems,
    docs: docsMap,
    blockKits,
    kitInfo: kitInfoMap,
    metaProperties,
    targets: targetsMap,
    styleHints: styleHintsMap,
    styleProperties: stylePropertyItems,
    contentModes: contentModesMap,
  };
}
