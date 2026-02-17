import { describe, it, expect } from 'bun:test';
import { markdownToHtml } from '../src/utils';

describe('markdownToHtml', () => {
  // ===== Basic Elements =====

  it('renders paragraphs', () => {
    expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('renders multiple paragraphs separated by blank lines', () => {
    const result = markdownToHtml('First\n\nSecond');
    expect(result).toContain('<p>First</p>');
    expect(result).toContain('<p>Second</p>');
  });

  it('renders h1', () => {
    expect(markdownToHtml('# Title')).toBe('<h1>Title</h1>');
  });

  it('renders h2', () => {
    expect(markdownToHtml('## Subtitle')).toBe('<h2>Subtitle</h2>');
  });

  it('renders h3', () => {
    expect(markdownToHtml('### Section')).toBe('<h3>Section</h3>');
  });

  // ===== Unordered Lists =====

  it('renders unordered list with - prefix', () => {
    const result = markdownToHtml('- Item one\n- Item two');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item one</li>');
    expect(result).toContain('<li>Item two</li>');
    expect(result).toContain('</ul>');
  });

  it('renders unordered list with * prefix', () => {
    const result = markdownToHtml('* Item one\n* Item two');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item one</li>');
    expect(result).toContain('<li>Item two</li>');
    expect(result).toContain('</ul>');
  });

  it('can mix - and * in the same list', () => {
    const result = markdownToHtml('- Item one\n* Item two\n- Item three');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item one</li>');
    expect(result).toContain('<li>Item two</li>');
    expect(result).toContain('<li>Item three</li>');
  });

  // ===== Ordered Lists =====

  it('renders ordered list', () => {
    const result = markdownToHtml('1. First\n2. Second');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First</li>');
    expect(result).toContain('<li>Second</li>');
    expect(result).toContain('</ol>');
  });

  it('handles ) separator in ordered lists', () => {
    const result = markdownToHtml('1) First\n2) Second');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First</li>');
  });

  // ===== Inline Formatting =====

  it('renders bold text', () => {
    expect(markdownToHtml('Some **bold** text')).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    expect(markdownToHtml('Some *italic* text')).toContain('<em>italic</em>');
  });

  it('renders code', () => {
    expect(markdownToHtml('Use `code` here')).toContain('<code>code</code>');
  });

  it('renders strikethrough', () => {
    expect(markdownToHtml('~~deleted~~')).toContain('<del>deleted</del>');
  });

  it('renders links', () => {
    const result = markdownToHtml('[Click](https://example.com)');
    expect(result).toContain('<a href="https://example.com">Click</a>');
  });

  it('rejects unsafe URLs', () => {
    const result = markdownToHtml('[Click](javascript:alert(1))');
    expect(result).not.toContain('<a');
    expect(result).toContain('Click');
  });

  // ===== Class Annotations =====

  it('adds class from {.className} annotation on paragraphs', () => {
    const result = markdownToHtml('Hello {.highlight}');
    expect(result).toBe('<p class="highlight">Hello</p>');
  });

  it('adds class from {.sN} annotation on list items', () => {
    const result = markdownToHtml('- Item one {.s1}\n- Item two');
    expect(result).toContain('<li class="s1">Item one</li>');
    expect(result).toContain('<li>Item two</li>');
  });

  it('adds class on headings', () => {
    expect(markdownToHtml('## Title {.featured}')).toBe('<h2 class="featured">Title</h2>');
  });

  it('strips annotation from rendered text', () => {
    const result = markdownToHtml('Hello {.s1}');
    expect(result).not.toContain('{.s1}');
    expect(result).toContain('Hello');
  });

  it('handles class annotation with * list items', () => {
    const result = markdownToHtml('* Item {.s2}');
    expect(result).toContain('<li class="s2">Item</li>');
  });

  it('class annotation with inline formatting', () => {
    const result = markdownToHtml('- **Bold item** {.s1}');
    expect(result).toContain('class="s1"');
    expect(result).toContain('<strong>Bold item</strong>');
  });

  // ===== Line Map =====

  it('adds data-mkly-line when lineMap is provided', () => {
    const result = markdownToHtml('Hello\nWorld', [5, 6]);
    expect(result).toContain('data-mkly-line="5"');
    expect(result).toContain('data-mkly-line="6"');
  });

  // ===== Non-breaking Spaces =====

  it('converts \\~ to &nbsp;', () => {
    const result = markdownToHtml('Hello\\~World');
    expect(result).toContain('Hello&nbsp;World');
  });

  // ===== Edge Cases =====

  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('handles single blank line', () => {
    expect(markdownToHtml('\n')).toBe('');
  });

  it('closes list before heading', () => {
    const result = markdownToHtml('- Item\n# Heading');
    expect(result).toContain('</ul>');
    expect(result).toContain('<h1>Heading</h1>');
    const ulClose = result.indexOf('</ul>');
    const h1Open = result.indexOf('<h1>');
    expect(ulClose).toBeLessThan(h1Open);
  });

  it('closes list before paragraph', () => {
    const result = markdownToHtml('- Item\n\nParagraph');
    expect(result).toContain('</ul>');
    expect(result).toContain('<p>Paragraph</p>');
  });

  it('handles ordered to unordered transition', () => {
    const result = markdownToHtml('1. Ordered\n\n- Unordered');
    expect(result).toContain('</ol>');
    expect(result).toContain('<ul>');
  });
});
