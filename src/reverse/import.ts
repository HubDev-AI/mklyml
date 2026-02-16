import type { MklyKit, ParsedBlock, ImportPattern } from '../kit';
import { htmlToMarkdown } from './html-to-markdown';
import { VOID_TAGS } from './utils';

export interface ImportOptions {
  kits?: Record<string, MklyKit>;
  aggressive?: boolean;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function importHtml(html: string, options?: ImportOptions): string {
  // Tier 1: Strip boilerplate
  let content = stripBoilerplate(html);

  // Tier 2: Unwrap table layouts
  content = unwrapTableLayouts(content);

  // Collect import patterns from kits
  const kitPatterns: ImportPattern[] = [];
  if (options?.kits) {
    for (const kit of Object.values(options.kits)) {
      if (kit.importPatterns) {
        kitPatterns.push(...kit.importPatterns);
      }
    }
  }

  // Split into sections and convert
  const sections = splitSections(content);
  const blocks: string[] = [];

  for (const section of sections) {
    // Try kit patterns first
    let matched = false;
    for (const pattern of kitPatterns) {
      if (pattern.detect(section)) {
        const parsed = pattern.parse(section);
        blocks.push(formatParsedBlock(parsed));
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Tier 3: Smart pattern matching
    const result = matchPattern(section, options);
    if (result) {
      blocks.push(result);
    }
  }

  return blocks.length > 0 ? blocks.join('\n\n') + '\n' : '';
}

// ---------------------------------------------------------------------------
// Tier 1: Strip boilerplate
// ---------------------------------------------------------------------------

function stripBoilerplate(html: string): string {
  let content = html;

  // Remove script tags
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove style tags
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  // Remove tracking pixels (1x1 images or tracking URLs)
  content = content.replace(
    /<img[^>]*(?:width\s*=\s*["']1["'][^>]*height\s*=\s*["']1["']|height\s*=\s*["']1["'][^>]*width\s*=\s*["']1["'])[^>]*\/?>/gi,
    '',
  );
  content = content.replace(
    /<img[^>]*(?:track|beacon|pixel|open|analytics|mailchimp\.com\/track|list-manage\.com)[^>]*\/?>/gi,
    '',
  );

  // Remove link tags
  content = content.replace(/<link[^>]*\/?>/gi, '');

  // Remove meta tags
  content = content.replace(/<meta[^>]*\/?>/gi, '');

  // Extract body content if present
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  } else {
    // Strip html/head wrappers even without body
    content = content.replace(/<\/?html[^>]*>/gi, '');
    content = content.replace(/<head[\s\S]*?<\/head>/gi, '');
  }

  return content.trim();
}

// ---------------------------------------------------------------------------
// Tier 2: Unwrap table layouts
// ---------------------------------------------------------------------------

function unwrapTableLayouts(html: string): string {
  let content = html;
  let changed = true;

  // Iteratively unwrap layout tables (max 10 passes to avoid infinite loops)
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;

    // Match table elements
    content = content.replace(
      /<table([^>]*)>([\s\S]*?)<\/table>/gi,
      (_match, attrs: string, inner: string) => {
        const isLayout =
          /width\s*=\s*["']100%["']/i.test(attrs) ||
          /role\s*=\s*["']presentation["']/i.test(attrs) ||
          /cellpadding|cellspacing/i.test(attrs);

        // Check for nested tables (strong layout signal)
        const hasNestedTable = /<table\b/i.test(inner);

        if (isLayout || hasNestedTable) {
          changed = true;
          // Extract cell contents
          return extractTableCells(inner);
        }

        // Keep data tables as-is
        return _match;
      },
    );
  }

  return content;
}

function extractTableCells(tableInner: string): string {
  const cells: string[] = [];
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;

  while ((match = tdRegex.exec(tableInner)) !== null) {
    const cellContent = match[1].trim();
    if (cellContent && !isEmptyCell(cellContent)) {
      cells.push(cellContent);
    }
  }

  if (cells.length === 0) {
    // Try extracting from tr directly if no td found
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableInner)) !== null) {
      const content = trMatch[1].trim();
      if (content && !isEmptyCell(content)) {
        cells.push(content);
      }
    }
  }

  return cells.length > 0 ? cells.join('\n\n') : '';
}

function isEmptyCell(content: string): boolean {
  // Strip tags and check if anything meaningful remains
  const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '\\~').trim();
  return text.length === 0;
}

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------

function splitSections(html: string): string[] {
  const sections: string[] = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(html[i])) i++;
    if (i >= len) break;

    if (html[i] === '<') {
      // Skip comments
      if (html.startsWith('<!--', i)) {
        const end = html.indexOf('-->', i + 4);
        i = end === -1 ? len : end + 3;
        continue;
      }

      // Match opening tag
      const tagMatch = html.slice(i).match(/^<(\/?)([a-zA-Z][\w-]*)([^>]*)>/);
      if (!tagMatch) { i++; continue; }

      const isClosing = tagMatch[1] === '/';
      const tagName = tagMatch[2].toLowerCase();
      const rawAttrs = tagMatch[3];
      const selfClose = rawAttrs.trimEnd().endsWith('/');
      const openLen = tagMatch[0].length;

      if (isClosing) {
        i += openLen;
        continue;
      }

      if (VOID_TAGS.has(tagName) || selfClose) {
        sections.push(tagMatch[0]);
        i += openLen;
        continue;
      }

      // Find matching closing tag, tracking depth
      const innerStart = i + openLen;
      let depth = 1;
      let j = innerStart;

      while (j < len && depth > 0) {
        const next = html.indexOf('<', j);
        if (next === -1) break;
        const closeMatch = html.slice(next).match(/^<(\/?)([a-zA-Z][\w-]*)(?:\s[^>]*)?\s*\/?>/);
        if (!closeMatch) { j = next + 1; continue; }

        const nextTag = closeMatch[2].toLowerCase();
        j = next + closeMatch[0].length;

        if (nextTag === tagName) {
          if (closeMatch[1] === '/') depth--;
          else if (!VOID_TAGS.has(nextTag) && !closeMatch[0].endsWith('/>')) depth++;
        }
      }

      const outerEnd = depth === 0 ? j : len;
      const outer = html.slice(i, outerEnd);
      if (outer.trim()) {
        sections.push(outer);
      }
      i = outerEnd;
    } else {
      // Text node
      const textEnd = html.indexOf('<', i);
      const text = textEnd === -1 ? html.slice(i) : html.slice(i, textEnd);
      if (text.trim()) {
        sections.push(text.trim());
      }
      i = textEnd === -1 ? len : textEnd;
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Tier 3: Smart pattern matching
// ---------------------------------------------------------------------------

function matchPattern(html: string, options?: ImportOptions): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  // Determine available kits
  const hasNewsletterKit = options?.kits ? 'newsletter' in options.kits : false;

  // 1. Hero: large image at top with overlaid text or hero-like class/structure
  if (isHeroPattern(trimmed)) {
    return buildHeroBlock(trimmed);
  }

  // 2. Header/Navigation
  if (isHeaderPattern(trimmed)) {
    return buildHeaderBlock(trimmed);
  }

  // 3. Card pattern: image + title + text + link
  if (isCardPattern(trimmed)) {
    return buildCardBlock(trimmed);
  }

  // 4. Big CTA button
  if (isCtaPattern(trimmed)) {
    return buildCtaBlock(trimmed);
  }

  // 5. Lists
  if (isListPattern(trimmed)) {
    return buildListBlock(trimmed, hasNewsletterKit);
  }

  // 6. Blockquote/testimonial
  if (isQuotePattern(trimmed)) {
    return buildQuoteBlock(trimmed);
  }

  // 7. Tip/callout box
  if (isTipPattern(trimmed)) {
    return buildTipBlock(trimmed, hasNewsletterKit);
  }

  // 8. Footer with social/unsubscribe
  if (isFooterPattern(trimmed)) {
    return buildFooterBlock(trimmed);
  }

  // 9. Heading elements
  const headingMatch = trimmed.match(/^<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>$/i);
  if (headingMatch) {
    const level = headingMatch[1][1];
    const text = htmlToMarkdown(headingMatch[2]);
    return `--- core/heading\nlevel: ${level}\n\n${text}`;
  }

  // 10. Paragraph text
  if (/^<p\b/i.test(trimmed)) {
    const text = htmlToMarkdown(trimmed);
    if (text.trim()) return `--- core/text\n\n${text}`;
    return null;
  }

  // 11. Image
  const imgMatch = trimmed.match(/^<img\b([^>]*)\/?>$/i);
  if (imgMatch) {
    return buildImageBlock(imgMatch[1]);
  }

  // 12. Horizontal rule
  if (/^<hr\b/i.test(trimmed)) {
    return '--- core/divider';
  }

  // Try to extract content from div/span wrappers
  if (/^<(?:div|span)\b/i.test(trimmed)) {
    const text = htmlToMarkdown(trimmed);
    if (text.trim()) return `--- core/text\n\n${text}`;
    return null;
  }

  // 13. Fallback: verbatim HTML
  return `--- core/html\n\n${trimmed}\n\n--- /core/html`;
}

// ---------------------------------------------------------------------------
// Pattern detectors
// ---------------------------------------------------------------------------

function isHeroPattern(html: string): boolean {
  const hasBackgroundImage = /background-image:\s*url\(/i.test(html);
  const hasHeroClass = /class="[^"]*(?:hero|banner|jumbotron)[^"]*"/i.test(html);
  const isFullWidthImage =
    /^<img\b[^>]*width\s*=\s*["'](?:100%|[5-9]\d\d|[1-9]\d{3,})["']/i.test(html);

  return hasBackgroundImage || hasHeroClass || isFullWidthImage;
}

function isHeaderPattern(html: string): boolean {
  if (/^<(?:nav|header)\b/i.test(html)) return true;
  if (/class="[^"]*(?:header|navbar|nav-bar|navigation)[^"]*"/i.test(html)) return true;
  // Logo + nav links pattern
  const hasLogo = /<img\b[^>]*(?:logo)[^>]*>/i.test(html);
  const hasNavLinks = (html.match(/<a\b/gi) ?? []).length >= 3;
  return hasLogo && hasNavLinks;
}

function isCardPattern(html: string): boolean {
  const hasImg = /<img\b/i.test(html);
  const hasLink = /<a\b/i.test(html);
  const hasHeading = /<h[1-6]\b/i.test(html);
  const hasText = /<p\b/i.test(html);
  if (/class="[^"]*card[^"]*"/i.test(html)) return true;
  return hasImg && (hasHeading || hasText) && hasLink && html.length < 3000;
}

function isCtaPattern(html: string): boolean {
  // Large centered button-like link
  const buttonLink = html.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
  if (!buttonLink) return false;

  const attrs = buttonLink[1];
  const hasButtonStyle =
    /padding\s*:\s*\d{2,}/i.test(attrs) ||
    /class="[^"]*(?:btn|button|cta)[^"]*"/i.test(attrs) ||
    /role\s*=\s*["']button["']/i.test(attrs) ||
    /background-color/i.test(attrs);
  const isCentered = /text-align\s*:\s*center/i.test(html);

  return hasButtonStyle && (isCentered || /class="[^"]*(?:cta|call-to-action)[^"]*"/i.test(html));
}

function isListPattern(html: string): boolean {
  return /^<[uo]l\b/i.test(html);
}

function isQuotePattern(html: string): boolean {
  if (/^<blockquote\b/i.test(html)) return true;
  if (/class="[^"]*(?:quote|testimonial|review|pullquote)[^"]*"/i.test(html)) return true;
  return false;
}

function isTipPattern(html: string): boolean {
  if (/class="[^"]*(?:tip|callout|alert|notice|info-box|warning)[^"]*"/i.test(html)) return true;
  // Check for callout-like styling: background + border-left
  const hasBackground = /background(?:-color)?\s*:/i.test(html);
  const hasBorderLeft = /border-left\s*:/i.test(html);
  return hasBackground && hasBorderLeft;
}

function isFooterPattern(html: string): boolean {
  if (/^<footer\b/i.test(html)) return true;
  const hasSocialLinks =
    /(?:twitter|facebook|instagram|linkedin|youtube|x\.com)/i.test(html);
  const hasUnsubscribe = /unsubscribe/i.test(html);
  return hasSocialLinks && hasUnsubscribe;
}

// ---------------------------------------------------------------------------
// Block builders
// ---------------------------------------------------------------------------

function buildHeroBlock(html: string): string {
  const lines = ['--- core/hero'];
  const bgMatch = html.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
  const imgMatch = html.match(/<img\b[^>]*src="([^"]*)"[^>]*>/i);
  if (bgMatch?.[1]) lines.push(`image: ${bgMatch[1]}`);
  else if (imgMatch?.[1]) lines.push(`image: ${imgMatch[1]}`);

  const text = htmlToMarkdown(html);
  if (text.trim()) lines.push('', text);
  return lines.join('\n');
}

function buildHeaderBlock(html: string): string {
  const lines = ['--- core/header'];
  const logoMatch = html.match(/<img\b[^>]*src="([^"]*)"[^>]*>/i);
  const titleMatch = html.match(/<(?:h1|h2)\b[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i);

  if (logoMatch?.[1]) lines.push(`logo: ${logoMatch[1]}`);
  if (titleMatch?.[1]) lines.push(`title: ${htmlToMarkdown(titleMatch[1])}`);

  if (!logoMatch && !titleMatch) {
    const text = htmlToMarkdown(html);
    if (text.trim()) lines.push('', text);
  }

  return lines.join('\n');
}

function buildCardBlock(html: string): string {
  const lines = ['--- core/card'];
  const imgMatch = html.match(/<img\b[^>]*src="([^"]*)"[^>]*>/i);
  const linkMatch = html.match(/<a\b[^>]*href="([^"]*)"[^>]*>/i);

  if (imgMatch?.[1]) lines.push(`image: ${imgMatch[1]}`);
  if (linkMatch?.[1]) lines.push(`link: ${linkMatch[1]}`);

  // Remove images before converting to markdown
  const withoutImg = html.replace(/<img\b[^>]*\/?>/gi, '');
  const md = htmlToMarkdown(withoutImg);
  if (md.trim()) lines.push('', md);
  return lines.join('\n');
}

function buildCtaBlock(html: string): string {
  const linkMatch = html.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!linkMatch) return `--- core/html\n\n${html}\n\n--- /core/html`;

  const lines = ['--- core/cta'];
  lines.push(`url: ${linkMatch[1]}`);
  lines.push(`buttonText: ${htmlToMarkdown(linkMatch[2])}`);

  const remaining = html.replace(linkMatch[0], '');
  const md = htmlToMarkdown(remaining);
  if (md.trim()) lines.push('', md);
  return lines.join('\n');
}

function buildListBlock(html: string, hasNewsletterKit: boolean): string {
  const blockType = hasNewsletterKit ? 'newsletter/quickHits' : 'core/list';
  const text = htmlToMarkdown(html);
  return `--- ${blockType}\n\n${text}`;
}

function buildQuoteBlock(html: string): string {
  const lines = ['--- core/quote'];

  // Try to find author
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  const citeMatch = html.match(/<cite[^>]*>([\s\S]*?)<\/cite>/i);
  const author = footerMatch
    ? htmlToMarkdown(footerMatch[1]).replace(/^[\u2014\u2013\u2012\u2015—–-]\s*/, '')
    : citeMatch ? htmlToMarkdown(citeMatch[1]) : undefined;

  if (author) lines.push(`author: ${author}`);

  let content = html;
  if (footerMatch) content = content.replace(footerMatch[0], '');
  else if (citeMatch) content = content.replace(citeMatch[0], '');

  const text = htmlToMarkdown(content);
  if (text.trim()) lines.push('', text);
  return lines.join('\n');
}

function buildTipBlock(html: string, hasNewsletterKit: boolean): string {
  if (hasNewsletterKit) {
    const text = htmlToMarkdown(html);
    return `--- newsletter/tipOfTheDay\n\n${text}`;
  }
  const text = htmlToMarkdown(html);
  return `--- core/text\n\n${text}`;
}

function buildFooterBlock(html: string): string {
  const lines = ['--- core/footer'];
  const text = htmlToMarkdown(html);
  if (text.trim()) lines.push('', text);
  return lines.join('\n');
}

function buildImageBlock(attrs: string): string {
  const lines = ['--- core/image'];
  const srcMatch = attrs.match(/src="([^"]*)"/i);
  const altMatch = attrs.match(/alt="([^"]*)"/i);
  const widthMatch = attrs.match(/width="([^"]*)"/i);

  if (srcMatch?.[1]) lines.push(`src: ${srcMatch[1]}`);
  if (altMatch?.[1]) lines.push(`alt: ${altMatch[1]}`);
  if (widthMatch?.[1]) lines.push(`width: ${widthMatch[1]}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// ParsedBlock formatter
// ---------------------------------------------------------------------------

function formatParsedBlock(parsed: ParsedBlock): string {
  const lines: string[] = [];
  const label = parsed.label ? `: ${parsed.label}` : '';
  lines.push(`--- ${parsed.blockType}${label}`);

  for (const [key, value] of Object.entries(parsed.properties)) {
    lines.push(`${key}: ${value}`);
  }

  if (parsed.content) {
    const hasProps = Object.keys(parsed.properties).length > 0;
    if (hasProps) lines.push('');
    lines.push(parsed.content);
  }

  if (parsed.children.length > 0) {
    lines.push('');
    for (const child of parsed.children) {
      lines.push(formatParsedBlock(child));
      lines.push('');
    }
    lines.push(`--- /${parsed.blockType}`);
  }

  return lines.join('\n');
}
