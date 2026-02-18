import { describe, it, expect } from 'bun:test';
import { mkly, CORE_KIT, htmlToMkly } from '../src/index';
import { NEWSLETTER_KIT } from '../../mkly-kits/newsletter/src';

const KITS = { core: CORE_KIT, newsletter: NEWSLETTER_KIT };

/**
 * Compile → reverse → recompile and verify no fatal errors.
 * This is the critical path for EditablePreview in the editor.
 */
function roundTrip(source: string) {
  const compiled = mkly(source, { kits: KITS, sourceMap: true });
  const fatalCompile = compiled.errors.filter(e => e.severity === 'error');
  if (fatalCompile.length > 0) {
    throw new Error(
      `Initial compile failed: ${fatalCompile.map(e => `[${e.line}] ${e.message}`).join('; ')}\n\nSource:\n${source}`,
    );
  }

  const reversed = htmlToMkly(compiled.html);
  const recompiled = mkly(reversed, { kits: KITS, sourceMap: true });
  const fatalRecompile = recompiled.errors.filter(e => e.severity === 'error');

  return { compiled, reversed, recompiled, fatalRecompile };
}

// ===== Style Block Round-Trip =====

describe('round-trip: style blocks', () => {
  it('round-trips document with style block', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/heading',
      '  color: #ff0000',
      '  font-size: 24px',
      '',
      '--- core/heading',
      'level: 2',
      'Styled Heading',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with multiple styled block types', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/heading',
      '  color: #ff0000',
      'core/text',
      '  padding: 8px',
      '',
      '--- core/heading',
      'level: 2',
      'Title',
      '',
      '--- core/text',
      'Content here',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with sub-element styles', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/card',
      '  padding: 16px',
      '  .img',
      '    object-fit: cover',
      '',
      '--- core/card',
      'title: My Card',
      'img: https://example.com/photo.jpg',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with variables', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'accent: #e2725b',
      'core/heading',
      '  color: $accent',
      '',
      '--- core/heading',
      'level: 1',
      'Variable Styled',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });
});

// ===== Labeled Block Round-Trip =====

describe('round-trip: labeled blocks', () => {
  it('round-trips document with labeled block', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/card:hero',
      '  background-color: #fef3c7',
      '',
      '--- core/card: hero',
      'title: Hero Card',
    ].join('\n');

    const { compiled, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    // The compiled HTML should have the BEM modifier class
    expect(compiled.html).toContain('mkly-core-card--hero');
  });

  it('round-trips labeled and unlabeled blocks together', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/card:hero',
      '  background-color: #fef3c7',
      'core/card',
      '  padding: 16px',
      '',
      '--- core/card: hero',
      'title: Hero Card',
      '',
      '--- core/card',
      'title: Regular Card',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips labeled block with sub-element style', () => {
    const source = [
      '--- use: core',
      '--- use: newsletter',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'newsletter/item:s1',
      '  .link',
      '    color: #1d4ed8',
      '',
      '--- newsletter/item: s1',
      'title: Article',
      'url: https://example.com',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });
});

// ===== Class Annotation Round-Trip =====

describe('round-trip: class annotations', () => {
  it('round-trips text block with class annotations', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/text',
      '  >.s1',
      '    color: #e2725b',
      '',
      '--- core/text',
      '- Item one {.s1}',
      '- Item two',
    ].join('\n');

    const { compiled, reversed, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    // Compiled HTML should have the class
    expect(compiled.html).toContain('class="s1"');
    // Reversed source should preserve the annotation
    expect(reversed).toContain('{.s1}');
  });

  it('round-trips multiple class annotations', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/text',
      '  >.s1',
      '    color: red',
      '  >.s2',
      '    color: blue',
      '',
      '--- core/text',
      '- Item A {.s1}',
      '- Item B {.s2}',
      '- Item C',
    ].join('\n');

    const { compiled, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    expect(compiled.html).toContain('class="s1"');
    expect(compiled.html).toContain('class="s2"');
  });

  it('round-trips labeled tipOfTheDay class-target styling', () => {
    const source = [
      '--- use: core',
      '--- use: newsletter',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'newsletter/tipOfTheDay:s1',
      '  >.s2',
      '    color: #e2725b',
      '',
      '--- newsletter/tipOfTheDay: s1',
      'title: Tutorial: The 3-Layer Prompt Framework',
      '',
      'Layer 1 paragraph.',
      '',
      'Layer 2 paragraph {.s2}',
      '',
      'Layer 3 paragraph.',
    ].join('\n');

    const { compiled, reversed, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    expect(compiled.html).toContain('mkly-newsletter-tipOfTheDay--s1');
    expect(compiled.html).toContain('class="s2"');
    expect(compiled.html).toContain('.mkly-newsletter-tipOfTheDay--s1 .s2');
    // reverse may currently fallback to core/html for this block, but class target must survive.
    expect(reversed).toContain('class="s2"');
  });
});

// ===== Multi-Block Complex Documents =====

describe('round-trip: complex documents', () => {
  it('round-trips multi-block document with various styles', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'core/heading',
      '  color: #1a1a1a',
      '  font-weight: 800',
      'core/text',
      '  padding: 8px',
      'core/button',
      '  background-color: #e2725b',
      '',
      '--- core/heading',
      'level: 1',
      'Welcome',
      '',
      '--- core/text',
      'This is a styled newsletter.',
      '',
      '--- core/divider',
      '',
      '--- core/button',
      'url: https://example.com',
      'label: Read More',
      '',
      '--- core/spacer',
      'height: 32',
      '',
      '--- core/text',
      'Footer text here.',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips newsletter document', () => {
    const source = [
      '--- use: core',
      '--- use: newsletter',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/header',
      'title: My Newsletter',
      '',
      '--- core/heading',
      'level: 2',
      'Top Stories',
      '',
      '--- newsletter/item',
      'title: Breaking News',
      'url: https://example.com/1',
      'description: Something happened',
      '',
      '--- newsletter/item',
      'title: Feature Story',
      'url: https://example.com/2',
      'description: An in-depth look',
      '',
      '--- core/divider',
      '',
      '--- core/footer',
      'Built with mkly',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with non-breaking spaces', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/text',
      'Hello\\~World',
    ].join('\n');

    const { compiled, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    // HTML should contain &nbsp;
    expect(compiled.html).toContain('&nbsp;');
  });

  it('round-trips document with markdown formatting', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/text',
      'This is **bold** and *italic* and `code`.',
      '',
      '--- core/text',
      '- Item one',
      '- Item **bold** two',
      '- Item [link](https://example.com) three',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });
});

// ===== Edge Cases =====

describe('round-trip: edge cases', () => {
  it('round-trips document with only a heading', () => {
    const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/heading\nlevel: 1\nSolo Heading';
    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with only a divider', () => {
    const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/divider';
    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with empty text block', () => {
    const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text';
    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with special characters in content', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/text',
      'Price: $99.99 & 20% off <limited>',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips document with quote and attribution', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/quote',
      'author: Albert Einstein',
      'Imagination is more important than knowledge.',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips user-defined variables (non-registered names)', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- style',
      'primary: #1a1a1a',
      'core/text',
      '  color: $primary',
      '',
      '--- core/text',
      'Styled with user variable',
    ].join('\n');

    const { compiled, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    // The compiled HTML must have --mkly-primary as a custom property (CSS is embedded in HTML)
    expect(compiled.html).toContain('--mkly-primary');
  });

  it('round-trips code block', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/code',
      'lang: ts',
      'function hello() {',
      '  console.log("hi");',
      '}',
    ].join('\n');

    const { fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
  });

  it('round-trips heading with HTML entities (ampersand)', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/heading',
      'level: 2',
      'Tom & Jerry',
    ].join('\n');

    const { reversed, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    expect(reversed).toContain('Tom & Jerry');
    expect(reversed).not.toContain('&amp;');
  });

  it('round-trips button label with HTML entities', () => {
    const source = [
      '--- use: core',
      '',
      '--- meta',
      'version: 1',
      '',
      '--- core/button',
      'url: https://example.com',
      'label: Buy & Save',
    ].join('\n');

    const { reversed, fatalRecompile } = roundTrip(source);
    expect(fatalRecompile).toHaveLength(0);
    expect(reversed).toContain('label: Buy & Save');
  });
});
