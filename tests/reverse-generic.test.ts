import { describe, it, expect } from 'bun:test';
import { reverseGeneric, htmlToMkly } from '../src/index';

describe('reverse generic parser', () => {
  it('should wrap HTML in core/html block with preamble', () => {
    const result = reverseGeneric('<p>Hello world</p>');
    expect(result).toContain('--- meta');
    expect(result).toContain('--- use: core');
    expect(result).toContain('--- core/html');
    expect(result).toContain('<p>Hello world</p>');
    expect(result).toContain('--- /core/html');
  });

  it('should handle empty HTML', () => {
    const result = reverseGeneric('');
    expect(result).toBe('');
  });

  it('should strip script tags for security', () => {
    const result = reverseGeneric('<script>alert("xss")</script><p>Content</p>');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Content');
  });

  it('should preserve style tags', () => {
    const result = reverseGeneric('<style>.x { color: red }</style><p>Content</p>');
    expect(result).toContain('<style>');
    expect(result).toContain('Content');
  });

  it('should extract body content from full HTML document', () => {
    const html = '<html><head><title>Test</title></head><body><div>Content</div></body></html>';
    const result = reverseGeneric(html);
    expect(result).toContain('<div>Content</div>');
    expect(result).not.toContain('<html>');
    expect(result).not.toContain('<head>');
  });

  it('should preserve all HTML structure verbatim', () => {
    const html = '<div class="card"><img src="thumb.jpg"><h3>Title</h3><a href="/read">Read</a></div>';
    const result = reverseGeneric(html);
    expect(result).toContain('--- core/html');
    expect(result).toContain(html);
    expect(result).toContain('--- /core/html');
  });

  it('should handle complex nested HTML', () => {
    const html = '<table><tr><td><div><p>Nested</p></div></td></tr></table>';
    const result = reverseGeneric(html);
    expect(result).toContain('--- core/html');
    expect(result).toContain('<table>');
    expect(result).toContain('--- /core/html');
  });

  it('should use generic parser via htmlToMkly with origin override', () => {
    const result = htmlToMkly('<p>Generic content</p>', { origin: 'generic' });
    expect(result).toContain('--- core/html');
    expect(result).toContain('<p>Generic content</p>');
  });

  it('should return empty for whitespace-only content', () => {
    const result = reverseGeneric('   \n  \t  ');
    expect(result).toBe('');
  });

  it('should return empty for script-only content', () => {
    const result = reverseGeneric('<script>var x = 1;</script>');
    expect(result).toBe('');
  });
});
