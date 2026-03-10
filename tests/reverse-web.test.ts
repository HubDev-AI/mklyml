import { describe, it, expect } from 'bun:test';
import { mkly, CORE_KIT, htmlToMkly, detectOrigin, reverseWeb, htmlToMarkdown } from '../src/index';
import { extractMklyMeta } from '../src/reverse/utils';

describe('reverse web parser', () => {
  describe('detectOrigin', () => {
    it('should detect mkly web output', () => {
      const html = '<main class="mkly-document"><div class="mkly-text">Hi</div></main>';
      expect(detectOrigin(html)).toBe('mkly-web');
    });

    it('should detect generic HTML', () => {
      expect(detectOrigin('<p>Hello</p>')).toBe('generic');
    });

    it('should detect email with mso comments', () => {
      const html = '<!--[if mso]><noscript></noscript><![endif]--><table role="presentation">test</table>';
      expect(detectOrigin(html)).toBe('mkly-email');
    });
  });

  describe('htmlToMarkdown', () => {
    it('should convert bold', () => {
      expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
    });

    it('should convert italic', () => {
      expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*');
    });

    it('should convert links', () => {
      expect(htmlToMarkdown('<a href="https://example.com">click</a>')).toBe('[click](https://example.com)');
    });

    it('should convert headings', () => {
      expect(htmlToMarkdown('<h2>Title</h2>')).toBe('## Title');
    });

    it('should decode entities', () => {
      expect(htmlToMarkdown('&amp; &lt; &gt;')).toBe('& < >');
    });

    it('should strip unknown tags', () => {
      expect(htmlToMarkdown('<div><span>text</span></div>')).toBe('text');
    });

    it('should handle list items', () => {
      const result = htmlToMarkdown('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });
  });

  describe('reverseWeb — basic blocks', () => {
    it('should reverse a text block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello world', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/text');
      expect(reversed).toContain('Hello world');
    });

    it('should reverse a heading block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/heading\nlevel: 2\n\nMy Title', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/heading');
      expect(reversed).toContain('level: 2');
    });

    it('should reverse an image block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/image\nsrc: https://example.com/photo.jpg\nalt: A photo', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/image');
      expect(reversed).toContain('src: https://example.com/photo.jpg');
      expect(reversed).toContain('alt: A photo');
    });

    it('should reverse a button block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/button\nurl: https://example.com\nlabel: Click Me', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/button');
      expect(reversed).toContain('url: https://example.com');
      expect(reversed).toContain('label: Click Me');
    });

    it('should reverse a divider block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/divider', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/divider');
    });

    it('should reverse a spacer block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\nheight: 40', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/spacer');
      expect(reversed).toContain('height: 40');
    });

    it('should reverse a quote block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/quote\nauthor: Alice\n\nWise words here.', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/quote');
      expect(reversed).toContain('author: Alice');
      expect(reversed).toContain('Wise words');
    });

    it('should reverse a code block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/code\nlang: js\n\nconsole.log("hi")', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/code');
      expect(reversed).toContain('lang: js');
      expect(reversed).toContain('console.log');
    });

    it('should reverse a header block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/header\nlogo: https://example.com/logo.png\ntitle: My Site', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/header');
      expect(reversed).toContain('logo: https://example.com/logo.png');
      expect(reversed).toContain('title: My Site');
    });

    it('should reverse a footer block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/footer\n\nBuilt with mkly', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/footer');
      expect(reversed).toContain('Built with mkly');
    });

    it('should reverse a cta block', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/cta\nurl: https://example.com\nbuttonText: Go\n\nClick now!', { kits: { core: CORE_KIT } }).html;
      const reversed = reverseWeb(html);
      expect(reversed).toContain('--- core/cta');
      expect(reversed).toContain('url: https://example.com');
      expect(reversed).toContain('buttonText: Go');
    });
  });

  describe('htmlToMkly — unified API', () => {
    it('should auto-detect mkly web output', () => {
      const html = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nAuto-detected', { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/text');
      expect(reversed).toContain('Auto-detected');
    });

    it('should accept explicit origin', () => {
      const html = '<p>Hello world</p>';
      const reversed = htmlToMkly(html, { origin: 'generic' });
      expect(reversed).toContain('Hello world');
    });

    it('should handle empty HTML', () => {
      const reversed = htmlToMkly('<main class="mkly-document" style="max-width:600px;margin:0 auto;"></main>');
      expect(reversed).toBeDefined();
    });
  });

  describe('round-trip: mkly → HTML → reverse', () => {
    it('should round-trip simple text', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nSimple text content';
      const html = mkly(source, { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/text');
      expect(reversed).toContain('Simple text content');
    });

    it('should round-trip heading with level', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/heading\nlevel: 3\n\nHeading Text';
      const html = mkly(source, { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/heading');
      expect(reversed).toContain('level: 3');
      expect(reversed).toContain('Heading Text');
    });

    it('should round-trip image with properties', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/image\nsrc: https://example.com/photo.jpg\nalt: Test image';
      const html = mkly(source, { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/image');
      expect(reversed).toContain('src: https://example.com/photo.jpg');
      expect(reversed).toContain('alt: Test image');
    });

    it('should round-trip header with logo and title', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/header\nlogo: https://example.com/logo.png\ntitle: My Newsletter';
      const html = mkly(source, { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/header');
      expect(reversed).toContain('logo: https://example.com/logo.png');
      expect(reversed).toContain('title: My Newsletter');
    });

    it('should round-trip spacer with height', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/spacer\nheight: 40';
      const html = mkly(source, { kits: { core: CORE_KIT } }).html;
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/spacer');
      expect(reversed).toContain('height: 40');
    });

    it('should parse spacer height when browser adds space after colon', () => {
      // Browsers normalize inline styles: "height:40px" → "height: 40px"
      const browserHtml = '<main class="mkly-document" style="max-width:600px;margin:0 auto;"><div class="mkly-core-spacer" style="height: 40px;"></div></main>';
      const reversed = htmlToMkly(browserHtml);
      expect(reversed).toContain('height: 40');
    });

    it('should round-trip document with spacer after browser style normalization', () => {
      const source = '--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello\n\n--- core/spacer\nheight: 20\n\n--- core/text\n\nWorld';
      const compiled = mkly(source, { kits: { core: CORE_KIT } });
      // Simulate browser normalizing inline styles (adding spaces after colons)
      const browserHtml = compiled.html.replace(/style="([^"]*)"/g, (_m, style: string) =>
        `style="${style.replace(/:\s*/g, ': ')}"`,
      );
      const reversed = htmlToMkly(browserHtml);
      const recompiled = mkly(reversed, { kits: { core: CORE_KIT }, sourceMap: true });
      const fatalErrors = recompiled.errors.filter(e => e.severity === 'error');
      expect(fatalErrors).toHaveLength(0);
    });
  });

  describe('extractMklyMeta — attribute order robustness', () => {
    it('should extract meta with name-first order (compiler output)', () => {
      const html = '<meta name="mkly:use" content="core"><meta name="mkly:version" content="1">';
      const result = extractMklyMeta(html);
      expect(result.uses).toEqual(['core']);
      expect(result.meta.version).toBe('1');
    });

    it('should extract meta with content-first order (browser outerHTML)', () => {
      const html = '<meta content="newsletter" name="mkly:use"><meta content="1" name="mkly:version">';
      const result = extractMklyMeta(html);
      expect(result.uses).toEqual(['newsletter']);
      expect(result.meta.version).toBe('1');
    });

    it('should extract mixed attribute orderings', () => {
      const html = [
        '<meta name="mkly:use" content="core">',
        '<meta content="newsletter" name="mkly:use">',
        '<meta name="mkly:version" content="1">',
        '<meta content="My Newsletter" name="mkly:title">',
      ].join('\n');
      const result = extractMklyMeta(html);
      expect(result.uses).toEqual(['core', 'newsletter']);
      expect(result.meta.version).toBe('1');
      expect(result.meta.title).toBe('My Newsletter');
    });

    it('should extract themes and presets with reversed attribute order', () => {
      const html = '<meta content="graphite" name="mkly:theme"><meta content="editorial" name="mkly:preset">';
      const result = extractMklyMeta(html);
      expect(result.themes).toEqual(['graphite']);
      expect(result.presets).toEqual(['editorial']);
    });

    it('should handle self-closing tags in both orders', () => {
      const html = '<meta name="mkly:use" content="core" /><meta content="1" name="mkly:version" />';
      const result = extractMklyMeta(html);
      expect(result.uses).toEqual(['core']);
      expect(result.meta.version).toBe('1');
    });

    it('should decode HTML entities in values', () => {
      const html = '<meta content="Tom &amp; Jerry" name="mkly:title">';
      const result = extractMklyMeta(html);
      expect(result.meta.title).toBe('Tom & Jerry');
    });

    it('should produce valid reversed source from browser-ordered meta', () => {
      // Simulate what happens when browser serializes meta tags with content first
      const source = '--- use: core\n\n--- meta\nversion: 1\ntitle: Test\n\n--- core/text\n\nHello';
      const compiled = mkly(source, { kits: { core: CORE_KIT } });

      // Simulate browser reversing attribute order in outerHTML
      const browserHtml = compiled.html
        .replace(/<meta name="(mkly:[^"]+)" content="([^"]*)">/g, '<meta content="$2" name="$1">');

      const reversed = htmlToMkly(browserHtml);
      const recompiled = mkly(reversed, { kits: { core: CORE_KIT }, sourceMap: true });
      const fatalErrors = recompiled.errors.filter(e => e.severity === 'error');
      expect(fatalErrors).toHaveLength(0);
    });
  });

  describe('reverseWeb — document extraction edge cases', () => {
    it('should not leak sibling content when mkly-document is wrapped', () => {
      const innerHtml = '<div class="mkly-core-text" data-mkly-line="5"><p>Hello</p></div>';
      const wrappedHtml = `<div class="outer"><div class="mkly-document">${innerHtml}</div><div class="sidebar">sidebar content</div></div>`;
      const reversed = htmlToMkly(wrappedHtml);
      expect(reversed).toContain('Hello');
      expect(reversed).not.toContain('sidebar');
    });

    it('should handle mkly-document as main element', () => {
      const html = '<main class="mkly-document" style="max-width:600px;margin:0 auto;"><div class="mkly-core-text"><p>Content</p></div></main>';
      const reversed = htmlToMkly(html);
      expect(reversed).toContain('--- core/text');
      expect(reversed).toContain('Content');
    });
  });
});
