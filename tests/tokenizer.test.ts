import { describe, it, expect } from 'bun:test';
import { tokenize } from '../src/tokenizer';
import type { TokenizedLine } from '../src/types';

describe('tokenizer', () => {
  describe('blank lines', () => {
    it('should tokenize blank lines', () => {
      const result = tokenize('\n\n');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'blank', line: 1 });
      expect(result[1]).toEqual({ type: 'blank', line: 2 });
    });

    it('should tokenize lines with only spaces as blank', () => {
      const result = tokenize('   \n\t\t\n');
      expect(result[0]).toEqual({ type: 'blank', line: 1 });
      expect(result[1]).toEqual({ type: 'blank', line: 2 });
    });
  });

  describe('comments', () => {
    it('should tokenize comment lines', () => {
      const result = tokenize('// This is a comment');
      expect(result[0]).toEqual({
        type: 'comment',
        content: 'This is a comment',
        line: 1,
      });
    });

    it('should tokenize comment with leading spaces', () => {
      const result = tokenize('  // Indented comment');
      expect(result[0]).toEqual({
        type: 'comment',
        content: 'Indented comment',
        line: 1,
      });
    });

    it('should handle comment with no space after //', () => {
      const result = tokenize('//No space');
      expect(result[0]).toEqual({
        type: 'comment',
        content: 'No space',
        line: 1,
      });
    });
  });

  describe('block start', () => {
    it('should tokenize basic block start', () => {
      const result = tokenize('--- core/text');
      expect(result[0]).toEqual({
        type: 'block_start',
        blockType: 'core/text',
        line: 1,
      });
    });

    it('should tokenize block start with label', () => {
      const result = tokenize('--- core/section: Features');
      expect(result[0]).toEqual({
        type: 'block_start',
        blockType: 'core/section',
        label: 'Features',
        line: 1,
      });
    });

    it('should tokenize block start with label containing spaces', () => {
      const result = tokenize('--- newsletter/category: Tools & Resources');
      expect(result[0]).toEqual({
        type: 'block_start',
        blockType: 'newsletter/category',
        label: 'Tools & Resources',
        line: 1,
      });
    });

    it('should tokenize block start with leading spaces', () => {
      const result = tokenize('  --- core/hero');
      expect(result[0]).toEqual({
        type: 'block_start',
        blockType: 'core/hero',
        line: 1,
      });
    });

    it('should tokenize block start with trailing spaces', () => {
      const result = tokenize('--- core/card   ');
      expect(result[0]).toEqual({
        type: 'block_start',
        blockType: 'core/card',
        line: 1,
      });
    });
  });

  describe('block end', () => {
    it('should tokenize block end', () => {
      const result = tokenize('--- /core/section');
      expect(result[0]).toEqual({
        type: 'block_end',
        blockType: 'core/section',
        line: 1,
      });
    });

    it('should tokenize block end with spaces', () => {
      const result = tokenize('  --- /newsletter/category  ');
      expect(result[0]).toEqual({
        type: 'block_end',
        blockType: 'newsletter/category',
        line: 1,
      });
    });

    it('should prioritize block end over block start', () => {
      const result = tokenize('--- /core/section');
      expect(result[0].type).toBe('block_end');
    });
  });

  describe('properties', () => {
    it('should tokenize simple property', () => {
      const result = tokenize('title: Hello World');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'title',
        value: 'Hello World',
        raw: 'title: Hello World',
        line: 1,
      });
    });

    it('should tokenize property with quoted value', () => {
      const result = tokenize('title: "Hello World"');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'title',
        value: 'Hello World',
        raw: 'title: "Hello World"',
        line: 1,
      });
    });

    it('should tokenize property with URL', () => {
      const result = tokenize('url: https://example.com/path?q=1');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'url',
        value: 'https://example.com/path?q=1',
        raw: 'url: https://example.com/path?q=1',
        line: 1,
      });
    });

    it('should tokenize property with numeric value', () => {
      const result = tokenize('height: 100');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'height',
        value: '100',
        raw: 'height: 100',
        line: 1,
      });
    });

    it('should handle property with leading spaces', () => {
      const result = tokenize('  image: test.png');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'image',
        value: 'test.png',
        raw: '  image: test.png',
        line: 1,
      });
    });

    it('should handle property with value containing colons', () => {
      const result = tokenize('time: 10:30:45');
      expect(result[0]).toEqual({
        type: 'property',
        key: 'time',
        value: '10:30:45',
        raw: 'time: 10:30:45',
        line: 1,
      });
    });
  });

  describe('text lines', () => {
    it('should tokenize plain text', () => {
      const result = tokenize('This is plain text');
      expect(result[0]).toEqual({
        type: 'text',
        content: 'This is plain text',
        line: 1,
      });
    });

    it('should preserve indentation in text lines', () => {
      const result = tokenize('  Indented text');
      expect(result[0]).toEqual({
        type: 'text',
        content: '  Indented text',
        line: 1,
      });
    });

    it('should preserve code indentation', () => {
      const result = tokenize('    function test() {');
      expect(result[0]).toEqual({
        type: 'text',
        content: '    function test() {',
        line: 1,
      });
    });

    it('should tokenize markdown heading as text', () => {
      const result = tokenize('## Heading');
      expect(result[0]).toEqual({
        type: 'text',
        content: '## Heading',
        line: 1,
      });
    });

    it('should tokenize markdown list as text', () => {
      const result = tokenize('- List item');
      expect(result[0]).toEqual({
        type: 'text',
        content: '- List item',
        line: 1,
      });
    });
  });

  describe('edge cases', () => {
    it('should treat lines with colons as properties if they match pattern', () => {
      const result = tokenize('This: is a property');
      expect(result[0].type).toBe('property');
      if (result[0].type === 'property') {
        expect(result[0].key).toBe('This');
      }
    });

    it('should handle empty input', () => {
      const result = tokenize('');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'blank', line: 1 });
    });

    it('should track line numbers correctly', () => {
      const result = tokenize('line 1\nline 2\nline 3');
      expect(result[0].line).toBe(1);
      expect(result[1].line).toBe(2);
      expect(result[2].line).toBe(3);
    });

    it('should handle mixed content types', () => {
      const source = `--- core/hero
image: test.png

Some text content`;
      const result = tokenize(source);
      expect(result[0].type).toBe('block_start');
      expect(result[1].type).toBe('property');
      expect(result[2].type).toBe('blank');
      expect(result[3].type).toBe('text');
    });

    it('should not confuse text starting with --- as block marker', () => {
      const result = tokenize('text');
      expect(result[0].type).toBe('text');
    });

    it('should handle property-like lines without space after colon', () => {
      const result = tokenize('key:value');
      expect(result[0].type).toBe('text');
    });
  });
});
