import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { validateMklyOutput, validateMkly, formatErrors } from '../src/index';
import type { MklyKit, BlockSchema, BlockDefinition } from '../src/index';

const introSchema: BlockSchema = {
  name: 'intro',
  description: 'Newsletter introduction',
  properties: z.object({}),
  contentMode: 'text',
};

const featuredSchema: BlockSchema = {
  name: 'featured',
  description: 'Featured article',
  properties: z.object({
    image: z.string().url().optional(),
    link: z.string().url().optional(),
    source: z.string().optional(),
  }),
  contentMode: 'mixed',
};

const categorySchema: BlockSchema = {
  name: 'category',
  description: 'Category container',
  properties: z.object({
    title: z.string().optional(),
  }),
  contentMode: 'properties',
  isContainer: true,
};

// Block definitions for compile pipeline (testKit needs both schemas AND blocks)
const introBlock: BlockDefinition = {
  name: 'intro',
  contentMode: 'text',
  compile: (block) => `<div class="mkly-newsletter-intro">${block.content}</div>`,
};

const featuredBlock: BlockDefinition = {
  name: 'featured',
  contentMode: 'mixed',
  compile: (block) => `<div class="mkly-newsletter-featured">${block.content}</div>`,
};

const categoryBlock: BlockDefinition = {
  name: 'category',
  contentMode: 'properties',
  isContainer: true,
  compile: () => `<div class="mkly-newsletter-category">{{children}}</div>`,
};

const testKit: MklyKit = {
  name: 'newsletter',
  blocks: [introBlock, featuredBlock, categoryBlock],
  schemas: [introSchema, featuredSchema, categorySchema],
};

describe('AI validation', () => {
  describe('validateMklyOutput', () => {
    it('should validate a simple valid document', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello world');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.document).toBeDefined();
    });

    it('should error when version is missing', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/text\n\nHello world');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required'))).toBe(true);
    });

    it('should return the parsed document', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\ntitle: Test\n\n--- core/text\n\nHello');
      expect(result.document?.meta.title).toBe('Test');
      expect(result.document?.blocks).toHaveLength(1);
    });

    it('should detect missing required properties', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/image\nalt: Photo');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate fix suggestions for missing props', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/image\nalt: Photo');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].fix).toBeDefined();
    });

    it('should detect unknown block types', () => {
      const result = validateMklyOutput('--- nonexistent\n\nContent');
      expect(result.errors.some(e => e.message.includes('Unknown block type'))).toBe(true);
    });

    it('should suggest fix for unknown blocks', () => {
      const result = validateMklyOutput('--- nonexistent\n\nContent');
      expect(result.suggestions.some(s => s.message.includes('Unknown block type'))).toBe(true);
    });

    it('should detect orphaned closing tags', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/text\n\nHello\n\n--- /core/section');
      expect(result.errors.some(e => e.message.includes('no matching'))).toBe(true);
    });

    it('should suggest fix for orphaned closing tags', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/text\n\nHello\n\n--- /core/section');
      expect(result.suggestions.some(s => s.message.includes('no matching'))).toBe(true);
    });

    it('should validate child blocks in containers', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/section\n\n--- core/image\nalt: Photo\n\n--- /core/section');
      expect(result.errors.some(e => e.message.includes('src'))).toBe(true);
    });

    it('should warn about unknown blocks without newsletter schemas', () => {
      const result = validateMklyOutput('--- intro\n\nWelcome!');
      expect(result.errors.some(e => e.message.includes('Unknown block type'))).toBe(true);
    });

    it('should detect invalid version', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\nversion: abc\n\n--- core/text\n\nHello');
      expect(result.errors.some(e => e.message.includes('Invalid version'))).toBe(true);
    });

    it('should suggest fix for invalid version', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\nversion: abc\n\n--- core/text\n\nHello');
      expect(result.suggestions.some(s => s.fix?.includes('version: 1'))).toBe(true);
    });

    it('should detect unsupported version', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\nversion: 99\n\n--- core/text\n\nHello');
      expect(result.errors.some(e => e.message.includes('Unsupported version'))).toBe(true);
    });

    it('should suggest fix for unsupported version', () => {
      const result = validateMklyOutput('--- use: core\n\n--- meta\nversion: 99\n\n--- core/text\n\nHello');
      expect(result.suggestions.some(s => s.fix?.includes('version: 1'))).toBe(true);
    });

    it('should handle empty input', () => {
      const result = validateMklyOutput('');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required'))).toBe(true);
      expect(result.document).toBeDefined();
    });

    it('should return valid=true when only warnings exist', () => {
      const result = validateMklyOutput('--- use: core\n\n--- core/text\n\nHello\n\n--- /nonexistent');
      const errors = result.errors.filter(e => e.severity === 'error');
      if (errors.length === 0) {
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('kit-aware validation', () => {
    it('should validate newsletter blocks when kit is provided', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\n\nWelcome to our newsletter!';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      expect(result.valid).toBe(true);
      const unknownErrors = result.errors.filter(e => e.message.includes('Unknown block type'));
      expect(unknownErrors).toHaveLength(0);
    });

    it('should still warn about unknown blocks not in any kit', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- nonexistent\n\nContent';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      expect(result.errors.some(e => e.message.includes('Unknown block type'))).toBe(true);
    });

    it('should validate kit block properties', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/featured\nimage: not-a-url\n\nGreat article';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      expect(result.errors.some(e => e.message.includes('featured'))).toBe(true);
    });

    it('should merge kit schemas with extraSchemas', () => {
      const customSchema: BlockSchema = {
        name: 'widget',
        description: 'Custom widget',
        properties: z.object({}),
        contentMode: 'text',
      };
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\n\nHello\n\n--- newsletter/featured\nsource: TechCrunch\n\nContent';
      const result = validateMklyOutput(source, {
        kits: { newsletter: testKit },
        extraSchemas: [customSchema],
      });
      const unknownErrors = result.errors.filter(e => e.message.includes('Unknown block type'));
      expect(unknownErrors).toHaveLength(0);
    });
  });

  describe('use declaration validation', () => {
    it('should warn about unknown kit in --- use declaration', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello';
      const result = validateMklyOutput(source);
      expect(result.errors.some(e => e.message.includes('Unknown kit "newsletter"'))).toBe(true);
    });

    it('should not warn when kit is provided for --- use declaration', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\n\nHello';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      const kitWarnings = result.errors.filter(e => e.message.includes('Unknown kit'));
      expect(kitWarnings).toHaveLength(0);
    });

    it('should not warn about --- use: core (core is always available)', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello';
      const result = validateMklyOutput(source);
      const kitWarnings = result.errors.filter(e => e.message.includes('Unknown kit'));
      expect(kitWarnings).toHaveLength(0);
    });
  });

  describe('content mode validation', () => {
    it('should warn when text-mode block has properties', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\ncolor: red\n\nHello';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      expect(result.errors.some(e => e.message.includes('text block') && e.message.includes('properties are not supported'))).toBe(true);
    });

    it('should warn when properties-mode block has text content', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\nheight: 20\n\nSome text here';
      const result = validateMklyOutput(source);
      expect(result.errors.some(e => e.message.includes('does not support body content'))).toBe(true);
    });

    it('should not warn for mixed-mode blocks with both properties and content', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/featured\nsource: TechCrunch\n\nGreat article';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      const modeWarnings = result.errors.filter(e => e.message.includes('does not support') || e.message.includes('text block'));
      expect(modeWarnings).toHaveLength(0);
    });

    it('should not warn for container blocks with text content', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/category\ntitle: Tech\n\n--- /newsletter/category';
      const result = validateMklyOutput(source, { kits: { newsletter: testKit } });
      const modeWarnings = result.errors.filter(e => e.message.includes('does not support') || e.message.includes('text block'));
      expect(modeWarnings).toHaveLength(0);
    });
  });

  describe('formatErrors', () => {
    it('should return empty string for valid results', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source);
      expect(output).toBe('');
    });

    it('should include error count in header', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source);
      expect(output).toContain('VALIDATION FAILED');
      expect(output).toContain('error');
    });

    it('should include line numbers', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source);
      expect(output).toMatch(/line \d+/);
    });

    it('should include source lines when includeSource is true', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source, { includeSource: true });
      expect(output).toContain('--- core/image');
    });

    it('should exclude source lines when includeSource is false', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source, { includeSource: false });
      expect(output).not.toContain('  > --- core/image');
    });

    it('should respect maxErrors limit', () => {
      const source = '--- use: core\n\n--- core/image\nalt: A\n\n--- core/image\nalt: B\n\n--- core/image\nalt: C';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source, { maxErrors: 1 });
      expect(output).toContain('... and');
      expect(output).toContain('more');
    });

    it('should include FIX suggestions', () => {
      const source = '--- use: core\n\n--- meta\nversion: abc\n\n--- core/text\n\nHello';
      const result = validateMklyOutput(source);
      const output = formatErrors(result, source);
      expect(output).toContain('FIX:');
    });
  });

  describe('validateMkly', () => {
    it('should return valid=true and empty feedback for valid documents', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello world';
      const result = validateMkly(source);
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('');
      expect(result.document).toBeDefined();
    });

    it('should return feedback string for invalid documents', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMkly(source);
      expect(result.valid).toBe(false);
      expect(result.feedback).toContain('VALIDATION FAILED');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept kit objects and validate kit blocks', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\n\nWelcome!';
      const result = validateMkly(source, { kits: { newsletter: testKit } });
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('');
    });

    it('should report kit block errors in feedback', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/featured\nimage: bad-url\n\nContent';
      const result = validateMkly(source, { kits: { newsletter: testKit } });
      expect(result.valid).toBe(false);
      expect(result.feedback).toContain('featured');
    });

    it('should pass format options through', () => {
      const source = '--- use: core\n\n--- core/image\nalt: Photo';
      const result = validateMkly(source, { includeSource: false });
      expect(result.feedback).not.toContain('  > --- core/image');
    });

    it('should include content mode warnings in feedback', () => {
      const source = '--- use: newsletter\n\n--- meta\nversion: 1\n\n--- newsletter/intro\ncolor: red\n\nHello';
      const result = validateMkly(source, { kits: { newsletter: testKit } });
      expect(result.errors.some(e => e.message.includes('text block') && e.message.includes('properties are not supported'))).toBe(true);
    });
  });
});
