import { describe, it, expect } from 'bun:test';
import { mkly, parse, CORE_KIT, defineKit } from '../src/index';
import type { MklyTheme, MklyPreset } from '../src/types';

function html(source: string): string {
  return mkly(source, { kits: { core: CORE_KIT } }).html;
}

function errors(source: string): string[] {
  return mkly(source, { kits: { core: CORE_KIT } }).errors.map(e => e.message);
}

describe('define-theme', () => {
  describe('parser', () => {
    it('should parse define-theme with variables only', () => {
      const doc = parse(`--- define-theme: warm
accent: #e2725b
bg: #faf7f2
text: #2d2a26

--- meta
version: 1`);
      expect(doc.inlineThemes).toHaveLength(1);
      expect(doc.inlineThemes[0].name).toBe('warm');
      expect(doc.inlineThemes[0].variables).toEqual({
        accent: '#e2725b',
        bg: '#faf7f2',
        text: '#2d2a26',
      });
      expect(doc.inlineThemes[0].css).toBeUndefined();
    });

    it('should parse define-theme with variables and CSS', () => {
      const doc = parse(`--- define-theme: editorial
accent: #e2725b
bg: #faf7f2

core/heading
  letterSpacing: -0.5px
core/text
  lineHeight: 1.75

--- meta
version: 1`);
      expect(doc.inlineThemes).toHaveLength(1);
      expect(doc.inlineThemes[0].name).toBe('editorial');
      expect(doc.inlineThemes[0].variables).toEqual({
        accent: '#e2725b',
        bg: '#faf7f2',
      });
      expect(doc.inlineThemes[0].css).toBe('core/heading\n  letterSpacing: -0.5px\ncore/text\n  lineHeight: 1.75');
    });

    it('should parse define-theme with CSS only (no variables)', () => {
      const doc = parse(`--- define-theme: minimal
core/heading
  fontWeight: 900

--- meta
version: 1`);
      expect(doc.inlineThemes).toHaveLength(1);
      expect(doc.inlineThemes[0].name).toBe('minimal');
      expect(doc.inlineThemes[0].variables).toBeUndefined();
      expect(doc.inlineThemes[0].css).toBe('core/heading\n  fontWeight: 900');
    });

    it('should parse multiple define-theme blocks', () => {
      const doc = parse(`--- define-theme: warm
accent: #e2725b

--- define-theme: cool
accent: #3b82f6

--- meta
version: 1`);
      expect(doc.inlineThemes).toHaveLength(2);
      expect(doc.inlineThemes[0].name).toBe('warm');
      expect(doc.inlineThemes[1].name).toBe('cool');
    });

    it('should error on define-theme without name', () => {
      const doc = parse(`--- define-theme
accent: red

--- meta
version: 1`);
      expect(doc.errors.some(e => e.message.includes('requires a name'))).toBe(true);
    });

    it('should warn on empty define-theme', () => {
      const doc = parse(`--- define-theme: empty

--- meta
version: 1`);
      expect(doc.errors.some(e => e.message.includes('Empty define-theme'))).toBe(true);
    });

    it('should not interfere with regular blocks', () => {
      const doc = parse(`--- define-theme: warm
accent: #e2725b

--- meta
version: 1

--- core/text

Hello world`);
      expect(doc.inlineThemes).toHaveLength(1);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/text');
      expect(doc.blocks[0].content).toBe('Hello world');
    });
  });

  describe('compiler', () => {
    it('should apply inline theme variables when activated', () => {
      const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b
bg: #faf7f2

--- theme: warm

--- meta
version: 1

--- core/text

Hello`);
      expect(result).toContain('--mkly-accent: #e2725b');
      expect(result).toContain('--mkly-bg: #faf7f2');
    });

    it('should apply inline theme CSS when activated', () => {
      const result = html(`--- use: core
--- define-theme: bold
core/heading
  fontWeight: 900

--- theme: bold

--- meta
version: 1

--- core/heading
level: 1

Title`);
      expect(result).toContain('font-weight: 900');
    });

    it('should not apply inline theme if not activated', () => {
      const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b

--- meta
version: 1

--- core/text

Hello`);
      expect(result).not.toContain('--mkly-accent: #e2725b');
    });

    it('should allow inline theme to be activated with fully-qualified name', () => {
      const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b

--- theme: inline/warm

--- meta
version: 1

--- core/text

Hello`);
      expect(result).toContain('--mkly-accent: #e2725b');
    });

    it('should not produce error for activated inline theme', () => {
      const errs = errors(`--- use: core
--- define-theme: warm
accent: #e2725b

--- theme: warm

--- meta
version: 1

--- core/text

Hello`);
      expect(errs.some(e => e.includes('Unknown theme'))).toBe(false);
    });

    it('should preserve inline theme definitions in HTML for round-trip', () => {
      const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b

--- theme: warm

--- meta
version: 1

--- core/text

Hello`);
      expect(result).toContain('<script type="text/mkly-defines">');
      expect(result).toContain('--- define-theme: warm');
      expect(result).toContain('accent: #e2725b');
    });

    it('should emit meta tag for active inline theme', () => {
      const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b

--- theme: warm

--- meta
version: 1

--- core/text

Hello`);
      expect(result).toContain('<meta name="mkly:theme" content="warm">');
    });
  });
});

describe('define-preset', () => {
  describe('parser', () => {
    it('should parse define-preset with CSS', () => {
      const doc = parse(`--- define-preset: round
core/card
  borderRadius: 20px
core/button.link
  borderRadius: 20px

--- meta
version: 1`);
      expect(doc.inlinePresets).toHaveLength(1);
      expect(doc.inlinePresets[0].name).toBe('round');
      expect(doc.inlinePresets[0].css).toBe('core/card\n  borderRadius: 20px\ncore/button.link\n  borderRadius: 20px');
    });

    it('should parse multiple define-preset blocks', () => {
      const doc = parse(`--- define-preset: round
core/card
  borderRadius: 20px

--- define-preset: tight
core/text
  lineHeight: 1.4

--- meta
version: 1`);
      expect(doc.inlinePresets).toHaveLength(2);
      expect(doc.inlinePresets[0].name).toBe('round');
      expect(doc.inlinePresets[1].name).toBe('tight');
    });

    it('should error on define-preset without name', () => {
      const doc = parse(`--- define-preset
core/card
  borderRadius: 20px

--- meta
version: 1`);
      expect(doc.errors.some(e => e.message.includes('requires a name'))).toBe(true);
    });

    it('should warn on empty define-preset', () => {
      const doc = parse(`--- define-preset: empty

--- meta
version: 1`);
      expect(doc.errors.some(e => e.message.includes('Empty define-preset'))).toBe(true);
    });
  });

  describe('compiler', () => {
    it('should apply inline preset CSS when activated', () => {
      const result = html(`--- use: core
--- define-preset: round
core/card
  borderRadius: 20px

--- preset: round

--- meta
version: 1

--- core/card
title: Test
url: https://example.com

Content`);
      expect(result).toContain('border-radius: 1.25rem');
    });

    it('should not apply inline preset if not activated', () => {
      const result = html(`--- use: core
--- define-preset: round
core/card
  borderRadius: 99px

--- meta
version: 1

--- core/card
title: Test
url: https://example.com

Content`);
      expect(result).not.toContain('border-radius: 99px');
    });

    it('should allow inline preset to be activated with fully-qualified name', () => {
      const result = html(`--- use: core
--- define-preset: round
core/card
  borderRadius: 99px

--- preset: inline/round

--- meta
version: 1

--- core/card
title: Test
url: https://example.com

Content`);
      expect(result).toContain('border-radius: 6.1875rem');
    });

    it('should not produce error for activated inline preset', () => {
      const errs = errors(`--- use: core
--- define-preset: round
core/card
  borderRadius: 20px

--- preset: round

--- meta
version: 1

--- core/text

Hello`);
      expect(errs.some(e => e.includes('Unknown preset'))).toBe(false);
    });

    it('should preserve inline preset definitions in HTML for round-trip', () => {
      const result = html(`--- use: core
--- define-preset: round
core/card
  borderRadius: 20px

--- preset: round

--- meta
version: 1

--- core/text

Hello`);
      expect(result).toContain('<script type="text/mkly-defines">');
      expect(result).toContain('--- define-preset: round');
    });
  });
});

describe('combined define-theme + define-preset', () => {
  it('should support both inline theme and preset in same document', () => {
    const result = html(`--- use: core
--- define-theme: warm
accent: #e2725b

--- define-preset: round
core/card
  borderRadius: 20px

--- theme: warm
--- preset: round

--- meta
version: 1

--- core/card
title: Test
url: https://example.com

Content`);
    expect(result).toContain('--mkly-accent: #e2725b');
    expect(result).toContain('border-radius: 1.25rem');
  });

  it('should apply inline preset after inline theme (preset wins)', () => {
    const result = html(`--- use: core
--- define-theme: themed
core/card
  borderRadius: 4px

--- define-preset: round
core/card
  borderRadius: 20px

--- theme: themed
--- preset: round

--- meta
version: 1

--- core/card
title: Test
url: https://example.com

Content`);
    const css = result.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    const lastRound = css.lastIndexOf('border-radius: 1.25rem');
    const themed = css.lastIndexOf('border-radius: 0.25rem');
    expect(lastRound).toBeGreaterThan(themed);
  });

  it('should coexist with kit themes/presets', () => {
    const result = html(`--- use: core
--- define-theme: custom
accent: #ff6600

--- theme: default
--- theme: custom

--- meta
version: 1

--- core/text

Hello`);
    // Both kit theme and inline theme should be applied
    expect(result).toContain('--mkly-accent: #ff6600');
  });
});

describe('round-trip', () => {
  it('should reconstruct define-theme blocks from compiled HTML', () => {
    const source = `--- use: core
--- define-theme: warm
accent: #e2725b
bg: #faf7f2

--- theme: warm

--- meta
version: 1

--- core/text

Hello`;
    const compiled = html(source);
    const { htmlToMkly } = require('../src/reverse/index');
    const reversed: string = htmlToMkly(compiled, { kits: { core: CORE_KIT } });
    expect(reversed).toContain('--- define-theme: warm');
    expect(reversed).toContain('accent: #e2725b');
    expect(reversed).toContain('bg: #faf7f2');
    expect(reversed).toContain('--- theme: warm');
  });

  it('should reconstruct define-preset blocks from compiled HTML', () => {
    const source = `--- use: core
--- define-preset: round
core/card
  borderRadius: 20px

--- preset: round

--- meta
version: 1

--- core/text

Hello`;
    const compiled = html(source);
    const { htmlToMkly } = require('../src/reverse/index');
    const reversed: string = htmlToMkly(compiled, { kits: { core: CORE_KIT } });
    expect(reversed).toContain('--- define-preset: round');
    expect(reversed).toContain('--- preset: round');
  });

  it('should round-trip define-theme through parse → compile → reverse → parse', () => {
    const source = `--- use: core

--- define-theme: warm
accent: #e2725b
bg: #faf7f2

--- theme: warm

--- meta
version: 1

--- core/text

Hello world`;
    const compiled = html(source);
    const { htmlToMkly } = require('../src/reverse/index');
    const reversed: string = htmlToMkly(compiled, { kits: { core: CORE_KIT } });
    const reparsed = parse(reversed);

    expect(reparsed.inlineThemes).toHaveLength(1);
    expect(reparsed.inlineThemes[0].name).toBe('warm');
    expect(reparsed.inlineThemes[0].variables?.accent).toBe('#e2725b');
    expect(reparsed.themes).toContain('warm');
  });
});
