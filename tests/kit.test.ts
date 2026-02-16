import { describe, it, expect } from 'bun:test';
import { mkly, defineKit, defineBlock, parse, compile, createRegistry, CORE_KIT } from '../src/index';
import { escapeHtml } from '../src/utils';
import { prop } from '../src/errors';

describe('kit system', () => {
  describe('defineBlock', () => {
    it('should create a block definition', () => {
      const block = defineBlock({
        name: 'alert',
        contentMode: 'mixed',
        compile: (block) =>
          `<div class="alert alert--${prop(block, 'type') ?? 'info'}">${block.content}</div>`,
      });
      expect(block.name).toBe('alert');
      expect(block.contentMode).toBe('mixed');
    });
  });

  describe('defineKit', () => {
    it('should create a kit with blocks and styles', () => {
      const kit = defineKit({
        name: 'my-ui-kit',
        versions: { supported: [1], current: 1 },
        blocks: [
          defineBlock({
            name: 'alert',
            contentMode: 'mixed',
            compile: (block) =>
              `<div class="alert">${escapeHtml(block.content)}</div>`,
          }),
        ],
        styles: `.alert { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }`,
      });
      expect(kit.name).toBe('my-ui-kit');
      expect(kit.blocks).toHaveLength(1);
      expect(kit.styles).toContain('.alert');
    });
  });

  describe('kit blocks in compilation', () => {
    it('should register kit blocks and compile them', () => {
      const kit = defineKit({
        name: 'glass-ui',
        blocks: [
          defineBlock({
            name: 'glassButton',
            contentMode: 'mixed',
            compile: (block) => {
              const href = prop(block, 'href') ?? '#';
              const label = prop(block, 'label') ?? block.content.trim();
              return `<a href="${escapeHtml(href)}" class="glass-button">${escapeHtml(label)}</a>`;
            },
          }),
        ],
        styles: `.glass-button { backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 12px; }`,
      });

      const result = mkly(
        `--- use: glass-ui\n\n--- meta\nversion: 1\n\n--- glass-ui/glassButton\nhref: https://example.com\nlabel: Click me`,
        { kits: { 'glass-ui': kit } },
      );

      expect(result.html).toContain('class="glass-button"');
      expect(result.html).toContain('Click me');
      expect(result.html).toContain('https://example.com');
      expect(result.html).toContain('<style>');
      expect(result.html).toContain('backdrop-filter');
    });

    it('should inject kit styles into web output', () => {
      const kit = defineKit({
        name: 'theme',
        styles: `:root { --primary: red; }`,
      });

      const result = mkly(`--- use: theme\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello`, { kits: { theme: kit } });
      expect(result.html).toContain('<style>');
      expect(result.html).toContain('--primary: red');
    });

    it('should only inject diagnostic styles when no kits are used', () => {
      const result = mkly(`--- meta\nversion: 1\n\n--- core/text\n\nHello`);
      expect(result.html).toContain('.mkly-error');
      expect(result.html).not.toContain('.mkly-core-heading');
    });

    it('should error for unknown kit names in --- use', () => {
      const result = mkly(`--- use: unknown-kit\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello`);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Unknown kit "unknown-kit"'))).toBe(true);
    });
  });

  describe('kit transforms', () => {
    it('should apply document transforms before compilation', () => {
      const kit = defineKit({
        name: 'auto-toc',
        transform: (doc) => {
          const headings = doc.blocks.filter(b => b.blockType === 'core/heading');
          if (headings.length > 0) {
            return {
              ...doc,
              meta: { ...doc.meta, headingCount: String(headings.length) },
            };
          }
          return doc;
        },
      });

      const source = `--- use: auto-toc\n\n--- meta\nversion: 1\n\n--- core/heading\nlevel: 1\n\nTitle\n\n--- core/heading\nlevel: 2\n\nSubtitle`;
      const result = mkly(source, { kits: { 'auto-toc': kit } });

      expect(result.html).toContain('Title');
      expect(result.html).toContain('Subtitle');
    });
  });

  describe('kit afterCompile hooks', () => {
    it('should run afterCompile hooks on the result', () => {
      const kit = defineKit({
        name: 'minifier',
        afterCompile: (result) => ({
          ...result,
          html: result.html.replace(/\n/g, ''),
        }),
      });

      const result = mkly(`--- use: minifier\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello`, { kits: { minifier: kit } });
      expect(result.html).not.toContain('\n');
      expect(result.html).toContain('Hello');
    });
  });

  describe('multiple kits', () => {
    it('should compose multiple kits', () => {
      const alertKit = defineKit({
        name: 'alerts',
        blocks: [
          defineBlock({
            name: 'alert',
            contentMode: 'mixed',
            compile: (block) => {
              const type = prop(block, 'type') ?? 'info';
              return `<div class="mkly-alert mkly-alert--${escapeHtml(type)}">${escapeHtml(block.content)}</div>`;
            },
          }),
        ],
        styles: `.mkly-alert { padding: 16px; border-radius: 8px; }`,
      });

      const badgeKit = defineKit({
        name: 'badges',
        blocks: [
          defineBlock({
            name: 'badge',
            contentMode: 'properties',
            compile: (block) => {
              const text = prop(block, 'text') ?? '';
              const color = prop(block, 'color') ?? 'blue';
              return `<span class="mkly-badge mkly-badge--${escapeHtml(color)}">${escapeHtml(text)}</span>`;
            },
          }),
        ],
        styles: `.mkly-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }`,
      });

      const result = mkly(
        `--- use: alerts\n\n--- use: badges\n\n--- meta\nversion: 1\n\n--- alerts/alert\ntype: warning\n\nBe careful!\n\n--- badges/badge\ntext: New\ncolor: green`,
        { kits: { alerts: alertKit, badges: badgeKit } },
      );

      expect(result.html).toContain('mkly-alert--warning');
      expect(result.html).toContain('Be careful!');
      expect(result.html).toContain('mkly-badge--green');
      expect(result.html).toContain('New');
      expect(result.html).toContain('.mkly-alert');
      expect(result.html).toContain('.mkly-badge');
    });
  });

  describe('real-world kit example: liquid glass UI', () => {
    const liquidGlassKit = defineKit({
      name: 'liquid-glass',
      versions: { supported: [1], current: 1 },
      blocks: [
        defineBlock({
          name: 'glassCard',
          contentMode: 'mixed',
          compile: (block) => {
            const title = prop(block, 'title');
            const titleHtml = title
              ? `<h3 class="lg-card__title">${escapeHtml(title)}</h3>`
              : '';
            return `<div class="lg-card">${titleHtml}<div class="lg-card__body">${escapeHtml(block.content)}</div></div>`;
          },
        }),
        defineBlock({
          name: 'glassButton',
          contentMode: 'mixed',
          compile: (block) => {
            const href = prop(block, 'href') ?? '#';
            const label = prop(block, 'label') ?? block.content.trim();
            const variant = prop(block, 'variant') ?? 'default';
            return `<a href="${escapeHtml(href)}" class="lg-button lg-button--${escapeHtml(variant)}">${escapeHtml(label)}</a>`;
          },
        }),
        defineBlock({
          name: 'glassDivider',
          contentMode: 'properties',
          compile: () => `<hr class="lg-divider">`,
        }),
      ],
      styles: [
        `.lg-card { backdrop-filter: blur(16px); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; }`,
        `.lg-card__title { font-size: 18px; margin: 0 0 12px; }`,
        `.lg-button { backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 12px; text-decoration: none; display: inline-block; }`,
        `.lg-button--primary { background: rgba(255,138,80,0.2); }`,
        `.lg-divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }`,
      ].join('\n'),
    });

    it('should compile a full glass UI page', () => {
      const source = `--- use: core
--- use: liquid-glass

--- meta
version: 1

--- core/header
title: Glass Demo

--- liquid-glass/glassCard
title: Feature One

This is a frosted glass card with blur effects.

--- liquid-glass/glassDivider

--- liquid-glass/glassButton
href: https://example.com
label: Get Started
variant: primary

--- core/footer

Built with mkly + liquid-glass kit`;

      const result = mkly(source, { kits: { core: CORE_KIT, 'liquid-glass': liquidGlassKit } });

      expect(result.html).toContain('lg-card');
      expect(result.html).toContain('Feature One');
      expect(result.html).toContain('frosted glass card');
      expect(result.html).toContain('lg-divider');
      expect(result.html).toContain('lg-button--primary');
      expect(result.html).toContain('Get Started');
      expect(result.html).toContain('backdrop-filter');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('--- use block parsing', () => {
    it('should parse --- use: label into doc.uses', () => {
      const doc = parse(`--- use: newsletter\n\n--- core/text\n\nHello`);
      expect(doc.uses).toEqual(['newsletter']);
      expect(doc.blocks).toHaveLength(1);
    });

    it('should parse multiple --- use blocks', () => {
      const doc = parse(`--- use: alerts\n\n--- use: badges\n\n--- core/text\n\nHello`);
      expect(doc.uses).toEqual(['alerts', 'badges']);
    });

    it('should parse content-based --- use (one kit per line)', () => {
      const doc = parse(`--- use\nalerts\nbadges\n\n--- core/text\n\nHello`);
      expect(doc.uses).toEqual(['alerts', 'badges']);
    });

    it('should not create a block for --- use', () => {
      const doc = parse(`--- use: newsletter\n\n--- core/text\n\nHello`);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/text');
    });
  });

  describe('block override — later kits override earlier kits', () => {
    it('should allow a custom kit to override a core block', () => {
      const customHeadingKit = defineKit({
        name: 'custom-heading',
        blocks: [
          defineBlock({
            name: 'heading',
            contentMode: 'text',
            compile: (block) => `<h2 class="custom-heading">${block.content}</h2>`,
          }),
        ],
      });

      // custom kit registers as custom-heading/heading; use that in source
      const result = mkly('--- use: core\n--- use: custom-heading\n\n--- meta\nversion: 1\n\n--- custom-heading/heading\nlevel: 2\n\nOverridden', {
        kits: { core: CORE_KIT, 'custom-heading': customHeadingKit },
      });

      expect(result.html).toContain('custom-heading');
      expect(result.html).not.toContain('mkly-core-heading');
    });

    it('should preserve kit order — later use overrides earlier', () => {
      const kitA = defineKit({
        name: 'kit-a',
        blocks: [defineBlock({ name: 'demo', contentMode: 'text', compile: () => '<div class="from-a">A</div>' })],
      });
      const kitB = defineKit({
        name: 'kit-b',
        blocks: [defineBlock({ name: 'demo', contentMode: 'text', compile: () => '<div class="from-b">B</div>' })],
      });

      const result = mkly('--- use: kit-a\n--- use: kit-b\n\n--- meta\nversion: 1\n\n--- kit-b/demo\n\nContent', {
        kits: { 'kit-a': kitA, 'kit-b': kitB },
      });

      expect(result.html).toContain('from-b');
      expect(result.html).not.toContain('from-a');
    });

    it('should allow plugin renderers to override kit blocks', () => {
      const { definePlugin } = require('../src/index');
      const overridePlugin = definePlugin({
        name: 'override-text',
        renderers: {
          'core/text': () => '<div class="plugin-text">Overridden by plugin</div>',
        },
      });

      const result = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nOriginal', {
        kits: { core: CORE_KIT },
        plugins: [overridePlugin],
      });

      expect(result.html).toContain('plugin-text');
      expect(result.html).not.toContain('class="mkly-core-text"');
    });

    it('should keep non-overridden blocks from core', () => {
      const partialKit = defineKit({
        name: 'partial',
        blocks: [
          defineBlock({ name: 'heading', contentMode: 'text', compile: () => '<h1 class="custom">Custom</h1>' }),
        ],
      });

      const result = mkly('--- use: core\n--- use: partial\n\n--- meta\nversion: 1\n\n--- partial/heading\n\nCustom\n\n--- core/text\n\nStill core', {
        kits: { core: CORE_KIT, partial: partialKit },
      });

      // heading is from partial kit
      expect(result.html).toContain('class="custom"');
      // text is still from core
      expect(result.html).toContain('mkly-core-text');
    });
  });
});
