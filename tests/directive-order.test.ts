import { describe, it, expect } from 'bun:test';
import { parse } from '../src/parser';

describe('directive ordering enforcement', () => {
  describe('valid ordering', () => {
    it('should accept canonical order: use → theme → preset → meta → style → blocks', () => {
      const doc = parse(`--- use: newsletter
--- theme: brutalist
--- preset: default
--- meta
title: Test
--- style
core/text
  color: red
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept use → define-theme → theme → preset → meta → style → blocks', () => {
      const doc = parse(`--- use: newsletter
--- define-theme: custom
bg: #fff
fg: #000
--- theme: custom
--- preset: default
--- meta
title: Test
--- style
core/text
  color: red
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept partial ordering (only some directives)', () => {
      const doc = parse(`--- use: newsletter
--- meta
title: Test
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept no directives (just blocks)', () => {
      const doc = parse(`--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept multiple uses followed by theme', () => {
      const doc = parse(`--- use: newsletter
--- use: docs
--- theme: brutalist
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept define-theme and define-preset together', () => {
      const doc = parse(`--- use: newsletter
--- define-theme: custom
bg: #fff
--- define-preset: custom
.mkly-document { padding: 10px; }
--- theme: custom
--- preset: custom
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should accept meta before style', () => {
      const doc = parse(`--- meta
title: Test
--- style
core/text
  color: red
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });
  });

  describe('use ordering violations', () => {
    it('should error when use appears after meta', () => {
      const doc = parse(`--- meta
title: Test
--- use: newsletter
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- use:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- meta"');
    });

    it('should error when use appears after theme', () => {
      const doc = parse(`--- theme: brutalist
--- use: newsletter
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- use:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- theme:"');
    });

    it('should error when use appears after style', () => {
      const doc = parse(`--- style
core/text
  color: red
--- use: newsletter
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- use:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- style"');
    });

    it('should error when use appears after content blocks', () => {
      const doc = parse(`--- core/text
Hello
--- use: newsletter`);
      const errors = doc.errors.filter(e => e.message.includes('"--- use:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('content blocks');
    });

    it('should error when use appears after define-theme', () => {
      const doc = parse(`--- define-theme: custom
bg: #fff
--- use: newsletter`);
      const errors = doc.errors.filter(e => e.message.includes('"--- use:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('define-theme/define-preset');
    });
  });

  describe('define ordering violations', () => {
    it('should error when define-theme appears after theme', () => {
      const doc = parse(`--- theme: brutalist
--- define-theme: custom
bg: #fff
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- define-theme:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- theme:"');
    });

    it('should error when define-preset appears after meta', () => {
      const doc = parse(`--- meta
title: Test
--- define-preset: custom
.mkly-document { padding: 10px; }
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- define-preset:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- meta"');
    });
  });

  describe('theme/preset ordering violations', () => {
    it('should error when theme appears after meta', () => {
      const doc = parse(`--- meta
title: Test
--- theme: brutalist
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- theme:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- meta"');
    });

    it('should error when preset appears after meta', () => {
      const doc = parse(`--- meta
title: Test
--- preset: default
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- preset:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- meta"');
    });

    it('should error when theme appears after style', () => {
      const doc = parse(`--- style
core/text
  color: red
--- theme: brutalist
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- theme:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- style"');
    });

    it('should error when preset appears after content blocks', () => {
      const doc = parse(`--- core/text
Hello
--- preset: default`);
      const errors = doc.errors.filter(e => e.message.includes('"--- preset:"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('content blocks');
    });
  });

  describe('meta ordering violations', () => {
    it('should error when meta appears after style', () => {
      const doc = parse(`--- style
core/text
  color: red
--- meta
title: Test
--- core/text
Hello`);
      const errors = doc.errors.filter(e => e.message.includes('"--- meta"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('"--- style"');
    });

    it('should error when meta appears after content blocks', () => {
      const doc = parse(`--- core/text
Hello
--- meta
title: Test`);
      const errors = doc.errors.filter(e => e.message.includes('"--- meta"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('content blocks');
    });
  });

  describe('style ordering violations', () => {
    it('should error when style appears after content blocks', () => {
      const doc = parse(`--- core/text
Hello
--- style
core/text
  color: red`);
      const errors = doc.errors.filter(e => e.message.includes('"--- style"') && e.message.includes('must appear before'));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('content blocks');
    });
  });

  describe('multiple violations', () => {
    it('should report all ordering errors', () => {
      const doc = parse(`--- meta
title: Test
--- use: newsletter
--- theme: brutalist
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      // use after meta = error, theme after meta = error
      expect(orderErrors.length).toBeGreaterThanOrEqual(2);
    });

    it('should report errors for fully reversed order', () => {
      const doc = parse(`--- core/text
Hello
--- style
core/text
  color: red
--- meta
title: Test
--- theme: brutalist
--- use: newsletter`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      // style after blocks, meta after blocks, theme after blocks, use after blocks
      expect(orderErrors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('edge cases', () => {
    it('should allow multiple themes in sequence', () => {
      const doc = parse(`--- theme: brutalist
--- theme: sunset
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should allow multiple presets in sequence', () => {
      const doc = parse(`--- preset: default
--- preset: compact
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should allow theme and preset interleaved', () => {
      const doc = parse(`--- theme: brutalist
--- preset: default
--- theme: sunset
--- core/text
Hello`);
      const orderErrors = doc.errors.filter(e => e.message.includes('must appear before'));
      expect(orderErrors).toHaveLength(0);
    });

    it('should still parse directives even with ordering errors', () => {
      const doc = parse(`--- meta
title: Test
--- use: newsletter
--- core/text
Hello`);
      expect(doc.uses).toContain('newsletter');
      expect(doc.meta.title).toBe('Test');
      expect(doc.blocks).toHaveLength(1);
    });
  });
});
