import { describe, it, expect } from 'bun:test';
import { parseMklyStyle, themeToCSS, mergeVariables, STYLE_VARIABLES, VARIABLE_TO_CSS } from '../src/style-parser';
import { parse } from '../src/parser';
import { mkly, CORE_KIT } from '../src/index';
import { parseStyleGraph, serializeStyleGraph, compileStyleGraphToCSS } from '../src/style-graph';

describe('mkly CSS style parser', () => {
  describe('parseMklyStyle (legacy brace syntax)', () => {
    it('should parse top-level variables', () => {
      const result = parseMklyStyle(`
        accent: #ff0000
        fontBody: Georgia, serif
      `);
      expect(result.variables).toEqual({
        accent: '#ff0000',
        fontBody: 'Georgia, serif',
      });
      expect(result.css).toContain('--mkly-accent: #ff0000;');
      expect(result.css).toContain('--mkly-font-body: Georgia, serif;');
    });

    it('should parse block rules', () => {
      const result = parseMklyStyle(`
heading {
  color: red
  font-size: 2em
}
      `);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
      expect(result.css).toContain('font-size: 2em;');
    });

    it('should handle sub-element selectors with dot notation', () => {
      const result = parseMklyStyle(`
card.img {
  border-radius: 12px
}
      `);
      expect(result.css).toContain('.mkly-card__img {');
      expect(result.css).toContain('border-radius: 12px;');
    });

    it('should handle pseudo-selectors', () => {
      const result = parseMklyStyle(`
card:hover {
  transform: translateY(-2px)
}
      `);
      expect(result.css).toContain('.mkly-card:hover {');
      expect(result.css).toContain('transform: translateY(-2px);');
    });

    it('should resolve $variable references', () => {
      const result = parseMklyStyle(`
accent: #e2725b

heading {
  color: $accent
  border-color: $accent
}
      `);
      expect(result.css).toContain('color: var(--mkly-accent);');
      expect(result.css).toContain('border-color: var(--mkly-accent);');
    });

    it('should resolve unknown variables with kebab-case', () => {
      const result = parseMklyStyle(`
heading {
  color: $brandColor
}
      `);
      expect(result.css).toContain('color: var(--mkly-brand-color);');
    });

    it('should skip comments and blank lines', () => {
      const result = parseMklyStyle(`
// Theme colors
accent: #ff0000

// Heading styles
heading {
  // Make it bold
  font-weight: 900
}
      `);
      expect(result.variables).toEqual({ accent: '#ff0000' });
      expect(result.css).toContain('font-weight: 900;');
      expect(result.css).not.toContain('//');
    });

    it('should handle unclosed rules gracefully', () => {
      const result = parseMklyStyle(`
heading {
  color: red
      `);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
    });

    it('should return empty for empty input', () => {
      const result = parseMklyStyle('');
      expect(result.css).toBe('');
      expect(result.variables).toEqual({});
    });

    it('should handle multiple rules and variables together', () => {
      const result = parseMklyStyle(`
accent: #3b82f6
radius: 0px

heading {
  color: $accent
  letter-spacing: -0.5px
}

card {
  border: none
  box-shadow: 0 2px 8px rgba(0,0,0,0.1)
  border-radius: $radius
}

card:hover {
  transform: translateY(-2px)
}
      `);
      expect(result.variables).toEqual({ accent: '#3b82f6', radius: '0px' });
      expect(result.css).toContain('.mkly-document {');
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('.mkly-card {');
      expect(result.css).toContain('.mkly-card:hover {');
      expect(result.css).toContain('var(--mkly-accent)');
      expect(result.css).toContain('var(--mkly-radius)');
    });
  });

  describe('parseMklyStyle (v2 indentation syntax)', () => {
    it('should parse top-level variables', () => {
      const result = parseMklyStyle(`accent: #ff0000
fontBody: Georgia, serif`);
      expect(result.variables).toEqual({
        accent: '#ff0000',
        fontBody: 'Georgia, serif',
      });
      expect(result.css).toContain('--mkly-accent: #ff0000;');
      expect(result.css).toContain('--mkly-font-body: Georgia, serif;');
    });

    it('should parse block selectors with indented properties', () => {
      const result = parseMklyStyle(`heading
  color: red
  fontSize: 2em`);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
      expect(result.css).toContain('font-size: 2em;');
    });

    it('should convert camelCase properties to kebab-case', () => {
      const result = parseMklyStyle(`heading
  letterSpacing: -0.5px
  borderRadius: 8px
  backgroundColor: red`);
      expect(result.css).toContain('letter-spacing: -0.5px;');
      expect(result.css).toContain('border-radius: 8px;');
      expect(result.css).toContain('background-color: red;');
    });

    it('should handle sub-element with dot notation', () => {
      const result = parseMklyStyle(`card
  borderRadius: 12px
  .img
    objectFit: cover`);
      expect(result.css).toContain('.mkly-card {');
      expect(result.css).toContain('border-radius: 12px;');
      expect(result.css).toContain('.mkly-card__img {');
      expect(result.css).toContain('object-fit: cover;');
    });

    it('should handle pseudo-selectors', () => {
      const result = parseMklyStyle(`card
  padding: 16px
  :hover
    transform: translateY(-2px)`);
      expect(result.css).toContain('.mkly-card {');
      expect(result.css).toContain('padding: 16px;');
      expect(result.css).toContain('.mkly-card:hover {');
      expect(result.css).toContain('transform: translateY(-2px);');
    });

    it('should resolve $variable references', () => {
      const result = parseMklyStyle(`accent: #e2725b

heading
  color: $accent
  borderColor: $accent`);
      expect(result.css).toContain('color: var(--mkly-accent);');
      expect(result.css).toContain('border-color: var(--mkly-accent);');
    });

    it('should skip comments and blank lines', () => {
      const result = parseMklyStyle(`// Theme colors
accent: #ff0000

// Heading styles
heading
  // Make it bold
  fontWeight: 900`);
      expect(result.variables).toEqual({ accent: '#ff0000' });
      expect(result.css).toContain('font-weight: 900;');
      expect(result.css).not.toContain('//');
    });

    it('should handle multiple blocks with variables', () => {
      const result = parseMklyStyle(`accent: #3b82f6
radius: 0px

heading
  color: $accent
  letterSpacing: -0.5px

card
  border: none
  borderRadius: $radius

card
  :hover
    transform: translateY(-2px)`);
      expect(result.variables).toEqual({ accent: '#3b82f6', radius: '0px' });
      expect(result.css).toContain('.mkly-document {');
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('.mkly-card {');
      expect(result.css).toContain('.mkly-card:hover {');
      expect(result.css).toContain('var(--mkly-accent)');
      expect(result.css).toContain('var(--mkly-radius)');
    });

    it('should handle mixed sub-elements and pseudos under one block', () => {
      const result = parseMklyStyle(`card
  borderRadius: 8px
  .img
    objectFit: cover
    borderRadius: 0
  .body
    padding: 16px
  :hover
    boxShadow: 0 4px 12px rgba(0,0,0,0.1)`);
      expect(result.css).toContain('.mkly-card {');
      expect(result.css).toContain('.mkly-card__img {');
      expect(result.css).toContain('.mkly-card__body {');
      expect(result.css).toContain('.mkly-card:hover {');
    });

    it('should keep kebab-case properties as-is', () => {
      const result = parseMklyStyle(`heading
  font-size: 2em
  line-height: 1.2`);
      expect(result.css).toContain('font-size: 2em;');
      expect(result.css).toContain('line-height: 1.2;');
    });
  });

  describe('auto-detection', () => {
    it('should use legacy parser when braces are present', () => {
      const result = parseMklyStyle(`heading {\n  color: red\n}`);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
    });

    it('should use v2 parser when no braces are present', () => {
      const result = parseMklyStyle(`heading\n  color: red`);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
    });

    it('should not false-detect braces in comments', () => {
      const result = parseMklyStyle(`// heading {\nheading\n  color: red`);
      expect(result.css).toContain('.mkly-heading {');
      expect(result.css).toContain('color: red;');
    });
  });

  describe('STYLE_VARIABLES', () => {
    it('should export all known variables', () => {
      expect(STYLE_VARIABLES.length).toBe(Object.keys(VARIABLE_TO_CSS).length);
      for (const v of STYLE_VARIABLES) {
        expect(VARIABLE_TO_CSS[v.name]).toBe(v.cssVar);
        expect(v.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('themeToCSS', () => {
    it('should convert theme object to CSS custom properties', () => {
      const css = themeToCSS({ accent: '#ff0000', fontBody: 'Georgia' });
      expect(css).toContain('.mkly-document {');
      expect(css).toContain('--mkly-accent: #ff0000;');
      expect(css).toContain('--mkly-font-body: Georgia;');
    });

    it('should handle unknown keys with kebab conversion', () => {
      const css = themeToCSS({ customColor: 'blue' });
      expect(css).toContain('--mkly-custom-color: blue;');
    });

    it('should return empty string for empty theme', () => {
      expect(themeToCSS({})).toBe('');
    });

    it('should skip empty values', () => {
      const css = themeToCSS({ accent: '#ff0000', fontBody: '' });
      expect(css).toContain('--mkly-accent');
      expect(css).not.toContain('--mkly-font-body');
    });
  });

  describe('mergeVariables', () => {
    it('should merge multiple sources', () => {
      const result = mergeVariables(
        { accent: 'red', fontBody: 'Arial' },
        { accent: 'blue' },
      );
      expect(result).toEqual({ accent: 'blue', fontBody: 'Arial' });
    });

    it('should skip undefined sources', () => {
      const result = mergeVariables(undefined, { accent: 'red' }, undefined);
      expect(result).toEqual({ accent: 'red' });
    });
  });
});

describe('--- style block parsing', () => {
  it('should extract style blocks from document', () => {
    const doc = parse(`
--- meta
title: Test

--- style
accent: #ff0000

heading {
  color: $accent
}

--- core/text

Hello world
    `);
    expect(doc.styles).toHaveLength(1);
    expect(doc.styles[0]).toContain('accent: #ff0000');
    expect(doc.styles[0]).toContain('heading {');
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].blockType).toBe('core/text');
  });

  it('should handle multiple style blocks', () => {
    const doc = parse(`
--- style
accent: red

--- core/text

Hello

--- style
heading {
  color: blue
}
    `);
    expect(doc.styles).toHaveLength(2);
    expect(doc.styles[0]).toContain('accent: red');
    expect(doc.styles[1]).toContain('heading {');
  });

  it('should preserve comments in style blocks', () => {
    const doc = parse(`
--- style
// Theme colors
accent: red
    `);
    expect(doc.styles[0]).toContain('// Theme colors');
  });

  it('should not create a block for style', () => {
    const doc = parse(`--- style\naccent: red\n\n--- core/text\n\nHi`);
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].blockType).toBe('core/text');
  });
});

describe('style integration in compiler', () => {
  it('should compile --- style blocks to CSS in output', () => {
    const result = mkly(`
--- meta
version: 1

--- style
accent: #3b82f6

heading {
  letter-spacing: -1px
}

--- core/heading
level: 1
text: Hello
    `);
    expect(result.html).toContain('--mkly-accent: #3b82f6;');
    expect(result.html).toContain('.mkly-heading {');
    expect(result.html).toContain('letter-spacing: -0.0625rem;');
  });

  it('should apply theme config to output', () => {
    const result = mkly(`--- meta\nversion: 1\n\n--- core/text\n\nHello`, {
      theme: { accent: '#ff0000', radius: '0px' },
    });
    expect(result.html).toContain('--mkly-accent: #ff0000;');
    expect(result.html).toContain('--mkly-radius: 0;');
  });

  it('should apply style block overrides after theme config', () => {
    const result = mkly(`
--- meta
version: 1

--- style
accent: #00ff00

--- core/text

Hello
    `, {
      theme: { accent: '#ff0000' },
    });
    expect(result.html).toContain('--mkly-accent: #ff0000;');
    expect(result.html).toContain('--mkly-accent: #00ff00;');

    const themeIdx = result.html.indexOf('--mkly-accent: #ff0000;');
    const styleIdx = result.html.indexOf('--mkly-accent: #00ff00;');
    expect(styleIdx).toBeGreaterThan(themeIdx);
  });

  it('should handle $variable references to known variables', () => {
    const result = mkly(`
--- meta
version: 1

--- style
accent: #e2725b

card {
  border-color: $accent
  font-family: $fontBody
}

--- core/card
link: https://example.com

## Test Card

Content.
    `);
    expect(result.html).toContain('border-color: var(--mkly-accent);');
    expect(result.html).toContain('font-family: var(--mkly-font-body);');
  });

  it('should handle sub-element and pseudo selectors in style blocks', () => {
    const result = mkly(`
--- meta
version: 1

--- style
card.img {
  border-radius: 0
}

card:hover {
  opacity: 0.9
}

--- core/card
image: https://example.com/photo.jpg

## Card

Text.
    `);
    expect(result.html).toContain('.mkly-card__img {');
    expect(result.html).toContain('.mkly-card:hover {');
  });
});

describe('namespaced selectors in style blocks', () => {
  it('should handle namespaced block selectors (v2 syntax)', () => {
    const result = parseMklyStyle(`core/heading
  letterSpacing: -0.5px
  color: red`);
    expect(result.css).toContain('.mkly-core-heading {');
    expect(result.css).toContain('letter-spacing: -0.5px;');
    expect(result.css).toContain('color: red;');
  });

  it('should handle namespaced sub-element selectors', () => {
    const result = parseMklyStyle(`core/card
  borderRadius: 12px
  .img
    objectFit: cover`);
    expect(result.css).toContain('.mkly-core-card {');
    expect(result.css).toContain('.mkly-core-card__img {');
  });

  it('should handle namespaced pseudo-selectors', () => {
    const result = parseMklyStyle(`core/card
  padding: 16px
  :hover
    transform: translateY(-2px)`);
    expect(result.css).toContain('.mkly-core-card {');
    expect(result.css).toContain('.mkly-core-card:hover {');
  });

  it('should handle namespaced selectors in legacy brace syntax', () => {
    const result = parseMklyStyle(`core/heading {
  color: red
}`);
    expect(result.css).toContain('.mkly-core-heading {');
  });

  it('should handle namespaced sub-element in brace syntax', () => {
    const result = parseMklyStyle(`core/card.img {
  border-radius: 0
}`);
    expect(result.css).toContain('.mkly-core-card__img {');
  });

  it('should handle namespaced pseudo in brace syntax', () => {
    const result = parseMklyStyle(`core/card:hover {
  opacity: 0.9
}`);
    expect(result.css).toContain('.mkly-core-card:hover {');
  });

  it('should compile namespaced style selectors end-to-end', () => {
    const result = mkly(`
--- use: core
--- meta
version: 1

--- style
core/heading
  letterSpacing: -0.5px

--- core/heading
level: 1
text: Hello
    `, { kits: { core: CORE_KIT } });
    expect(result.html).toContain('.mkly-core-heading {');
    expect(result.html).toContain('letter-spacing: -0.0313rem;');
  });
});

describe('StyleGraph parser (v2 indented)', () => {
  describe('combined sub-element + pseudo', () => {
    it('should parse .img:hover', () => {
      const graph = parseStyleGraph(`card\n  .img:hover\n    opacity: 0.8`);
      expect(graph.rules).toHaveLength(1);
      expect(graph.rules[0].blockType).toBe('card');
      expect(graph.rules[0].target).toBe('img:hover');
      expect(graph.rules[0].properties).toEqual({ opacity: '0.8' });
    });

    it('should compile .img:hover to correct CSS selector', () => {
      const graph = parseStyleGraph(`core/card\n  .img:hover\n    opacity: 0.8`);
      const css = compileStyleGraphToCSS(graph);
      expect(css).toContain('.mkly-core-card__img:hover {');
      expect(css).toContain('opacity: 0.8;');
    });

    it('should parse .link:hover combined', () => {
      const graph = parseStyleGraph(`core/button\n  .link:hover\n    color: red`);
      expect(graph.rules[0].target).toBe('link:hover');
    });

    it('should serialize combined sub+pseudo back correctly', () => {
      const graph = parseStyleGraph(`card\n  .img:hover\n    opacity: 0.8`);
      const serialized = serializeStyleGraph(graph);
      expect(serialized).toContain('.img:hover');
      expect(serialized).toContain('  opacity: 0.8');
    });
  });

  describe('double-colon pseudo-elements', () => {
    it('should parse ::before pseudo-element on self', () => {
      const graph = parseStyleGraph(`card\n  ::before\n    content: ""`);
      expect(graph.rules).toHaveLength(1);
      expect(graph.rules[0].target).toBe('self::before');
      expect(graph.rules[0].properties).toEqual({ content: '""' });
    });

    it('should parse ::after pseudo-element', () => {
      const graph = parseStyleGraph(`card\n  ::after\n    content: ""\n    display: block`);
      expect(graph.rules[0].target).toBe('self::after');
      expect(graph.rules[0].properties).toEqual({ content: '""', display: 'block' });
    });

    it('should compile ::before to correct CSS', () => {
      const graph = parseStyleGraph(`core/card\n  ::before\n    content: ""\n    position: absolute`);
      const css = compileStyleGraphToCSS(graph);
      expect(css).toContain('.mkly-core-card::before {');
    });

    it('should parse .img::after combined sub+pseudo', () => {
      const graph = parseStyleGraph(`card\n  .img::after\n    content: ""`);
      expect(graph.rules[0].target).toBe('img::after');
    });

    it('should compile .img::after correctly', () => {
      const graph = parseStyleGraph(`core/card\n  .img::after\n    content: ""`);
      const css = compileStyleGraphToCSS(graph);
      expect(css).toContain('.mkly-core-card__img::after {');
    });
  });

  describe('raw CSS selectors', () => {
    it('should parse .my-class as raw CSS', () => {
      const graph = parseStyleGraph(`.my-class\n  color: red\n  font-size: 16px`);
      expect(graph.rules).toHaveLength(1);
      expect(graph.rules[0].blockType).toBe('__raw');
      expect(graph.rules[0].target).toBe('.my-class');
      expect(graph.rules[0].properties).toEqual({ color: 'red', 'font-size': '16px' });
    });

    it('should parse #my-id as raw CSS', () => {
      const graph = parseStyleGraph(`#my-id\n  background: blue`);
      expect(graph.rules[0].blockType).toBe('__raw');
      expect(graph.rules[0].target).toBe('#my-id');
    });

    it('should parse attribute selectors as raw CSS', () => {
      const graph = parseStyleGraph(`[data-theme="dark"]\n  background: #111`);
      expect(graph.rules[0].blockType).toBe('__raw');
      expect(graph.rules[0].target).toBe('[data-theme="dark"]');
    });

    it('should parse * (universal) selector as raw CSS', () => {
      const graph = parseStyleGraph(`*\n  box-sizing: border-box`);
      expect(graph.rules[0].blockType).toBe('__raw');
      expect(graph.rules[0].target).toBe('*');
    });

    it('should compile raw CSS with selector directly', () => {
      const graph = parseStyleGraph(`.custom-btn\n  padding: 12px 24px\n  border-radius: 8px`);
      const css = compileStyleGraphToCSS(graph);
      expect(css).toContain('.custom-btn {');
      expect(css).toContain('padding: 12px 24px;');
      expect(css).toContain('border-radius: 8px;');
    });

    it('should not apply text-align expansion to raw selectors', () => {
      const graph = parseStyleGraph(`.my-img\n  text-align: center`);
      const css = compileStyleGraphToCSS(graph);
      expect(css).toContain('text-align: center;');
      expect(css).not.toContain('margin-left: auto;');
    });

    it('should mix raw CSS with block rules', () => {
      const graph = parseStyleGraph(`accent: red\n\ncard\n  padding: 16px\n\n.custom-banner\n  background: blue`);
      expect(graph.variables).toHaveLength(1);
      expect(graph.variables[0]).toEqual({ name: 'accent', value: 'red' });
      const blockRule = graph.rules.find(r => r.blockType === 'card');
      expect(blockRule).toBeDefined();
      expect(blockRule!.properties).toEqual({ padding: '16px' });
      const rawRule = graph.rules.find(r => r.blockType === '__raw');
      expect(rawRule).toBeDefined();
      expect(rawRule!.target).toBe('.custom-banner');
      expect(rawRule!.properties).toEqual({ background: 'blue' });
    });

    it('should serialize raw CSS rules', () => {
      const graph = parseStyleGraph(`.my-class\n  color: red\n\n.other\n  padding: 8px`);
      const serialized = serializeStyleGraph(graph);
      expect(serialized).toContain('.my-class');
      expect(serialized).toContain('  color: red');
      expect(serialized).toContain('.other');
      expect(serialized).toContain('  padding: 8px');
    });

    it('should round-trip raw CSS through parse → serialize → parse', () => {
      const source = `card\n  padding: 16px\n\n.custom-class\n  color: red\n  font-size: 14px`;
      const graph1 = parseStyleGraph(source);
      const serialized = serializeStyleGraph(graph1);
      const graph2 = parseStyleGraph(serialized);
      expect(graph2.rules).toHaveLength(graph1.rules.length);
      for (let i = 0; i < graph1.rules.length; i++) {
        expect(graph2.rules[i].blockType).toBe(graph1.rules[i].blockType);
        expect(graph2.rules[i].target).toBe(graph1.rules[i].target);
        expect(graph2.rules[i].properties).toEqual(graph1.rules[i].properties);
      }
    });
  });

  describe('label selectors', () => {
    it('should parse core/card:hero as label', () => {
      const graph = parseStyleGraph(`core/card:hero\n  background: gold`);
      expect(graph.rules).toHaveLength(1);
      expect(graph.rules[0].blockType).toBe('core/card');
      expect(graph.rules[0].label).toBe('hero');
      expect(graph.rules[0].target).toBe('self');
    });

    it('should NOT parse card:hover as label (no kit prefix)', () => {
      const graph = parseStyleGraph(`card:hover\n  opacity: 0.9`);
      // Without kit prefix, "card:hover" at indent 0 goes through decomposeSelector
      // which treats it as pseudo since it has no / in "card"
      expect(graph.rules[0].blockType).toBe('card');
      expect(graph.rules[0].target).toBe('self:hover');
      expect(graph.rules[0].label).toBeUndefined();
    });
  });

  describe('end-to-end compilation with raw CSS', () => {
    it('should compile document with raw CSS in style block', () => {
      const result = mkly(`
--- use: core
--- meta
version: 1

--- style
core/heading
  letter-spacing: -0.5px

.custom-highlight
  background: yellow
  padding: 4px 8px

--- core/heading
level: 1
text: Hello
      `, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('.mkly-core-heading {');
      expect(result.html).toContain('letter-spacing: -0.0313rem;');
      expect(result.html).toContain('.custom-highlight {');
      expect(result.html).toContain('background: yellow;');
      expect(result.html).toContain('padding: 0.25rem 0.5rem;');
    });
  });

  describe('AI slop resilience', () => {
    it('should strip inline // comments from variable values', () => {
      const graph = parseStyleGraph(`primary: #4A3728 // Dark brown\naccent: #D4A574 // Golden tan`);
      expect(graph.variables[0].value).toBe('#4A3728');
      expect(graph.variables[1].value).toBe('#D4A574');
    });

    it('should strip inline // comments from property values', () => {
      const graph = parseStyleGraph(`core/heading\n  color: #333 // Dark grey`);
      expect(graph.rules[0].properties['color']).toBe('#333');
    });

    it('should not strip // inside URLs (no space after //)', () => {
      const graph = parseStyleGraph(`bg: url(https://example.com/img.png)`);
      expect(graph.variables[0].value).toBe('url(https://example.com/img.png)');
    });

    it('should warn about Sass functions', () => {
      const graph = parseStyleGraph(`core/card\n  background: darken(#fff, 10%)`);
      expect(graph.warnings).toBeDefined();
      expect(graph.warnings![0].message).toContain('darken()');
      expect(graph.warnings![0].severity).toBe('warning');
    });

    it('should warn about HTML element names used as block selectors', () => {
      const graph = parseStyleGraph(`body\n  bg: #fff\n  fg: #333`);
      expect(graph.warnings).toBeDefined();
      expect(graph.warnings![0].message).toContain('HTML element');
    });

    it('should reset target to self when property appears at block base indent after sub-element', () => {
      const graph = parseStyleGraph(`newsletter/featured\n  .source\n    fg: red\n  padding: 32px`);
      // .source rule should have only fg
      const sourceRule = graph.rules.find(r => r.target === 'source');
      expect(sourceRule?.properties).toEqual({ fg: 'red' });
      // padding should be on self
      const selfRule = graph.rules.find(r => r.target === 'self');
      expect(selfRule?.properties['padding']).toBe('32px');
    });

    it('should NOT reset target for block-level compound selectors like card:hover', () => {
      const graph = parseStyleGraph(`card:hover\n  opacity: 0.9`);
      expect(graph.rules[0].blockType).toBe('card');
      expect(graph.rules[0].target).toBe('self:hover');
      expect(graph.rules[0].properties['opacity']).toBe('0.9');
    });

    it('should strip inline comments in legacy brace syntax', () => {
      const graph = parseStyleGraph(`primary: #4A3728 // brown\ncore/card {\n  color: #fff // white\n}`);
      expect(graph.variables[0].value).toBe('#4A3728');
      expect(graph.rules[0].properties['color']).toBe('#fff');
    });

    it('should strip inline comments in style-parser (theme/preset)', () => {
      const result = parseMklyStyle(`accent: #e2725b // coral\nfontBody: Georgia, serif // classic`);
      expect(result.variables.accent).toBe('#e2725b');
      expect(result.variables.fontBody).toBe('Georgia, serif');
    });
  });
});
