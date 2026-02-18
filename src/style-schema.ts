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

const _gf = (name: string): StylePreset => {
  const def = GOOGLE_FONTS[name];
  return { label: name, value: `'${name}', ${def?.fallback ?? 'sans-serif'}`, group: def?.category };
};

const FONT_FAMILY_OPTIONS: StylePreset[] = [
  { label: 'Default', value: '' },
  // System stacks
  { label: 'System UI', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", group: 'System' },
  { label: 'System Serif', value: "Georgia, 'Times New Roman', serif", group: 'System' },
  { label: 'System Mono', value: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace", group: 'System' },
  // Sans-serif
  _gf('Inter'), _gf('Roboto'), _gf('Open Sans'), _gf('Lato'), _gf('Montserrat'),
  _gf('Poppins'), _gf('Nunito'), _gf('Raleway'), _gf('Work Sans'), _gf('DM Sans'),
  _gf('Plus Jakarta Sans'), _gf('Outfit'), _gf('Manrope'), _gf('Figtree'),
  _gf('Source Sans 3'), _gf('Noto Sans'), _gf('Barlow'), _gf('Lexend'),
  _gf('Public Sans'), _gf('Archivo'), _gf('Rubik'), _gf('Mulish'),
  _gf('Exo 2'), _gf('Karla'), _gf('Mukta'), _gf('Quicksand'),
  _gf('Cabin'), _gf('Josefin Sans'), _gf('Saira'), _gf('Albert Sans'),
  _gf('Sora'), _gf('Space Grotesk'), _gf('Red Hat Display'), _gf('Urbanist'), _gf('Geist'),
  // Serif
  _gf('Merriweather'), _gf('Playfair Display'), _gf('Lora'), _gf('PT Serif'),
  _gf('Libre Baskerville'), _gf('Crimson Text'), _gf('EB Garamond'), _gf('Source Serif 4'),
  _gf('Noto Serif'), _gf('Bitter'), _gf('DM Serif Display'), _gf('Cormorant Garamond'),
  _gf('Spectral'), _gf('Alegreya'), _gf('Vollkorn'), _gf('Cardo'),
  _gf('Old Standard TT'), _gf('Libre Caslon Text'), _gf('Zilla Slab'), _gf('IBM Plex Serif'),
  _gf('Newsreader'), _gf('Fraunces'), _gf('Young Serif'), _gf('Instrument Serif'), _gf('Brygada 1918'),
  // Display
  _gf('Oswald'), _gf('Bebas Neue'), _gf('Anton'), _gf('Righteous'),
  _gf('Passion One'), _gf('Abril Fatface'), _gf('Bungee'), _gf('Permanent Marker'),
  _gf('Pacifico'), _gf('Fredoka'), _gf('Comfortaa'), _gf('Audiowide'),
  _gf('Orbitron'), _gf('Major Mono Display'), _gf('Silkscreen'), _gf('Press Start 2P'),
  _gf('Chivo'), _gf('Big Shoulders Display'), _gf('Syne'), _gf('Alfa Slab One'),
  // Monospace
  _gf('JetBrains Mono'), _gf('Fira Code'), _gf('Source Code Pro'), _gf('IBM Plex Mono'),
  _gf('Space Mono'), _gf('Roboto Mono'), _gf('Ubuntu Mono'), _gf('Inconsolata'),
  _gf('Red Hat Mono'), _gf('DM Mono'),
  // Handwriting
  _gf('Dancing Script'), _gf('Caveat'), _gf('Satisfy'), _gf('Great Vibes'),
  _gf('Indie Flower'), _gf('Kalam'), _gf('Patrick Hand'), _gf('Shadows Into Light'),
  _gf('Amatic SC'), _gf('Sacramento'),
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
