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
  ...['12', '14', '16', '18', '20', '24', '28', '32', '40', '48'].map(s => ({ label: `${s}px`, value: `${s}px` })),
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
  { label: 'Subtle', value: '0 1px 3px rgba(0,0,0,0.12)' },
  { label: 'Small', value: '0 2px 8px rgba(0,0,0,0.15)' },
  { label: 'Medium', value: '0 4px 16px rgba(0,0,0,0.12)' },
  { label: 'Large', value: '0 8px 32px rgba(0,0,0,0.15)' },
  { label: 'XL', value: '0 16px 48px rgba(0,0,0,0.2)' },
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
  { label: 'Lift', value: 'translateY(-2px)' },
  { label: 'Push', value: 'translateY(1px)' },
];

const HOVER_OPACITY_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  { label: '80%', value: '0.8' },
  { label: '60%', value: '0.6' },
  { label: '40%', value: '0.4' },
];

const HOVER_SHADOW_PRESETS: StylePreset[] = [
  { label: 'None', value: '' },
  { label: 'Medium', value: '0 4px 16px rgba(0,0,0,0.15)' },
  { label: 'Large', value: '0 8px 32px rgba(0,0,0,0.2)' },
  { label: 'XL', value: '0 16px 48px rgba(0,0,0,0.25)' },
];

// ---------------------------------------------------------------------------
// Default sectors (available for all blocks)
// ---------------------------------------------------------------------------

export const LAYOUT_SECTOR: StyleSector = {
  id: 'layout',
  label: 'Layout',
  properties: [
    { name: 'display', label: 'Display', type: 'select', options: DISPLAY_OPTIONS },
    { name: 'text-align', label: 'Align', type: 'alignment' },
    { name: 'cursor', label: 'Cursor', type: 'select', options: CURSOR_OPTIONS },
    { name: 'overflow', label: 'Overflow', type: 'select', options: OVERFLOW_OPTIONS },
  ],
};

export const SIZING_SECTOR: StyleSector = {
  id: 'sizing',
  label: 'Sizing',
  properties: [
    { name: 'width', label: 'Width', type: 'text', placeholder: 'e.g. 100%' },
    { name: 'height', label: 'Height', type: 'text', placeholder: 'e.g. 40px' },
    { name: 'max-width', label: 'Max Width', type: 'text', placeholder: 'e.g. 600px' },
    { name: 'min-height', label: 'Min Height', type: 'text', placeholder: 'e.g. 200px' },
    { name: 'gap', label: 'Gap', type: 'text', placeholder: 'e.g. 16px' },
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
    { name: 'border-width', label: 'Width', type: 'text', placeholder: '0px' },
    { name: 'border-style', label: 'Style', type: 'select', options: BORDER_STYLE_OPTIONS },
    { name: 'border-color', label: 'Color', type: 'color' },
    { name: 'border-radius', label: 'Radius', type: 'text', placeholder: '0px' },
  ],
};

export const EFFECTS_SECTOR: StyleSector = {
  id: 'effects',
  label: 'Effects',
  properties: [
    { name: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 100, scale: 100 },
    { name: 'box-shadow', label: 'Shadow', type: 'select', options: SHADOW_PRESETS },
    { name: 'transform', label: 'Transform', type: 'text', placeholder: 'e.g. rotate(5deg)' },
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
      { name: 'display', label: 'Display', type: 'select', options: DISPLAY_OPTIONS },
      { name: 'text-align', label: 'Align', type: 'alignment' },
    ],
  },
  {
    id: 'target-sizing',
    label: 'Sizing',
    properties: [
      { name: 'width', label: 'Width', type: 'text', placeholder: 'e.g. 100%' },
      { name: 'max-width', label: 'Max W', type: 'text', placeholder: 'e.g. 600px' },
      { name: 'height', label: 'Height', type: 'text', placeholder: 'e.g. auto' },
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
      { name: 'border-radius', label: 'Radius', type: 'text', placeholder: 'e.g. 8px' },
      { name: 'border-width', label: 'Border W', type: 'text', placeholder: '0px' },
      { name: 'border-style', label: 'Border S', type: 'select', options: BORDER_STYLE_OPTIONS },
      { name: 'border-color', label: 'Border C', type: 'color' },
      { name: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 100, scale: 100 },
      { name: 'box-shadow', label: 'Shadow', type: 'select', options: SHADOW_PRESETS },
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
