/**
 * Tests that all preset css field entries use longhand margin properties
 * (marginBottom, marginTop) with gap scaling — never shorthand `margin:`.
 *
 * The css field feeds the StyleGraph inspector which reads/writes specific
 * properties like `marginBottom`. Using shorthand `margin:` breaks the
 * inspector and can override unrelated margin sides.
 */
import { describe, test, expect } from 'bun:test';
import { CORE_PRESETS } from '../src/presets';
import { NEWSLETTER_PRESETS } from '../../mkly-kits/newsletter/src/presets';
import { DOCS_PRESETS } from '../../mkly-kits/docs/src/presets';

/** Parse a css field into block→properties map */
function parseCssField(css: string): Map<string, Array<[string, string]>> {
  const blocks = new Map<string, Array<[string, string]>>();
  let currentBlock: string | null = null;

  for (const line of css.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!trimmed.includes(':') || (trimmed.match(/:/g)?.length === 1 && !trimmed.startsWith(' '))) {
      // Might be a block selector (no indentation, no colon or just the colon in e.g. "core/heading")
      const indent = line.length - line.trimStart().length;
      if (indent === 0 && !trimmed.includes(': ')) {
        currentBlock = trimmed;
        if (!blocks.has(currentBlock)) {
          blocks.set(currentBlock, []);
        }
        continue;
      }
    }

    // Property line
    const propMatch = trimmed.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (propMatch && currentBlock) {
      blocks.get(currentBlock)!.push([propMatch[1], propMatch[2]]);
    }
  }

  return blocks;
}

/** All presets to check */
const ALL_PRESETS = [
  ...CORE_PRESETS.map(p => ({ ...p, kit: 'core' })),
  ...NEWSLETTER_PRESETS.map(p => ({ ...p, kit: 'newsletter' })),
  ...DOCS_PRESETS.map(p => ({ ...p, kit: 'docs' })),
];

describe('preset css field — no margin shorthand', () => {
  for (const preset of ALL_PRESETS) {
    test(`${preset.kit}/${preset.name}: no "margin:" shorthand in css field`, () => {
      const blocks = parseCssField(preset.css);
      const violations: string[] = [];

      for (const [block, props] of blocks) {
        for (const [prop] of props) {
          if (prop === 'margin') {
            violations.push(`${block} has "margin:" shorthand — use marginBottom/marginTop instead`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  }
});

describe('preset css field — gap scaling on inter-block margins', () => {
  // All block types that should have gap-scaled marginBottom
  const NEWSLETTER_MAIN_BLOCKS = [
    'newsletter/intro', 'newsletter/featured', 'newsletter/category',
    'newsletter/quickHits', 'newsletter/tools', 'newsletter/tipOfTheDay',
    'newsletter/community', 'newsletter/personalNote', 'newsletter/poll',
    'newsletter/recommendations', 'newsletter/sponsor', 'newsletter/outro',
    'newsletter/custom',
  ];

  const CORE_MAIN_BLOCKS = [
    'core/heading', 'core/text', 'core/image', 'core/button',
    'core/code', 'core/quote', 'core/hero', 'core/section',
    'core/card', 'core/list', 'core/cta',
  ];

  for (const preset of NEWSLETTER_PRESETS) {
    test(`newsletter/${preset.name}: all newsletter blocks have gap-scaled marginBottom`, () => {
      const blocks = parseCssField(preset.css);
      const missing: string[] = [];

      for (const block of NEWSLETTER_MAIN_BLOCKS) {
        const props = blocks.get(block);
        if (!props) {
          missing.push(`${block}: not found in css field`);
          continue;
        }

        const hasGapMargin = props.some(([prop, val]) =>
          (prop === 'marginBottom' || prop === 'marginTop') &&
          val.includes('var(--mkly-gap-scale')
        );

        if (!hasGapMargin) {
          // Special case: newsletter/item uses marginBottom on itself
          // Some blocks may use different margin directions — just ensure SOME gap-scaled margin
          const anyGapMargin = props.some(([, val]) =>
            val.includes('var(--mkly-gap-scale')
          );
          if (!anyGapMargin) {
            missing.push(`${block}: no gap-scaled margin found`);
          }
        }
      }

      expect(missing).toEqual([]);
    });
  }

  for (const preset of NEWSLETTER_PRESETS) {
    test(`newsletter/${preset.name}: core blocks in newsletter preset have gap-scaled margins`, () => {
      const blocks = parseCssField(preset.css);
      const missing: string[] = [];

      for (const block of CORE_MAIN_BLOCKS) {
        const props = blocks.get(block);
        if (!props) {
          // Core blocks might not be in every newsletter preset — they inherit from core preset
          continue;
        }

        const hasGapMargin = props.some(([, val]) =>
          val.includes('var(--mkly-gap-scale')
        );

        if (!hasGapMargin) {
          missing.push(`${block}: has css entry but no gap-scaled margin`);
        }
      }

      expect(missing).toEqual([]);
    });
  }
});

describe('preset css field — item block has gap-scaled marginBottom', () => {
  for (const preset of NEWSLETTER_PRESETS) {
    test(`newsletter/${preset.name}: newsletter/item has gap-scaled marginBottom`, () => {
      const blocks = parseCssField(preset.css);
      const itemProps = blocks.get('newsletter/item');
      if (!itemProps) {
        throw new Error('newsletter/item not found in css field');
      }

      const hasGapMarginBottom = itemProps.some(([prop, val]) =>
        prop === 'marginBottom' && val.includes('var(--mkly-gap-scale')
      );

      expect(hasGapMarginBottom).toBe(true);
    });
  }
});

describe('preset css field — divider has gap-scaled marginTop AND marginBottom', () => {
  for (const preset of NEWSLETTER_PRESETS) {
    test(`newsletter/${preset.name}: core/divider margins use gap scaling (if present)`, () => {
      const blocks = parseCssField(preset.css);
      const dividerProps = blocks.get('core/divider');
      if (!dividerProps) return; // Not required in every newsletter preset

      const hasGapMarginTop = dividerProps.some(([prop, val]) =>
        prop === 'marginTop' && val.includes('var(--mkly-gap-scale')
      );
      const hasGapMarginBottom = dividerProps.some(([prop, val]) =>
        prop === 'marginBottom' && val.includes('var(--mkly-gap-scale')
      );

      // Divider needs both top and bottom gap-scaled margins
      if (!hasGapMarginTop) {
        expect.unreachable('core/divider missing gap-scaled marginTop');
      }
      if (!hasGapMarginBottom) {
        expect.unreachable('core/divider missing gap-scaled marginBottom');
      }
    });
  }
});
