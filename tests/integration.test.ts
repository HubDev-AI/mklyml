import { describe, it, expect } from 'bun:test';
import { mkly, parse, compile, createRegistry, CORE_KIT } from '../src/index';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('integration', () => {
  describe('example.mkly file', () => {
    const examplePath = join(__dirname, '..', 'example.mkly');
    const exampleSource = readFileSync(examplePath, 'utf-8');

    it('should parse example.mkly without errors', () => {
      const doc = parse(exampleSource);
      expect(doc.errors).toHaveLength(0);
    });

    it('should extract meta from example.mkly', () => {
      const doc = parse(exampleSource);
      expect(doc.meta.title).toBe('Welcome to mkly');
      expect(doc.meta.subject).toBe('The simplest way to write rich HTML');
      expect(doc.meta.author).toBe('Milkly Team');
    });

    it('should parse all blocks in example.mkly', () => {
      const doc = parse(exampleSource);
      expect(doc.blocks.length).toBeGreaterThan(0);
    });

    it('should parse header block', () => {
      const doc = parse(exampleSource);
      const header = doc.blocks.find(b => b.blockType === 'core/header');
      expect(header).toBeDefined();
      expect(header?.properties.logo).toBe('https://milkly.app/logo.png');
      expect(header?.properties.title).toBe('Welcome to mkly');
    });

    it('should parse hero block', () => {
      const doc = parse(exampleSource);
      const hero = doc.blocks.find(b => b.blockType === 'core/hero');
      expect(hero).toBeDefined();
      expect(hero?.properties.image).toContain('unsplash.com');
      expect(hero?.content).toContain('The Future of Content');
    });

    it('should parse section container with children', () => {
      const doc = parse(exampleSource);
      const section = doc.blocks.find(b => b.blockType === 'core/section');
      expect(section).toBeDefined();
      expect(section?.label).toBe('Features');
      expect(section?.children.length).toBeGreaterThan(0);
    });

    it('should parse card blocks inside section', () => {
      const doc = parse(exampleSource);
      const section = doc.blocks.find(b => b.blockType === 'core/section');
      const cards = section?.children.filter(c => c.blockType === 'core/card');
      expect(cards?.length).toBeGreaterThanOrEqual(1);
      expect(cards?.[0].content).toContain('AI-Friendly');
    });

    it('should parse cta block', () => {
      const doc = parse(exampleSource);
      const cta = doc.blocks.find(b => b.blockType === 'core/cta');
      expect(cta).toBeDefined();
      expect(cta?.properties.url).toBe('https://milkly.app/get-started');
      expect(cta?.properties.buttonText).toBe('Get Started');
    });

    it('should parse footer block', () => {
      const doc = parse(exampleSource);
      const footer = doc.blocks.find(b => b.blockType === 'core/footer');
      expect(footer).toBeDefined();
      expect(footer?.content).toContain('Built with mkly');
    });

    it('should compile example.mkly to valid HTML', () => {
      const doc = parse(exampleSource);
      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });

      expect(result.html).toContain('<div');
      expect(result.html).toContain('Welcome to mkly');
    });

    it('should include all content in compiled output', () => {
      const doc = parse(exampleSource);
      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });

      expect(result.html).toContain('AI-Friendly');
      expect(result.html).toContain('Human-Readable');
      expect(result.html).toContain('Get Started');
    });
  });

  describe('mkly() convenience function', () => {
    it('should parse and compile in one step', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello world`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Hello world');
      expect(result.html).toContain('<div');
    });

    it('should use core blocks via kit', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/hero\nimage: hero.jpg\n\n# Hero Title`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Hero Title');
    });

    it('should handle empty input', () => {
      const result = mkly('');
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should return errors array', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer`, { kits: { core: CORE_KIT } });
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('full document workflow', () => {
    it('should handle document with many block types', () => {
      const source = `--- use: core

--- meta
version: 1
title: Newsletter
subject: Weekly Update

--- core/header
logo: logo.png
title: Weekly Newsletter

--- core/text

Welcome to this week's newsletter!

--- core/section
title: Technology

--- core/card
image: card1.jpg
link: https://example.com

## Card Title

Card description

--- /core/section

--- core/cta
url: https://example.com
buttonText: Read More

See you next week!

--- core/footer

Unsubscribe | View in browser`;

      const doc = parse(source);
      expect(doc.errors).toHaveLength(0);
      expect(doc.meta.title).toBe('Newsletter');

      const registry = createRegistry();
      const result = compile(doc, registry, { kits: { core: CORE_KIT } });

      expect(result.html).toContain('Weekly Newsletter');
      expect(result.html).toContain('Card Title');
      expect(result.html).toContain('Technology');
      expect(result.html).toContain('Read More');
      expect(result.html).toContain('Unsubscribe');
    });

    it('should produce valid web HTML', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\ntitle: Test\n\n--- core/text\n\nContent`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('mkly-document');
      expect(result.html).toMatch(/<\/main>$/);
    });
  });

  describe('complex nesting scenarios', () => {
    it('should handle multiple containers at same level', () => {
      const source = `--- use: core\n\n--- meta\nversion: 1\n\n--- core/section\ntitle: Section 1\n\n--- core/card\nCard 1\n\n--- /core/section\n\n--- core/section\ntitle: Section 2\n\n--- core/card\nCard 2\n\n--- /core/section`;

      const doc = parse(source);
      expect(doc.blocks).toHaveLength(2);
      expect(doc.blocks[0].children).toHaveLength(1);
      expect(doc.blocks[1].children).toHaveLength(1);

      const result = mkly(source, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Section 1');
      expect(result.html).toContain('Card 1');
      expect(result.html).toContain('Section 2');
      expect(result.html).toContain('Card 2');
    });
  });

  describe('edge cases', () => {
    it('should handle document with only meta', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\ntitle: Only Meta`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('<main');
    });

    it('should handle document with comments', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n// This is a comment\n--- core/text\n// Another comment\nContent`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Content');
      expect(result.html).toContain('<!-- mkly-c: This is a comment -->');
      expect(result.html).toContain('<!-- mkly-c: Another comment -->');
    });

    it('should handle document with blank lines', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n\n\n--- core/text\n\n\nContent\n\n\n`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Content');
    });

    it('should handle special characters in content', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nSpecial chars: & < > "`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&lt;');
      expect(result.html).toContain('&gt;');
      expect(result.html).toContain('&quot;');
    });
  });

  describe('error debugging', () => {
    it('should render error markers inline for missing required props', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/button`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('mkly-error');
      expect(result.html).toContain('url');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should continue rendering after error blocks', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\n\n--- core/text\n\nAfter the error`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('mkly-error');
      expect(result.html).toContain('After the error');
    });

    it('should include line numbers in error markers', () => {
      const result = mkly(`--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer`, { kits: { core: CORE_KIT } });
      expect(result.html).toContain('data-line="6"');
    });

    it('should collect both parse and compile errors', () => {
      const source = `--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\n\n--- core/card\nContent\n\n--- /nonexistent`;
      const result = mkly(source, { kits: { core: CORE_KIT } });
      const hasCompileError = result.errors.some(
        e => 'blockType' in e && e.message.includes('height'),
      );
      const hasParseError = result.errors.some(
        e => e.message.includes('no matching opening block'),
      );
      expect(hasCompileError).toBe(true);
      expect(hasParseError).toBe(true);
    });
  });
});
