import { describe, it, expect } from 'bun:test';
import { stripContent, injectSampleContent } from '../src/template-ops';
import { parse } from '../src/parser';
import { CORE_KIT } from '../src/blocks';
import type { MklyKit } from '../src/kit';

// Minimal newsletter kit for testing (just block definitions with contentHints)
const NEWSLETTER_KIT_STUB: MklyKit = {
  name: 'newsletter',
  blocks: [
    {
      name: 'intro',
      contentMode: 'text',
      contentHints: { contentBody: true },
      compile: () => '',
    },
    {
      name: 'featured',
      contentMode: 'mixed',
      contentHints: { contentProps: ['image', 'source', 'author', 'link'], contentBody: true },
      compile: () => '',
    },
    {
      name: 'category',
      contentMode: 'properties',
      isContainer: true,
      contentHints: { contentChildren: true },
      compile: () => '',
    },
    {
      name: 'item',
      contentMode: 'mixed',
      contentHints: { contentProps: ['image', 'source', 'link'], contentBody: true },
      compile: () => '',
    },
    {
      name: 'quickHits',
      contentMode: 'text',
      contentHints: { contentBody: true },
      compile: () => '',
    },
    {
      name: 'outro',
      contentMode: 'mixed',
      contentHints: { contentBody: true },
      compile: () => '',
    },
    {
      name: 'custom',
      contentMode: 'mixed',
      contentHints: { contentBody: true },
      compile: () => '',
    },
  ],
};

const KITS = { core: CORE_KIT, newsletter: NEWSLETTER_KIT_STUB };

describe('template-ops', () => {
  describe('stripContent', () => {
    it('strips content body from text blocks', () => {
      const source = `--- meta
version: 1

--- core/text

This is sample text that should be stripped.
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('--- core/text');
      expect(result).not.toContain('This is sample text');
    });

    it('strips content properties from featured block', () => {
      const source = `--- meta
version: 1

--- newsletter/featured
image: https://example.com/img.jpg
source: TechCrunch
author: Jane Doe
link: https://example.com/article

A featured article summary.
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('--- newsletter/featured');
      expect(result).not.toContain('image:');
      expect(result).not.toContain('source:');
      expect(result).not.toContain('author:');
      expect(result).not.toContain('link:');
      expect(result).not.toContain('A featured article summary');
    });

    it('strips children from category blocks', () => {
      const source = `--- meta
version: 1

--- newsletter/category
title: Technology

--- newsletter/item
source: Blog
link: https://example.com

Some item content.

--- /newsletter/category
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('--- newsletter/category');
      expect(result).toContain('title: Technology');
      expect(result).not.toContain('--- newsletter/item');
      expect(result).not.toContain('Some item content');
    });

    it('preserves structural properties', () => {
      const source = `--- meta
version: 1

--- core/heading
level: 2

Sample Heading Text
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('level: 2');
      expect(result).not.toContain('Sample Heading Text');
    });

    it('preserves meta, use, theme, preset, and style blocks', () => {
      const source = `--- use: newsletter

--- meta
version: 1
title: My Newsletter

--- theme: dark

--- preset: glass

--- style
core/heading
  color: red

--- core/text

This will be stripped.
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('--- use: newsletter');
      expect(result).toContain('version: 1');
      expect(result).toContain('title: My Newsletter');
      expect(result).toContain('--- theme: dark');
      expect(result).toContain('--- preset: glass');
      expect(result).toContain('--- style');
      expect(result).toContain('core/heading');
      expect(result).toContain('color: red');
      expect(result).not.toContain('This will be stripped');
    });

    it('preserves divider and spacer blocks completely (no contentHints)', () => {
      const source = `--- meta
version: 1

--- core/divider

--- core/spacer
height: 40
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('--- core/divider');
      expect(result).toContain('--- core/spacer');
      expect(result).toContain('height: 40');
    });

    it('preserves header block completely (no contentHints on header)', () => {
      const source = `--- meta
version: 1

--- core/header
logo: https://example.com/logo.png
title: My Newsletter
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('logo: https://example.com/logo.png');
      expect(result).toContain('title: My Newsletter');
    });

    it('strips src from image but keeps alt', () => {
      const source = `--- meta
version: 1

--- core/image
src: https://example.com/photo.jpg
alt: A scenic view
`;
      const result = stripContent(source, KITS);
      expect(result).toContain('alt: A scenic view');
      expect(result).not.toContain('src:');
    });
  });

  describe('injectSampleContent', () => {
    it('injects content body into empty text block', () => {
      const source = `--- meta
version: 1

--- core/text
`;
      const result = injectSampleContent(source, KITS);
      expect(result).toContain('--- core/text');
      // Should have some sample content injected
      const doc = parse(result);
      const textBlock = doc.blocks.find(b => b.blockType === 'core/text');
      expect(textBlock?.content).toBeTruthy();
    });

    it('injects properties into empty featured block', () => {
      const source = `--- meta
version: 1

--- newsletter/featured
`;
      const result = injectSampleContent(source, KITS);
      expect(result).toContain('image:');
      expect(result).toContain('source:');
      expect(result).toContain('link:');
    });

    it('injects children into empty category block', () => {
      const source = `--- meta
version: 1

--- newsletter/category
title: Technology

--- /newsletter/category
`;
      const result = injectSampleContent(source, KITS);
      expect(result).toContain('--- newsletter/item');
    });

    it('does not overwrite existing content', () => {
      const source = `--- meta
version: 1

--- core/text

Existing content that should stay.
`;
      const result = injectSampleContent(source, KITS);
      expect(result).toContain('Existing content that should stay.');
    });

    it('does not overwrite existing properties', () => {
      const source = `--- meta
version: 1

--- newsletter/featured
source: My Source

Already has a summary.
`;
      const result = injectSampleContent(source, KITS);
      expect(result).toContain('source: My Source');
      expect(result).toContain('Already has a summary.');
      // Should still inject missing props
      expect(result).toContain('image:');
      expect(result).toContain('link:');
    });
  });

  describe('round-trip: strip then inject', () => {
    it('strip→inject produces compilable source', () => {
      const source = `--- use: newsletter

--- meta
version: 1
title: Weekly Digest

--- theme: dark

--- style
core/heading
  color: red

--- core/header
logo: https://example.com/logo.png
title: My Newsletter

--- newsletter/intro

Welcome to this week's edition.

--- newsletter/category
title: Top Stories

--- newsletter/featured
image: https://example.com/img.jpg
source: TechCrunch
author: Jane Doe
link: https://example.com

A featured article summary.

--- newsletter/item
source: Blog
link: https://example.com/post

Short summary.

--- /newsletter/category

--- newsletter/outro
ctaUrl: https://example.com/share
ctaText: Share this issue

Thanks for reading!
`;
      const stripped = stripContent(source, KITS);
      const injected = injectSampleContent(stripped, KITS);

      // The injected source should parse without errors (except version warning)
      const doc = parse(injected);
      const realErrors = doc.errors.filter(e => e.severity === 'error' && !e.message.includes('version'));
      expect(realErrors).toHaveLength(0);

      // Should preserve structural elements
      expect(injected).toContain('--- use: newsletter');
      expect(injected).toContain('title: Weekly Digest');
      expect(injected).toContain('--- theme: dark');
      expect(injected).toContain('--- core/header');
      expect(injected).toContain('logo: https://example.com/logo.png');

      // Should have sample content
      const blocks = doc.blocks;
      const introBlock = blocks.find(b => b.blockType === 'newsletter/intro');
      expect(introBlock?.content).toBeTruthy();

      const categoryBlock = blocks.find(b => b.blockType === 'newsletter/category');
      expect(categoryBlock?.properties.title).toBe('Top Stories');
      expect(categoryBlock?.children.length).toBeGreaterThan(0);
    });
  });
});
