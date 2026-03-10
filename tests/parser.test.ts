import { describe, it, expect } from 'bun:test';
import { parse } from '../src/parser';
import type { MklyDocument } from '../src/types';

describe('parser', () => {
  describe('empty document', () => {
    it('should parse empty string', () => {
      const doc = parse('');
      expect(doc.blocks).toHaveLength(0);
      expect(doc.meta).toEqual({});
      expect(doc.errors).toHaveLength(0);
    });

    it('should parse only blank lines', () => {
      const doc = parse('\n\n\n');
      expect(doc.blocks).toHaveLength(0);
      expect(doc.meta).toEqual({});
    });

    it('should parse only comments', () => {
      const doc = parse('// Comment 1\n// Comment 2');
      expect(doc.blocks).toHaveLength(0);
    });
  });

  describe('meta block', () => {
    it('should populate doc.meta, not doc.blocks', () => {
      const source = `--- meta
title: Test Document
author: Jane Doe`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(0);
      expect(doc.meta).toEqual({
        title: 'Test Document',
        author: 'Jane Doe',
      });
    });

    it('should handle meta block with multiple properties', () => {
      const source = `--- meta
title: Newsletter
subject: Weekly Update
author: Team`;
      const doc = parse(source);
      expect(doc.meta.title).toBe('Newsletter');
      expect(doc.meta.subject).toBe('Weekly Update');
      expect(doc.meta.author).toBe('Team');
    });
  });

  describe('single block', () => {
    it('should parse block with properties only', () => {
      const source = `--- core/image
src: test.png
alt: Test image`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/image');
      expect(doc.blocks[0].properties).toEqual({
        src: 'test.png',
        alt: 'Test image',
      });
      expect(doc.blocks[0].content).toBe('');
    });

    it('should parse block with content only', () => {
      const source = `--- core/text

This is some content`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/text');
      expect(doc.blocks[0].properties).toEqual({});
      expect(doc.blocks[0].content).toBe('This is some content');
    });

    it('should parse block with properties and content', () => {
      const source = `--- core/hero
image: hero.jpg

# Welcome

This is hero content`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/hero');
      expect(doc.blocks[0].properties.image).toBe('hero.jpg');
      expect(doc.blocks[0].content).toBe('# Welcome\n\nThis is hero content');
    });

    it('should require blank line to separate properties from content', () => {
      const source = `--- core/text
key: value
This is content`;
      const doc = parse(source);
      expect(doc.blocks[0].properties.key).toBe('value');
      expect(doc.blocks[0].content).toBe('This is content');
    });
  });

  describe('@prop syntax rejection', () => {
    it('should produce errors for @-prefixed properties', () => {
      const source = `--- core/hero
image: hero.jpg
@bg: #f5f5f5
@padding: 24px 32px

# Welcome`;
      const doc = parse(source);
      expect(doc.blocks[0].properties).toEqual({ image: 'hero.jpg' });
      const errors = doc.errors.filter(e => e.severity === 'error' && e.message.includes('cannot start with @'));
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should not produce warnings for @ in content mode', () => {
      const source = `--- core/text

@mention is not a style`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toContain('@mention');
    });
  });

  describe('content mode', () => {
    it('should treat property-like lines in content mode as text', () => {
      const source = `--- core/text

This line has: a colon
key: value in content`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toBe('This line has: a colon\nkey: value in content');
      expect(doc.blocks[0].properties).toEqual({});
    });

    it('should preserve property-like line formatting in content', () => {
      const source = `--- core/code

function: test() {
  return: value;
}`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toContain('function: test()');
      expect(doc.blocks[0].content).toContain('return: value;');
    });
  });

  describe('container blocks', () => {
    it('should restructure container blocks with children', () => {
      const source = `--- core/section: Features

--- core/card
Card 1

--- core/card
Card 2

--- /core/section`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/section');
      expect(doc.blocks[0].label).toBe('Features');
      expect(doc.blocks[0].children).toHaveLength(2);
      expect(doc.blocks[0].children[0].blockType).toBe('core/card');
      expect(doc.blocks[0].children[1].blockType).toBe('core/card');
    });

    it('should handle nested containers', () => {
      const source = `--- core/section: Outer

--- newsletter/category: Inner

--- newsletter/item
Nested item

--- /newsletter/category

--- /core/section`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].blockType).toBe('core/section');
      expect(doc.blocks[0].children).toHaveLength(1);
      expect(doc.blocks[0].children[0].blockType).toBe('newsletter/category');
      expect(doc.blocks[0].children[0].children).toHaveLength(1);
      expect(doc.blocks[0].children[0].children[0].blockType).toBe('newsletter/item');
    });

    it('should handle empty container', () => {
      const source = `--- core/section

--- /core/section`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].children).toHaveLength(0);
    });

    it('should produce error for unmatched closing tag', () => {
      const source = `--- meta\nversion: 1\n\n--- core/card\n\n--- /core/section`;
      const doc = parse(source);
      expect(doc.errors).toHaveLength(1);
      expect(doc.errors[0].message).toContain('Closing --- /core/section has no matching opening block');
      expect(doc.errors[0].severity).toBe('warning');
    });
  });

  describe('multiple blocks', () => {
    it('should parse multiple sequential blocks', () => {
      const source = `--- core/text
First block

--- core/text
Second block

--- core/text
Third block`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(3);
      expect(doc.blocks[0].content).toBe('First block');
      expect(doc.blocks[1].content).toBe('Second block');
      expect(doc.blocks[2].content).toBe('Third block');
    });

    it('should parse blocks with mixed content types', () => {
      const source = `--- core/image
src: test.png

--- core/text

Some text content

--- core/button
url: https://example.com
label: Click me`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(3);
      expect(doc.blocks[0].blockType).toBe('core/image');
      expect(doc.blocks[1].blockType).toBe('core/text');
      expect(doc.blocks[2].blockType).toBe('core/button');
    });
  });

  describe('block labels', () => {
    it('should parse block label from start tag', () => {
      const source = `--- core/section: My Label`;
      const doc = parse(source);
      expect(doc.blocks[0].label).toBe('My Label');
    });

    it('should parse label with special characters', () => {
      const source = `--- newsletter/category: Tools & Resources`;
      const doc = parse(source);
      expect(doc.blocks[0].label).toBe('Tools & Resources');
    });

    it('should not have label if none provided', () => {
      const source = `--- core/text`;
      const doc = parse(source);
      expect(doc.blocks[0].label).toBeUndefined();
    });
  });

  describe('comments', () => {
    it('should ignore comments in document', () => {
      const source = `// This is a comment
--- core/text
// Another comment
Content here`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].content).toBe('Content here');
    });

    it('should ignore comments between blocks', () => {
      const source = `--- core/text
Block 1
// Comment between blocks
--- core/text
Block 2`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(2);
    });
  });

  describe('content trimming', () => {
    it('should trim leading blank lines from content', () => {
      const source = `--- core/text



Content starts here`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toBe('Content starts here');
    });

    it('should trim trailing blank lines from content', () => {
      const source = `--- core/text

Content ends here



`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toBe('Content ends here');
    });

    it('should preserve blank lines within content', () => {
      const source = `--- core/text

First paragraph

Second paragraph`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toBe('First paragraph\n\nSecond paragraph');
    });

    it('should handle content with only blank lines', () => {
      const source = `--- core/text



`;
      const doc = parse(source);
      expect(doc.blocks[0].content).toBe('');
    });
  });

  describe('position tracking', () => {
    it('should track block start and end positions', () => {
      const source = `--- core/text
Content`;
      const doc = parse(source);
      expect(doc.blocks[0].position.start.line).toBe(1);
      expect(doc.blocks[0].position.end.line).toBeGreaterThanOrEqual(1);
    });

    it('should track positions for container blocks', () => {
      const source = `--- core/section

--- core/card

--- /core/section`;
      const doc = parse(source);
      expect(doc.blocks[0].position.start.line).toBe(1);
      expect(doc.blocks[0].position.end.line).toBe(5);
    });
  });

  describe('full document parsing', () => {
    it('should parse document with meta and multiple blocks', () => {
      const source = `--- meta
title: Test

--- core/header
logo: logo.png

--- core/text

Body content

--- core/footer

Footer content`;
      const doc = parse(source);
      expect(doc.meta.title).toBe('Test');
      expect(doc.blocks).toHaveLength(3);
      expect(doc.blocks[0].blockType).toBe('core/header');
      expect(doc.blocks[1].blockType).toBe('core/text');
      expect(doc.blocks[2].blockType).toBe('core/footer');
    });

    it('should handle complex nested structure', () => {
      const source = `--- newsletter/category: Tech

--- newsletter/item
image: img1.jpg

First item

--- newsletter/item

Second item

--- /newsletter/category`;
      const doc = parse(source);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].children).toHaveLength(2);
      expect(doc.blocks[0].children[0].properties.image).toBe('img1.jpg');
      expect(doc.blocks[0].children[0].content).toBe('First item');
      expect(doc.blocks[0].children[1].content).toBe('Second item');
    });
  });
});
