import { describe, it, expect } from 'bun:test';
import {
  CORE_SCHEMAS,
  createBlockSchemas,
  validateBlock,
} from '../src/schemas';
import { BlockRegistry } from '../src/registry';
import type { MklyBlock } from '../src/types';

const CORE_SCHEMA_MAP = createBlockSchemas();

function makeBlock(
  blockType: string,
  properties: Record<string, string> = {},
  content = '',
): MklyBlock {
  return {
    blockType,
    properties,
    content,
    children: [],
    position: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
  };
}

describe('schemas', () => {
  describe('CORE_SCHEMAS', () => {
    it('should have 16 schemas', () => {
      expect(CORE_SCHEMAS).toHaveLength(16);
    });

    it('should contain all 16 core block schemas', () => {
      const coreNames = [
        'heading', 'text', 'image', 'button', 'divider', 'spacer',
        'code', 'quote', 'hero', 'section', 'card', 'list',
        'header', 'footer', 'cta', 'html',
      ];
      for (const name of coreNames) {
        expect(CORE_SCHEMA_MAP.has(name)).toBe(true);
      }
    });
  });

  describe('createBlockSchemas', () => {
    it('should create a map with only core schemas when called with no extras', () => {
      const schemas = createBlockSchemas();
      expect(schemas.size).toBe(16);
      expect(schemas.has('heading')).toBe(true);
      expect(schemas.has('intro')).toBe(false);
    });
  });

  describe('schema content modes', () => {
    it('heading should be text mode', () => {
      expect(CORE_SCHEMA_MAP.get('heading')?.contentMode).toBe('text');
    });

    it('image should be properties mode', () => {
      expect(CORE_SCHEMA_MAP.get('image')?.contentMode).toBe('properties');
    });

    it('button should be mixed mode', () => {
      expect(CORE_SCHEMA_MAP.get('button')?.contentMode).toBe('mixed');
    });

    it('section should be a container', () => {
      expect(CORE_SCHEMA_MAP.get('section')?.isContainer).toBe(true);
    });

    it('text should not be a container', () => {
      expect(CORE_SCHEMA_MAP.get('text')?.isContainer).toBeUndefined();
    });
  });

  describe('validateBlock', () => {
    describe('unknown blocks', () => {
      it('should return warning for unknown block type', () => {
        const block = makeBlock('nonexistent');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(1);
        expect(errors[0].severity).toBe('warning');
        expect(errors[0].message).toContain('Unknown block type');
      });
    });

    describe('heading block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('heading');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with valid level', () => {
        const block = makeBlock('heading', { level: '3' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should fail with level out of range', () => {
        const block = makeBlock('heading', { level: '7' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].severity).toBe('error');
      });

      it('should pass with text property', () => {
        const block = makeBlock('heading', { text: 'Hello' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('text block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('text');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('image block', () => {
      it('should pass with valid src', () => {
        const block = makeBlock('image', { src: 'https://example.com/img.png' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should fail without src', () => {
        const block = makeBlock('image', {});
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail with invalid URL for src', () => {
        const block = makeBlock('image', { src: 'not-a-url' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should pass with all optional properties', () => {
        const block = makeBlock('image', {
          src: 'https://example.com/img.png',
          alt: 'Description',
          url: 'https://example.com',
          width: '600',
        });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('button block', () => {
      it('should pass with url', () => {
        const block = makeBlock('button', { url: 'https://example.com' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with href instead of url', () => {
        const block = makeBlock('button', { href: 'https://example.com' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with no properties (all optional in schema)', () => {
        const block = makeBlock('button');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should fail with invalid url', () => {
        const block = makeBlock('button', { url: 'not-a-url' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('divider block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('divider');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('spacer block', () => {
      it('should pass with valid height', () => {
        const block = makeBlock('spacer', { height: '20' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should fail without height', () => {
        const block = makeBlock('spacer', {});
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail with non-numeric height', () => {
        const block = makeBlock('spacer', { height: 'abc' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('code block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('code');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with lang property', () => {
        const block = makeBlock('code', { lang: 'typescript' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('quote block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('quote');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with author', () => {
        const block = makeBlock('quote', { author: 'Shakespeare' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('hero block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('hero');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with valid image URL', () => {
        const block = makeBlock('hero', { image: 'https://example.com/hero.jpg' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should fail with invalid image URL', () => {
        const block = makeBlock('hero', { image: 'not-a-url' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('section block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('section');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with title', () => {
        const block = makeBlock('section', { title: 'My Section' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('card block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('card');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with valid image and link', () => {
        const block = makeBlock('card', {
          image: 'https://example.com/card.jpg',
          link: 'https://example.com',
        });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('list block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('list');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('header block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('header');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with logo and title', () => {
        const block = makeBlock('header', {
          logo: 'https://example.com/logo.png',
          title: 'My Newsletter',
        });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('footer block', () => {
      it('should pass with no properties', () => {
        const block = makeBlock('footer');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('cta block', () => {
      it('should pass with url and buttonText', () => {
        const block = makeBlock('cta', {
          url: 'https://example.com',
          buttonText: 'Click Me',
        });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with href and label alternatives', () => {
        const block = makeBlock('cta', {
          href: 'https://example.com',
          label: 'Click Me',
        });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });

      it('should pass with no properties (all optional in schema)', () => {
        const block = makeBlock('cta');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors).toHaveLength(0);
      });
    });

    describe('error details', () => {
      it('should include blockType in error', () => {
        const block = makeBlock('image');
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors[0].blockType).toBe('image');
      });

      it('should include line number in error', () => {
        const block = makeBlock('image');
        block.position.start.line = 42;
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors[0].line).toBe(42);
      });

      it('should include property path in error', () => {
        const block = makeBlock('image', { src: 'invalid' });
        const errors = validateBlock(block, CORE_SCHEMA_MAP);
        expect(errors[0].property).toBe('src');
      });
    });
  });

  describe('BlockRegistry with schemas', () => {
    it('should validate using zod schemas when provided', () => {
      const registry = new BlockRegistry({ schemas: CORE_SCHEMA_MAP });
      const block = makeBlock('image');
      const errors = registry.validate(block);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should not use zod when schemas not provided', () => {
      const registry = new BlockRegistry();
      registry.register({
        name: 'image',
        contentMode: 'properties',
        compile: () => '',
      });
      const block = makeBlock('image');
      const errors = registry.validate(block);
      expect(errors).toHaveLength(0);
    });

    it('should combine unknown-block and schema errors', () => {
      const registry = new BlockRegistry({ schemas: CORE_SCHEMA_MAP });
      const block = makeBlock('nonexistent');
      const errors = registry.validate(block);
      const warningCount = errors.filter(e => e.severity === 'warning').length;
      expect(warningCount).toBeGreaterThanOrEqual(1);
    });
  });
});
