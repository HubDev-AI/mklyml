import { describe, it, expect } from 'bun:test';
import { mkly, parse, compile, BlockRegistry, createRegistry, CORE_KIT, defineKit } from '../src/index';
import type { BlockDefinition, MklyPreset } from '../src/types';
import type { CompileWithKitsOptions } from '../src/compiler';

function html(source: string, options?: Omit<CompileWithKitsOptions, 'kits'> & { kits?: CompileWithKitsOptions['kits'] }): string {
  return mkly(source, { kits: { core: CORE_KIT }, ...options }).html;
}

describe('compiler', () => {
  describe('basic block compilation', () => {
    it('should compile a simple text block', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nThis is content`);
      expect(result).toContain('This is content');
      expect(result).toContain('<div');
    });

    it('should compile block with properties', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/image\nsrc: test.png\nalt: Test`);
      expect(result).toContain('test.png');
      expect(result).toContain('Test');
      expect(result).toContain('<img');
    });

    it('should compile multiple blocks', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\nFirst\n\n--- core/text\nSecond`);
      expect(result).toContain('First');
      expect(result).toContain('Second');
    });
  });

  describe('unknown blocks', () => {
    it('should render unknown blocks as generic div', () => {
      const source = `--- meta\nversion: 1\n\n--- unknown\nContent here`;
      const doc = parse(source);
      const registry = new BlockRegistry();
      const result = compile(doc, registry);
      expect(result.html).toContain('data-block="unknown"');
      expect(result.html).toContain('Content here');
    });

    it('should report unknown block as warning', () => {
      const source = `--- meta\nversion: 1\n\n--- unknown\nContent here`;
      const doc = parse(source);
      const registry = new BlockRegistry();
      const result = compile(doc, registry);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Unknown block type'))).toBe(true);
    });

    it('should not parse invalid block names with special characters', () => {
      const source = `--- meta\nversion: 1\n\n--- <script>\nContent`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(0);
    });
  });

  describe('container blocks', () => {
    it('should replace {{children}} placeholder with child blocks', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/section\n\n--- core/card\nCard content\n\n--- /core/section`);
      expect(result).toContain('Card content');
      expect(result).not.toContain('{{children}}');
    });

    it('should handle empty containers', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/section\n\n--- /core/section`);
      expect(result).not.toContain('{{children}}');
    });

    it('should compile container with custom block definition', () => {
      const registry = new BlockRegistry();
      const container: BlockDefinition = {
        name: 'container',
        contentMode: 'properties',
        isContainer: true,
        compile: () => '<div class="container">{{children}}</div>',
      };
      registry.register(container);

      const source = `--- meta\nversion: 1\n\n--- container\n\n--- core/text\nChild\n\n--- /container`;
      const doc = parse(source);
      const result = compile(doc, registry);

      expect(result.html).toContain('class="container"');
      expect(result.html).toContain('Child');
      expect(result.html).not.toContain('{{children}}');
    });
  });

  describe('output modes', () => {
    it('should wrap in div for web mode (default)', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\nContent`);
      expect(result).toContain('class="mkly-document"');
      expect(result).toContain('max-width:600px');
    });

    it('should default to web mode without plugins', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\nContent`);
      expect(result).not.toContain('<!DOCTYPE html>');
      expect(result).toContain('<div');
    });
  });

  describe('maxWidth option', () => {
    it('should apply custom maxWidth', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\nContent`, { maxWidth: 800 });
      expect(result).toContain('max-width:800px');
    });

    it('should use default maxWidth of 600', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\nContent`);
      expect(result).toContain('max-width:600px');
    });
  });

  describe('registry integration', () => {
    it('should use custom block definitions', () => {
      const registry = new BlockRegistry();
      const customBlock: BlockDefinition = {
        name: 'custom',
        contentMode: 'text',
        compile: (block) => `<custom>${block.content}</custom>`,
      };
      registry.register(customBlock);

      const source = `--- meta\nversion: 1\n\n--- custom\nTest`;
      const doc = parse(source);
      const result = compile(doc, registry);

      expect(result.html).toContain('<custom>Test</custom>');
    });

    it('should pass context to custom block compile function', () => {
      const registry = new BlockRegistry();
      const ctxBlock: BlockDefinition = {
        name: 'themed',
        contentMode: 'text',
        compile: (block, ctx) =>
          `<div style="color:${ctx.variables.primary ?? 'inherit'}">${block.content}</div>`,
      };
      registry.register(ctxBlock);

      const source = `--- meta\nversion: 1\n\n--- themed\nContent`;
      const doc = parse(source);
      const result = compile(doc, registry, { variables: { primary: '#123456' } });

      expect(result.html).toContain('#123456');
    });
  });

  describe('plugin integration', () => {
    it('should fall back to registry when plugin has no renderer', () => {
      const registry = new BlockRegistry();
      const myBlock: BlockDefinition = {
        name: 'myblock',
        contentMode: 'text',
        compile: (block) => `<my>${block.content}</my>`,
      };
      registry.register(myBlock);

      const { definePlugin } = require('../src/index');
      const emptyPlugin = definePlugin({ name: 'empty', renderers: {} });

      const source = `--- meta\nversion: 1\n\n--- myblock\nTest`;
      const doc = parse(source);
      const result = compile(doc, registry, { plugins: [emptyPlugin] });
      expect(result.html).toContain('<my>Test</my>');
    });
  });

  describe('markdown conversion', () => {
    it('should convert markdown in content blocks', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\n**Bold** and *italic* text`);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert markdown links', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\n[Click here](https://example.com)`);
      expect(result).toContain('<a href="https://example.com">Click here</a>');
    });

    it('should convert markdown headings', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\n# Heading 1\n## Heading 2`);
      expect(result).toContain('<h1>Heading 1</h1>');
      expect(result).toContain('<h2>Heading 2</h2>');
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML in content', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\n<script>alert('xss')</script>`);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML in properties', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/image\nsrc: test.png\nalt: <img>`);
      expect(result).toContain('&lt;img&gt;');
    });
  });

  describe('inline styles (@prefix) — rejected', () => {
    it('should produce errors for @-prefixed properties', () => {
      const doc = parse(`--- use: core

--- meta
version: 1

--- core/text
@bg: #f5f5f5

Hello world`);
      const errors = doc.errors.filter(e => e.severity === 'error' && e.message.includes('cannot start with @'));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('@bg');
    });

    it('should not affect blocks without @properties', () => {
      const result = html(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nPlain text`);
      expect(result).toContain('mkly-core-text');
    });

    it('should apply styles from --- style blocks instead', () => {
      const result = html(`--- use: core

--- meta
version: 1

--- style
core/text
  background: #f5f5f5
  padding: 16px

--- core/text

Hello world`);
      expect(result).toContain('@layer user');
      expect(result).toContain('background: #f5f5f5');
      expect(result).toContain('padding: 16px');
    });
  });

  describe('error collection', () => {
    it('should collect errors for missing required properties', () => {
      const doc = parse(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer`);
      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('height'))).toBe(true);
    });

    it('should render inline error markers', () => {
      const doc = parse(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer`);
      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('mkly-error');
      expect(result.html).toContain('height');
    });

    it('should continue rendering after errors', () => {
      const source = `--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\n\n--- core/text\n\nStill renders`;
      const doc = parse(source);
      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('mkly-error');
      expect(result.html).toContain('Still renders');
    });
  });

  describe('presets', () => {
    const testPreset: MklyPreset = {
      name: 'test-glass',
      description: 'Glass preset for testing',
      css: `card
  backdropFilter: blur(12px)
  borderRadius: 16px`,
    };

    const kitWithPresets = defineKit({
      ...CORE_KIT,
      presets: [testPreset],
    });

    it('should inject preset CSS into compiled output', () => {
      const source = `--- use: core\n--- preset: test-glass\n\n--- meta\nversion: 1\n\n--- core/card\ntitle: Hello\nurl: https://example.com\n\nContent`;
      const result = mkly(source, { kits: { core: kitWithPresets } });
      expect(result.html).toContain('backdrop-filter: blur(12px)');
      expect(result.html).toContain('border-radius: 16px');
    });

    it('should emit meta tag for active preset', () => {
      const source = `--- use: core\n--- preset: test-glass\n\n--- meta\nversion: 1\n\n--- core/text\nHello`;
      const result = mkly(source, { kits: { core: kitWithPresets } });
      expect(result.html).toContain('<meta name="mkly:preset" content="test-glass">');
    });

    it('should warn on unknown preset', () => {
      const source = `--- use: core\n--- preset: nonexistent\n\n--- meta\nversion: 1\n\n--- core/text\nHello`;
      const result = mkly(source, { kits: { core: kitWithPresets } });
      expect(result.errors.some(e => e.message.includes('Unknown preset "nonexistent"'))).toBe(true);
    });

    it('should apply preset CSS after theme CSS (preset wins on structure)', () => {
      const kitWithBoth = defineKit({
        ...CORE_KIT,
        themes: [{
          name: 'theme-with-card',
          variables: { accent: '#ff0000' },
          css: `card\n  borderRadius: 4px`,
        }],
        presets: [{
          name: 'round',
          css: `card\n  borderRadius: 20px`,
        }],
      });

      const source = `--- use: core\n--- theme: theme-with-card\n--- preset: round\n\n--- meta\nversion: 1\n\n--- core/card\ntitle: Test\nurl: https://example.com\n\nContent`;
      const result = mkly(source, { kits: { core: kitWithBoth } });
      // Preset CSS comes after theme CSS, so 20px should appear later (and win)
      const css = result.html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
      const lastRadiusMatch = css.lastIndexOf('border-radius: 20px');
      const themeRadiusMatch = css.lastIndexOf('border-radius: 4px');
      expect(lastRadiusMatch).toBeGreaterThan(themeRadiusMatch);
    });

    it('should resolve qualified preset names', () => {
      const source = `--- use: core\n--- preset: core/test-glass\n\n--- meta\nversion: 1\n\n--- core/text\nHello`;
      const result = mkly(source, { kits: { core: kitWithPresets } });
      expect(result.html).toContain('backdrop-filter: blur(12px)');
      expect(result.errors.some(e => e.message.includes('Unknown preset'))).toBe(false);
    });

    it('should apply preset keyframes', () => {
      const presetWithKeyframes: MklyPreset = {
        name: 'animated',
        css: `card\n  animation: glassShimmer 2s infinite`,
        keyframes: {
          glassShimmer: 'from{opacity:0.8}to{opacity:1}',
        },
      };

      const kit = defineKit({
        ...CORE_KIT,
        presets: [presetWithKeyframes],
      });

      const source = `--- use: core\n--- preset: animated\n\n--- meta\nversion: 1\n\n--- core/text\nHello`;
      const result = mkly(source, { kits: { core: kit } });
      expect(result.html).toContain('@keyframes glassShimmer');
      expect(result.html).toContain('from{opacity:0.8}to{opacity:1}');
    });

    it('should parse multiple presets', () => {
      const doc = parse(`--- use: core\n--- preset: glass\n--- preset: animated\n\n--- meta\nversion: 1\n\n--- core/text\nHello`);
      expect(doc.presets).toEqual(['glass', 'animated']);
    });

    it('should parse preset with inline label', () => {
      const doc = parse(`--- use: core\n--- preset: glass\n\n--- meta\nversion: 1`);
      expect(doc.presets).toEqual(['glass']);
    });
  });
});
