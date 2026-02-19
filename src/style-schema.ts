/**
 * Style schema: defines what CSS properties are available in the inspector
 * and how they should be rendered (control type, options, presets).
 */

export type StylePropertyType = 'color' | 'spacing' | 'alignment' | 'select' | 'slider' | 'text';

export interface StylePreset {
  label: string;
  value: string;
  /** Optional group name for `<optgroup>` rendering */
  group?: string;
}

export interface StylePropertyDef {
  /** CSS property name (kebab-case) */
  name: string;
  /** UI display label */
  label: string;
  /** Control type to render */
  type: StylePropertyType;
  /** Options for 'select' type */
  options?: StylePreset[];
  /** Range min for 'slider' type (default 0) */
  min?: number;
  /** Range max for 'slider' type (default 100) */
  max?: number;
  /** Scale factor for slider: stored = slider / scale (e.g. 100 → opacity 0-1) */
  scale?: number;
  /** Placeholder text for 'text' type */
  placeholder?: string;
  /** Marks dense/rare options that should be hidden behind "More options" by default. */
  advanced?: boolean;
}

export interface StyleSector {
  id: string;
  label: string;
  properties: StylePropertyDef[];
}

// ---------------------------------------------------------------------------
// Preset collections
// ---------------------------------------------------------------------------

const DISPLAY_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'block', value: 'block' },
  { label: 'inline', value: 'inline' },
  { label: 'inline-block', value: 'inline-block' },
  { label: 'flex', value: 'flex' },
  { label: 'grid', value: 'grid' },
  { label: 'none', value: 'none' },
];

const CURSOR_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'default', value: 'default' },
  { label: 'pointer', value: 'pointer' },
  { label: 'grab', value: 'grab' },
  { label: 'text', value: 'text' },
  { label: 'not-allowed', value: 'not-allowed' },
  { label: 'crosshair', value: 'crosshair' },
];

const OVERFLOW_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'hidden', value: 'hidden' },
  { label: 'auto', value: 'auto' },
  { label: 'scroll', value: 'scroll' },
  { label: 'visible', value: 'visible' },
];

const ALIGN_ITEMS_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'stretch', value: 'stretch' },
  { label: 'start', value: 'start' },
  { label: 'center', value: 'center' },
  { label: 'end', value: 'end' },
  { label: 'baseline', value: 'baseline' },
];

const OBJECT_FIT_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'cover', value: 'cover' },
  { label: 'contain', value: 'contain' },
  { label: 'fill', value: 'fill' },
  { label: 'none', value: 'none' },
  { label: 'scale-down', value: 'scale-down' },
];

import { GOOGLE_FONTS } from './google-fonts';

const FONT_FAMILY_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  // System stacks
  { label: 'System UI', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", group: 'System' },
  { label: 'System Serif', value: "Georgia, 'Times New Roman', serif", group: 'System' },
  { label: 'System Mono', value: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace", group: 'System' },
  // Auto-generated from Google Fonts catalog
  ...Object.entries(GOOGLE_FONTS).map(([name, def]) => ({
    label: name,
    value: `'${name}', ${def.fallback}`,
    group: def.category,
  })),
];

const FONT_SIZE_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: '0.75rem', value: '0.75rem' },
  { label: '0.875rem', value: '0.875rem' },
  { label: '1rem', value: '1rem' },
  { label: '1.125rem', value: '1.125rem' },
  { label: '1.25rem', value: '1.25rem' },
  { label: '1.5rem', value: '1.5rem' },
  { label: '1.75rem', value: '1.75rem' },
  { label: '2rem', value: '2rem' },
  { label: '2.5rem', value: '2.5rem' },
  { label: '3rem', value: '3rem' },
];

const FONT_WEIGHT_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'Normal (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semibold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
];

const BORDER_STYLE_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'none', value: 'none' },
  { label: 'solid', value: 'solid' },
  { label: 'dashed', value: 'dashed' },
  { label: 'dotted', value: 'dotted' },
  { label: 'double', value: 'double' },
];

const SHADOW_PRESETS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'Subtle', value: '0 0.0625rem 0.1875rem rgba(0,0,0,0.12)' },
  { label: 'Small', value: '0 0.125rem 0.5rem rgba(0,0,0,0.15)' },
  { label: 'Medium', value: '0 0.25rem 1rem rgba(0,0,0,0.12)' },
  { label: 'Large', value: '0 0.5rem 2rem rgba(0,0,0,0.15)' },
  { label: 'XL', value: '0 1rem 3rem rgba(0,0,0,0.2)' },
];

const ANIMATION_PRESETS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'Fade In', value: 'fadeIn 0.5s ease' },
  { label: 'Slide Up', value: 'slideUp 0.5s ease' },
  { label: 'Slide Down', value: 'slideDown 0.5s ease' },
  { label: 'Slide Left', value: 'slideInLeft 0.5s ease' },
  { label: 'Slide Right', value: 'slideInRight 0.5s ease' },
  { label: 'Scale In', value: 'scaleIn 0.3s ease' },
  { label: 'Bounce', value: 'bounce 0.6s ease' },
  { label: 'Pulse', value: 'pulse 2s infinite' },
  { label: 'Shake', value: 'shake 0.5s ease' },
  { label: 'Reveal Card', value: 'revealCard 0.4s ease' },
];

const TRANSITION_PRESETS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'All 0.2s', value: 'all 0.2s ease' },
  { label: 'All 0.3s', value: 'all 0.3s ease' },
  { label: 'All 0.5s', value: 'all 0.5s ease' },
  { label: 'Transform 0.2s', value: 'transform 0.2s ease' },
  { label: 'Opacity 0.3s', value: 'opacity 0.3s ease' },
  { label: 'Colors 0.2s', value: 'color 0.2s, background-color 0.2s' },
];

const FONT_STYLE_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: 'normal', value: 'normal' },
  { label: 'italic', value: 'italic' },
];

const HOVER_TRANSFORM_OPTIONS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'Grow', value: 'scale(1.05)' },
  { label: 'Shrink', value: 'scale(0.95)' },
  { label: 'Lift', value: 'translateY(-0.125rem)' },
  { label: 'Push', value: 'translateY(0.0625rem)' },
];

const HOVER_OPACITY_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: '80%', value: '0.8' },
  { label: '60%', value: '0.6' },
  { label: '40%', value: '0.4' },
];

const HOVER_SHADOW_PRESETS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'Medium', value: '0 0.25rem 1rem rgba(0,0,0,0.15)' },
  { label: 'Large', value: '0 0.5rem 2rem rgba(0,0,0,0.2)' },
  { label: 'XL', value: '0 1rem 3rem rgba(0,0,0,0.25)' },
];

// ---------------------------------------------------------------------------
// Default sectors (available for all blocks)
// ---------------------------------------------------------------------------

export const LAYOUT_SECTOR: StyleSector = {
  id: 'layout',
  label: 'Layout',
  properties: [
    { name: 'display', label: 'Display', type: 'select', options: DISPLAY_OPTIONS, advanced: true },
    { name: 'text-align', label: 'Align', type: 'alignment' },
    { name: 'align-items', label: 'Items', type: 'select', options: ALIGN_ITEMS_OPTIONS, advanced: true },
    { name: 'grid-template-columns', label: 'Grid Cols', type: 'text', placeholder: 'e.g. 1fr 1fr', advanced: true },
    { name: 'cursor', label: 'Cursor', type: 'select', options: CURSOR_OPTIONS, advanced: true },
    { name: 'overflow', label: 'Overflow', type: 'select', options: OVERFLOW_OPTIONS, advanced: true },
  ],
};

export const SIZING_SECTOR: StyleSector = {
  id: 'sizing',
  label: 'Sizing',
  properties: [
    { name: 'width', label: 'Width', type: 'text', placeholder: 'e.g. 100%' },
    { name: 'height', label: 'Height', type: 'text', placeholder: 'e.g. 2.5rem' },
    { name: 'max-width', label: 'Max Width', type: 'text', placeholder: 'e.g. 37.5rem', advanced: true },
    { name: 'min-height', label: 'Min Height', type: 'text', placeholder: 'e.g. 12.5rem', advanced: true },
    { name: 'gap', label: 'Gap', type: 'text', placeholder: 'e.g. 1rem', advanced: true },
  ],
};

export const SPACING_SECTOR: StyleSector = {
  id: 'spacing',
  label: 'Spacing',
  properties: [
    { name: 'padding', label: 'Padding', type: 'spacing' },
    { name: 'margin', label: 'Margin', type: 'spacing' },
  ],
};

export const TYPOGRAPHY_SECTOR: StyleSector = {
  id: 'typography',
  label: 'Typography',
  properties: [
    { name: 'font-family', label: 'Font', type: 'select', options: FONT_FAMILY_OPTIONS },
    { name: 'font-size', label: 'Size', type: 'select', options: FONT_SIZE_OPTIONS },
    { name: 'font-weight', label: 'Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
    { name: 'color', label: 'Color', type: 'color' },
    { name: 'font-style', label: 'Style', type: 'select', options: FONT_STYLE_OPTIONS },
    { name: 'line-height', label: 'Height', type: 'text', placeholder: '1.6' },
  ],
};

export const BACKGROUND_SECTOR: StyleSector = {
  id: 'background',
  label: 'Background',
  properties: [
    { name: 'background', label: 'Color', type: 'color' },
  ],
};

export const BORDER_SECTOR: StyleSector = {
  id: 'border',
  label: 'Border',
  properties: [
    { name: 'border-width', label: 'Width', type: 'text', placeholder: '0rem' },
    { name: 'border-style', label: 'Style', type: 'select', options: BORDER_STYLE_OPTIONS },
    { name: 'border-color', label: 'Color', type: 'color' },
    { name: 'border-radius', label: 'Radius', type: 'text', placeholder: '0rem' },
  ],
};

export const EFFECTS_SECTOR: StyleSector = {
  id: 'effects',
  label: 'Effects',
  properties: [
    { name: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 100, scale: 100 },
    { name: 'box-shadow', label: 'Shadow', type: 'select', options: SHADOW_PRESETS },
    { name: 'transform', label: 'Transform', type: 'text', placeholder: 'e.g. rotate(5deg)', advanced: true },
  ],
};

export const ANIMATION_SECTOR: StyleSector = {
  id: 'animation',
  label: 'Animation',
  properties: [
    { name: 'animation', label: 'Animate', type: 'select', options: ANIMATION_PRESETS },
    { name: 'transition', label: 'Transition', type: 'select', options: TRANSITION_PRESETS },
  ],
};

export const HOVER_SECTOR: StyleSector = {
  id: 'hover',
  label: 'Hover',
  properties: [
    { name: 'transform', label: 'Transform', type: 'select', options: HOVER_TRANSFORM_OPTIONS },
    { name: 'opacity', label: 'Opacity', type: 'select', options: HOVER_OPACITY_OPTIONS },
    { name: 'background-color', label: 'Bg', type: 'color' },
    { name: 'box-shadow', label: 'Shadow', type: 'select', options: HOVER_SHADOW_PRESETS },
  ],
};

/** Comprehensive target sub-element sectors (filtered by styleHints per block) */
export const TARGET_SECTORS: StyleSector[] = [
  {
    id: 'target-layout',
    label: 'Layout',
    properties: [
      { name: 'display', label: 'Display', type: 'select', options: DISPLAY_OPTIONS, advanced: true },
      { name: 'text-align', label: 'Align', type: 'alignment' },
      { name: 'align-items', label: 'Items', type: 'select', options: ALIGN_ITEMS_OPTIONS, advanced: true },
      { name: 'grid-template-columns', label: 'Grid Cols', type: 'text', placeholder: 'e.g. 1fr 1fr', advanced: true },
      { name: 'overflow', label: 'Overflow', type: 'select', options: OVERFLOW_OPTIONS, advanced: true },
    ],
  },
  {
    id: 'target-sizing',
    label: 'Sizing',
    properties: [
      { name: 'width', label: 'Width', type: 'text', placeholder: 'e.g. 100%' },
      { name: 'max-width', label: 'Max W', type: 'text', placeholder: 'e.g. 37.5rem', advanced: true },
      { name: 'height', label: 'Height', type: 'text', placeholder: 'e.g. auto' },
      { name: 'aspect-ratio', label: 'Aspect', type: 'text', placeholder: 'e.g. 16 / 9', advanced: true },
      { name: 'object-fit', label: 'Fit', type: 'select', options: OBJECT_FIT_OPTIONS, advanced: true },
      { name: 'margin', label: 'Margin', type: 'spacing' },
      { name: 'padding', label: 'Padding', type: 'spacing' },
    ],
  },
  {
    id: 'target-typography',
    label: 'Typography',
    properties: [
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'font-family', label: 'Font', type: 'select', options: FONT_FAMILY_OPTIONS },
      { name: 'font-size', label: 'Size', type: 'select', options: FONT_SIZE_OPTIONS },
      { name: 'font-weight', label: 'Weight', type: 'select', options: FONT_WEIGHT_OPTIONS },
      { name: 'font-style', label: 'Style', type: 'select', options: FONT_STYLE_OPTIONS },
      { name: 'line-height', label: 'Height', type: 'text', placeholder: '1.6' },
    ],
  },
  {
    id: 'target-appearance',
    label: 'Appearance',
    properties: [
      { name: 'background', label: 'Bg', type: 'color' },
      { name: 'border-radius', label: 'Radius', type: 'text', placeholder: 'e.g. 0.5rem' },
      { name: 'border-width', label: 'Border W', type: 'text', placeholder: '0rem', advanced: true },
      { name: 'border-style', label: 'Border S', type: 'select', options: BORDER_STYLE_OPTIONS, advanced: true },
      { name: 'border-color', label: 'Border C', type: 'color', advanced: true },
      { name: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 100, scale: 100 },
      { name: 'box-shadow', label: 'Shadow', type: 'select', options: SHADOW_PRESETS, advanced: true },
    ],
  },
];

/** Default sectors for the 'self' target */
export const DEFAULT_SELF_SECTORS: StyleSector[] = [
  LAYOUT_SECTOR,
  SIZING_SECTOR,
  SPACING_SECTOR,
  TYPOGRAPHY_SECTOR,
  BACKGROUND_SECTOR,
  BORDER_SECTOR,
  EFFECTS_SECTOR,
  ANIMATION_SECTOR,
];

const TAG_TARGET_PROFILES: Record<string, string[]> = {
  p: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'text-align', 'margin', 'padding', 'background', 'border-radius', 'opacity'],
  li: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'text-align', 'margin', 'padding', 'background', 'border-radius', 'opacity'],
  blockquote: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'text-align', 'margin', 'padding', 'background', 'border-radius', 'opacity'],
  span: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'background'],
  strong: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'background'],
  em: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'background'],
  a: ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity'],
  img: ['width', 'max-width', 'height', 'aspect-ratio', 'object-fit', 'margin', 'padding', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  code: ['color', 'font-family', 'font-size', 'font-weight', 'background', 'padding', 'border-radius', 'opacity'],
  pre: ['color', 'font-family', 'font-size', 'line-height', 'background', 'padding', 'margin', 'border-radius', 'border-width', 'border-style', 'border-color', 'overflow', 'opacity', 'box-shadow'],
  hr: ['width', 'max-width', 'height', 'background', 'margin', 'opacity'],
};

const HEADING_TAG_RE = /^h[1-6]$/;

const HEADING_TARGET_PROFILE = [
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'text-align', 'margin', 'padding', 'background',
  'border-radius', 'border-width', 'border-style', 'border-color', 'opacity',
];

export interface ResolveStyleSectorsInput {
  target: string;
  styleHints?: Record<string, string[]>;
  /** Exact selected descendant tag (used for class-scoped targets like `>.s1`) */
  targetTag?: string;
}

export interface ResolvedStyleSectors {
  sectors: StyleSector[];
  rawSectors: StyleSector[];
  source: 'default' | 'hints' | 'tag-profile';
  allowedProps?: string[];
  unsupportedHintProps: string[];
}

function filterSectorsByProps(sectors: StyleSector[], allowed: string[]): StyleSector[] {
  const set = new Set(allowed);
  const result: StyleSector[] = [];
  for (const sector of sectors) {
    const filtered = sector.properties.filter((prop) => set.has(prop.name));
    if (filtered.length === 0) continue;
    result.push(filtered.length === sector.properties.length ? sector : { ...sector, properties: filtered });
  }
  return result;
}

function extractTagName(target: string, targetTag?: string): string | undefined {
  if (targetTag) return targetTag.toLowerCase();
  if (!target.startsWith('>')) return undefined;
  const raw = target.slice(1);
  if (raw.startsWith('.')) return undefined;
  const cleaned = raw
    .replace(/:nth-of-type\(\d+\)/g, '')
    .replace(/:[a-z-]+$/g, '')
    .trim()
    .toLowerCase();
  return cleaned || undefined;
}

function resolveTagProfile(tag: string): string[] | undefined {
  if (HEADING_TAG_RE.test(tag)) return HEADING_TARGET_PROFILE;
  return TAG_TARGET_PROFILES[tag];
}

/** Resolve the editable style sectors for a specific scope/tab. */
export function resolveStyleSectors(input: ResolveStyleSectorsInput): ResolvedStyleSectors {
  const { target, styleHints, targetTag } = input;
  const isSelf = target === 'self';
  const isHover = target === 'self:hover';
  const isTagTarget = target.startsWith('>');

  const rawSectors = isHover
    ? [HOVER_SECTOR]
    : isSelf
      ? DEFAULT_SELF_SECTORS
      : TARGET_SECTORS;

  let allowedProps: string[] | undefined;
  let source: 'default' | 'hints' | 'tag-profile' = 'default';

  if (isSelf) {
    allowedProps = styleHints?.['self'];
    if (allowedProps) source = 'hints';
  } else if (isHover) {
    allowedProps = styleHints?.['self:hover'];
    if (allowedProps) source = 'hints';
  } else if (isTagTarget) {
    allowedProps = styleHints?.['>'];
    if (allowedProps) {
      source = 'hints';
    } else {
      const tag = extractTagName(target, targetTag);
      if (tag) {
        const profile = resolveTagProfile(tag);
        if (profile) {
          allowedProps = profile;
          source = 'tag-profile';
        }
      }
    }
  } else {
    allowedProps = styleHints?.[target];
    if (allowedProps) source = 'hints';
  }

  const rawPropNames = new Set(rawSectors.flatMap((sector) => sector.properties.map((prop) => prop.name)));
  const unsupportedHintProps = (allowedProps ?? []).filter((prop) => !rawPropNames.has(prop));
  const sectors = allowedProps ? filterSectorsByProps(rawSectors, allowedProps) : rawSectors;

  return { sectors, rawSectors, source, allowedProps, unsupportedHintProps };
}

/** All style property names used across all sectors (for completions) */
export function getAllStylePropertyNames(): string[] {
  const names = new Set<string>();
  for (const sector of [...DEFAULT_SELF_SECTORS, HOVER_SECTOR, ...TARGET_SECTORS]) {
    for (const prop of sector.properties) {
      names.add(prop.name);
    }
  }
  return [...names];
}
