import { htmlToMarkdown } from './html-to-markdown';
import { normalizeHtmlIndent } from './generic-parser';
import { extractMklyMeta } from './utils';
import {
  escapeRegex,
  extractAttr,
  findTagWithClass,
  extractAttrFromTag,
  extractInnerHtml,
  extractTextContent,
} from './html-parsing';
import type { MklyKit, ParsedBlock } from '../kit';

export type { ParsedBlock } from '../kit';

// Core CSS→block mapping (only core blocks — kits add their own)
const CSS_TO_BLOCK: Record<string, string> = {
  'mkly-core-heading': 'core/heading',
  'mkly-core-text': 'core/text',
  'mkly-core-image': 'core/image',
  'mkly-core-button': 'core/button',
  'mkly-core-divider': 'core/divider',
  'mkly-core-spacer': 'core/spacer',
  'mkly-core-code': 'core/code',
  'mkly-core-quote': 'core/quote',
  'mkly-core-hero': 'core/hero',
  'mkly-core-section': 'core/section',
  'mkly-core-card': 'core/card',
  'mkly-core-list': 'core/list',
  'mkly-core-header': 'core/header',
  'mkly-core-footer': 'core/footer',
  'mkly-core-cta': 'core/cta',
};

// Container block types that have children
const CONTAINER_TYPES = new Set(['core/section', 'newsletter/category', 'newsletter/tools']);

export function buildCssToBlockMap(kits?: Record<string, MklyKit>): {
  cssToBlock: Record<string, string>;
  customParsers: Record<string, (html: string) => ParsedBlock>;
  blockToKit: Record<string, string>;
} {
  const cssToBlock: Record<string, string> = { ...CSS_TO_BLOCK };
  const customParsers: Record<string, (html: string) => ParsedBlock> = {};
  const blockToKit: Record<string, string> = {};

  if (kits) {
    for (const [kitName, kit] of Object.entries(kits)) {
      if (kit.reverse) {
        for (const handler of kit.reverse) {
          cssToBlock[handler.cssClass] = handler.blockType;
          blockToKit[handler.blockType] = kitName;
          if (handler.parse) {
            customParsers[handler.blockType] = handler.parse;
          }
        }
      }
    }
  }

  return { cssToBlock, customParsers, blockToKit };
}

// ---------------------------------------------------------------------------
// Stack-based block extraction — handles nested same-tag elements
// ---------------------------------------------------------------------------

const VOID_ELEMENTS = new Set(['hr', 'br', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

interface ExtractedElement {
  tag: string;
  attrs: string;
  fullHtml: string;
  classes: string;
  isVoid: boolean;
}

function extractTopLevelBlocks(html: string, cssToBlock: Record<string, string>): ExtractedElement[] {
  const results: ExtractedElement[] = [];
  const openTagRegex = /<(\w+)(\s[^>]*)?\/?>/g;
  let match;

  while ((match = openTagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? '';
    const fullOpenTag = match[0];

    // Extract class attribute
    const classMatch = attrs.match(/class="([^"]*)"/);
    if (!classMatch) continue;
    const classes = classMatch[1];

    // Check if any class maps to a block type
    const classTokens = classes.split(/\s+/);
    let isBlock = false;
    for (const cls of classTokens) {
      if (cssToBlock[cls] && !cls.includes('__')) {
        isBlock = true;
        break;
      }
    }
    if (!isBlock) continue;

    // Skip sub-elements (BEM child classes like mkly-card__img)
    if (classTokens.every(c => c.includes('__') || !cssToBlock[c])) continue;

    if (VOID_ELEMENTS.has(tag) || fullOpenTag.endsWith('/>')) {
      results.push({ tag, attrs, fullHtml: fullOpenTag, classes, isVoid: true });
      continue;
    }

    // Stack-based matching for paired elements
    const startIdx = match.index;
    let depth = 1;
    const closeRegex = new RegExp(`<(${tag})\\b[^>]*>|</${tag}>`, 'gi');
    closeRegex.lastIndex = startIdx + fullOpenTag.length;

    let innerMatch;
    while ((innerMatch = closeRegex.exec(html)) !== null) {
      if (innerMatch[0].startsWith('</')) {
        depth--;
        if (depth === 0) {
          const endIdx = innerMatch.index + innerMatch[0].length;
          const fullHtml = html.substring(startIdx, endIdx);
          results.push({ tag, attrs, fullHtml, classes, isVoid: false });
          // Skip past this block so nested children aren't found as top-level
          openTagRegex.lastIndex = endIdx;
          break;
        }
      } else {
        depth++;
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Core block parsers (attribute-order-independent)
// ---------------------------------------------------------------------------

export function parseCoreBlock(blockHtml: string, blockType: string): ParsedBlock {
  const block: ParsedBlock = {
    blockType,
    properties: {},
    content: '',
    children: [],
  };

  switch (blockType) {
    case 'core/heading': {
      const levelMatch = blockHtml.match(/mkly-core-heading--(\d)/);
      if (levelMatch) block.properties.level = levelMatch[1];
      const textMatch = blockHtml.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/);
      if (textMatch) block.content = textMatch[1].replace(/<[^>]+>/g, '').trim();
      break;
    }
    case 'core/text': {
      const inner = extractInnerHtml(blockHtml, 'mkly-core-text');
      if (inner) block.content = htmlToMarkdown(inner);
      break;
    }
    case 'core/html': {
      block.content = normalizeHtmlIndent(
        blockHtml
          .replace(/\s*mkly-core-html/g, '')
          .replace(/\s+class="\s*"/g, '')
          .replace(/\s+data-mkly-[\w-]+(?:="[^"]*")?/g, '')
          .trim(),
      );
      block.verbatim = true;
      break;
    }
    case 'core/image': {
      const src = extractAttr(blockHtml, 'src');
      const alt = extractAttr(blockHtml, 'alt');
      const width = extractAttr(blockHtml, 'width');
      if (src) block.properties.src = src;
      if (alt) block.properties.alt = alt;
      if (width) block.properties.width = width;
      break;
    }
    case 'core/button': {
      const href = extractAttr(blockHtml, 'href');
      const linkTag = findTagWithClass(blockHtml, 'mkly-core-button__link');
      const label = linkTag
        ? blockHtml.match(/mkly-core-button__link[^>]*>([\s\S]*?)<\/a>/)?.[1]?.replace(/<[^>]+>/g, '').trim()
        : undefined;
      if (href) block.properties.url = href;
      if (label) block.properties.label = label;
      break;
    }
    case 'core/divider': break;
    case 'core/spacer': {
      const height = blockHtml.match(/height:\s*(\d+)px/);
      if (height) block.properties.height = height[1];
      break;
    }
    case 'core/code': {
      const lang = extractAttr(blockHtml, 'data-lang');
      if (lang) block.properties.lang = lang;
      const codeMatch = blockHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/);
      if (codeMatch) block.content = codeMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      break;
    }
    case 'core/quote': {
      const authorMatch = blockHtml.match(/mkly-core-quote__author[^>]*>\u2014\s*([^<]*)<\/footer>/);
      if (authorMatch) block.properties.author = authorMatch[1].trim();
      const content = blockHtml.match(/<blockquote[^>]*>([\s\S]*?)(?:<footer|<\/blockquote>)/);
      if (content) block.content = htmlToMarkdown(content[1]);
      break;
    }
    case 'core/hero': {
      const imgTag = findTagWithClass(blockHtml, 'mkly-core-hero__img');
      if (imgTag) {
        const src = extractAttrFromTag(imgTag, 'src');
        const alt = extractAttrFromTag(imgTag, 'alt');
        if (src) block.properties.image = src;
        if (alt) block.properties.alt = alt;
      }
      const heroContent = extractInnerHtml(blockHtml, 'mkly-core-hero__content');
      if (heroContent) block.content = htmlToMarkdown(heroContent);
      break;
    }
    case 'core/section': {
      const titleText = extractTextContent(blockHtml, 'mkly-core-section__title');
      if (titleText) block.properties.title = titleText;
      break;
    }
    case 'core/card': {
      const imgTag = findTagWithClass(blockHtml, 'mkly-core-card__img');
      if (imgTag) {
        const src = extractAttrFromTag(imgTag, 'src');
        if (src) block.properties.image = src;
      }
      const linkTag = findTagWithClass(blockHtml, 'mkly-core-card__link');
      if (linkTag) {
        const href = extractAttrFromTag(linkTag, 'href');
        if (href) block.properties.link = href;
      }
      const bodyInner = extractInnerHtml(blockHtml, 'mkly-core-card__body');
      if (bodyInner) {
        // Remove the "Read more" link from body content
        const cleaned = bodyInner.replace(/<a[^>]*mkly-core-card__link[^>]*>[\s\S]*?<\/a>/g, '');
        const md = htmlToMarkdown(cleaned);
        if (md) block.content = md;
      }
      break;
    }
    case 'core/list': {
      const inner = extractInnerHtml(blockHtml, 'mkly-core-list');
      if (inner) block.content = htmlToMarkdown(inner);
      break;
    }
    case 'core/header': {
      const logoTag = findTagWithClass(blockHtml, 'mkly-core-header__logo');
      if (logoTag) {
        const src = extractAttrFromTag(logoTag, 'src');
        if (src) block.properties.logo = src;
      }
      const titleText = extractTextContent(blockHtml, 'mkly-core-header__title');
      if (titleText) block.properties.title = titleText;
      const subtitleHtml = extractInnerHtml(blockHtml, 'mkly-core-header__subtitle');
      if (subtitleHtml) block.content = htmlToMarkdown(subtitleHtml);
      break;
    }
    case 'core/footer': {
      const inner = extractInnerHtml(blockHtml, 'mkly-core-footer');
      if (inner) block.content = htmlToMarkdown(inner);
      break;
    }
    case 'core/cta': {
      const ctaTag = findTagWithClass(blockHtml, 'mkly-core-cta__button');
      if (ctaTag) {
        const href = extractAttrFromTag(ctaTag, 'href');
        if (href) block.properties.url = href;
        const labelMatch = blockHtml.match(/mkly-core-cta__button[^>]*>([\s\S]*?)<\/a>/);
        if (labelMatch) block.properties.buttonText = labelMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      // Extract content before the CTA button
      const ctaInner = extractInnerHtml(blockHtml, 'mkly-core-cta');
      if (ctaInner) {
        const beforeButton = ctaInner.replace(/<a[^>]*mkly-core-cta__button[^>]*>[\s\S]*?<\/a>/g, '');
        const md = htmlToMarkdown(beforeButton);
        if (md) block.content = md;
      }
      break;
    }
    default: {
      // Generic fallback: extract inner HTML as markdown
      const openTagMatch = blockHtml.match(/^<(\w+)[^>]*>/);
      if (openTagMatch) {
        const tagName = openTagMatch[1];
        const closeTag = `</${tagName}>`;
        const startIdx = openTagMatch[0].length;
        const endIdx = blockHtml.lastIndexOf(closeTag);
        if (endIdx > startIdx) {
          block.content = htmlToMarkdown(blockHtml.substring(startIdx, endIdx));
        }
      }
      break;
    }
  }

  return block;
}

// ---------------------------------------------------------------------------
// Block to mkly serialization
// ---------------------------------------------------------------------------

function blockToMkly(block: ParsedBlock): string {
  const lines: string[] = [];
  const label = block.label ? `: ${block.label}` : '';
  lines.push(`--- ${block.blockType}${label}`);

  for (const [key, value] of Object.entries(block.properties)) {
    lines.push(`${key}: ${value}`);
  }

  if (block.styleEntries && block.styleEntries.length > 0) {
    for (const entry of block.styleEntries) {
      lines.push(entry);
    }
  }

  if (block.content) {
    const hasProps = Object.keys(block.properties).length > 0 ||
      (block.styleEntries && block.styleEntries.length > 0);
    if (hasProps) lines.push('');
    lines.push(block.content);
  }

  if (block.verbatim) {
    lines.push('');
    lines.push(`--- /${block.blockType}`);
  } else if (block.children.length > 0) {
    lines.push('');
    for (const child of block.children) {
      lines.push(blockToMkly(child));
      lines.push('');
    }
    lines.push(`--- /${block.blockType}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Meta extraction and preamble generation
// ---------------------------------------------------------------------------

export interface ReverseWebOptions {
  preserveStyles?: boolean;
  preserveMeta?: boolean;
  kits?: Record<string, MklyKit>;
}

function buildPreamble(uses: string[], meta: Record<string, string>, themes?: string[], presets?: string[], defines?: string[]): string[] {
  const lines: string[] = [];
  // Canonical order: uses → defines → themes → presets → meta
  for (const kitName of uses) {
    lines.push(`--- use: ${kitName}`);
  }
  if (defines && defines.length > 0) {
    for (const def of defines) {
      if (lines.length > 0) lines.push('');
      for (const line of def.split('\n')) {
        lines.push(line);
      }
    }
  }
  if (themes) {
    for (const themeName of themes) {
      lines.push(`--- theme: ${themeName}`);
    }
  }
  if (presets) {
    for (const presetName of presets) {
      lines.push(`--- preset: ${presetName}`);
    }
  }
  const metaEntries = Object.entries(meta);
  if (metaEntries.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('--- meta');
    for (const [key, value] of metaEntries) {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Main reverse conversion
// ---------------------------------------------------------------------------

export function reverseWeb(html: string, options?: ReverseWebOptions): string {
  const sections: string[] = [];

  // Extract mkly:* meta tags for preamble
  const { uses: metaUses, themes: metaThemes, presets: metaPresets, meta: mklyMeta } = extractMklyMeta(html);

  // Build CSS→block map from kits
  const { cssToBlock, customParsers, blockToKit } = buildCssToBlockMap(options?.kits);

  const detectBlock = (classes: string): string | undefined => {
    for (const [cssClass, blockType] of Object.entries(cssToBlock)) {
      if (classes.split(/\s+/).some(c => c === cssClass)) {
        return blockType;
      }
    }
    return undefined;
  };

  const parseBlockWithKit = (blockHtml: string, blockType: string): ParsedBlock => {
    const custom = customParsers[blockType];
    if (custom) return custom(blockHtml);
    return parseCoreBlock(blockHtml, blockType);
  };

  // Extract inline theme/preset definitions for canonical ordering
  const definesSections: string[] = [];
  const definesMatch = html.match(/<script type="text\/mkly-defines">([\s\S]*?)<\/script>/);
  if (definesMatch) {
    for (const src of definesMatch[1].split('\n---\n')) {
      const trimmed = src.trim();
      if (trimmed) definesSections.push(trimmed);
    }
  }

  // Generate preamble in canonical order: uses → defines → themes → presets → meta
  if (metaUses.length > 0 || Object.keys(mklyMeta).length > 0 || definesSections.length > 0) {
    const preamble = buildPreamble(metaUses, mklyMeta, metaThemes, metaPresets, definesSections.length > 0 ? definesSections : undefined);
    if (preamble.length > 0) {
      sections.push(preamble.join('\n'));
    }
  } else if (options?.preserveMeta !== false) {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) {
      sections.push(`--- meta\ntitle: ${titleMatch[1]}`);
    }
    if (options?.kits) {
      const detectedKits = new Set<string>();
      for (const [cssClass] of Object.entries(cssToBlock)) {
        if (html.includes(cssClass)) {
          const bt = cssToBlock[cssClass];
          if (bt && blockToKit[bt]) {
            detectedKits.add(blockToKit[bt]);
          }
        }
      }
      if (detectedKits.size > 0) {
        const useLines = [...detectedKits].map(k => `--- use: ${k}`).join('\n');
        sections.unshift(useLines);
      }
    }
  }

  // Extract preserved style block source (embedded by compiler for round-trip fidelity)
  const styleSourceMatch = html.match(/<script type="text\/mkly-style">([\s\S]*?)<\/script>/);
  if (styleSourceMatch) {
    // Original style block(s) preserved verbatim — split on separator if multiple
    const styleSources = styleSourceMatch[1].split('\n---\n');
    for (const src of styleSources) {
      const trimmed = src.trim();
      if (trimmed) {
        sections.push('--- style\n' + trimmed);
      }
    }
  } else if (options?.preserveStyles !== false && metaThemes.length === 0) {
    // Fallback: extract style variables from CSS
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const css = styleMatch[1];
      const varMatches = css.matchAll(/--mkly-(\w[\w-]*)\s*:\s*([^;]+);/g);
      const vars: string[] = [];
      for (const m of varMatches) {
        const name = m[1].replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
        vars.push(`${name}: ${m[2].trim()}`);
      }
      if (vars.length > 0) {
        sections.push('--- style\n' + vars.join('\n'));
      }
    }
  }

  // Extract content from mkly-document div
  let content = html;
  const docMatch = html.match(/class="mkly-document"[^>]*>([\s\S]+)<\/(?:main|div)>\s*$/);
  if (docMatch) {
    content = docMatch[1];
  }

  // Extract preserved comments (<!-- mkly-c: text -->) and their positions in content
  const commentPositions: { offset: number; text: string }[] = [];
  const commentRegex = /<!-- mkly-c: ([\s\S]*?) -->/g;
  let cm;
  while ((cm = commentRegex.exec(content)) !== null) {
    commentPositions.push({
      offset: cm.index,
      text: cm[1].replace(/\u2014/g, '--'),
    });
  }

  // Use stack-based extraction for top-level blocks
  const elements = extractTopLevelBlocks(content, cssToBlock);

  // Build a map of element positions (sequential search to avoid duplicate matches)
  let searchFrom = 0;
  const elementPositions: { offset: number; end: number }[] = [];
  for (const el of elements) {
    const idx = content.indexOf(el.fullHtml, searchFrom);
    if (idx >= 0) {
      elementPositions.push({ offset: idx, end: idx + el.fullHtml.length });
      searchFrom = idx + el.fullHtml.length;
    } else {
      elementPositions.push({ offset: Infinity, end: Infinity });
    }
  }

  const parseElementToBlock = (el: ExtractedElement): ParsedBlock => {
    const blockType = detectBlock(el.classes);
    if (!blockType) {
      return { blockType: 'core/text', properties: {}, content: htmlToMarkdown(el.fullHtml), children: [] };
    }

    const block = parseBlockWithKit(el.fullHtml, blockType);

    // Extract preserved inline/targeted styles from data-mkly-styles attribute
    const stylesAttr = extractAttr(el.fullHtml, 'data-mkly-styles');
    if (stylesAttr) {
      const decoded = stylesAttr.replace(/&quot;/g, '"');
      const entries = decoded.split(';').filter(Boolean);
      const styleLines: string[] = [];
      for (const entry of entries) {
        const colonIdx = entry.indexOf(':');
        if (colonIdx > 0) {
          const key = entry.slice(0, colonIdx);
          const value = entry.slice(colonIdx + 1);
          styleLines.push(`${key}: ${value}`);
        }
      }
      if (styleLines.length > 0) {
        block.styleEntries = styleLines;
      }
    }

    // Recursively parse children for container blocks
    if (CONTAINER_TYPES.has(blockType)) {
      const openTagMatch = el.fullHtml.match(/^<\w+[^>]*>/);
      const tagName = el.tag;
      const closeTag = `</${tagName}>`;
      if (openTagMatch) {
        const innerStart = openTagMatch[0].length;
        const innerEnd = el.fullHtml.lastIndexOf(closeTag);
        if (innerEnd > innerStart) {
          const innerHtml = el.fullHtml.substring(innerStart, innerEnd);
          const childElements = extractTopLevelBlocks(innerHtml, cssToBlock);
          block.children = childElements.map(parseElementToBlock);
        }
      }
    }

    return block;
  };

  const blocks = elements.map(parseElementToBlock);

  // Interleave comments and non-mkly HTML gaps with blocks based on position
  let commentIdx = 0;
  const firstBlockOffset = elementPositions.length > 0 ? elementPositions[0].offset : Infinity;

  // Comments before the first block were originally at the top of the document
  const topComments: string[] = [];
  while (commentIdx < commentPositions.length && commentPositions[commentIdx].offset < firstBlockOffset) {
    topComments.push(`// ${commentPositions[commentIdx].text}`);
    commentIdx++;
  }
  if (topComments.length > 0) {
    sections.unshift(topComments.join('\n'));
  }

  // Walk content in order: emit blocks and capture non-mkly gaps as core/html
  let cursor = 0;
  for (let i = 0; i < blocks.length; i++) {
    const { offset, end } = elementPositions[i];

    // Non-mkly HTML in the gap before this block → wrap in core/html
    if (offset > cursor) {
      const gap = content.slice(cursor, offset);
      const meaningful = gap
        .replace(/<!-- mkly-c:[\s\S]*?-->/g, '')
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .trim();
      if (meaningful) {
        const cleaned = normalizeHtmlIndent(
          gap.replace(/<style\b[\s\S]*?<\/style>/gi, '').trim(),
        );
        if (cleaned) {
          sections.push(`--- core/html\n\n${cleaned}\n\n--- /core/html`);
        }
      }
    }

    // Emit comments that appear before this block element
    while (commentIdx < commentPositions.length && commentPositions[commentIdx].offset < offset) {
      sections.push(`// ${commentPositions[commentIdx].text}`);
      commentIdx++;
    }
    sections.push(blockToMkly(blocks[i]));
    cursor = end;
  }

  // Trailing non-mkly content after the last block → wrap in core/html
  if (cursor < content.length) {
    const trailing = content.slice(cursor);
    const meaningful = trailing
      .replace(/<!-- mkly-c:[\s\S]*?-->/g, '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .trim();
    if (meaningful) {
      const cleaned = normalizeHtmlIndent(
        trailing.replace(/<style\b[\s\S]*?<\/style>/gi, '').trim(),
      );
      if (cleaned) {
        sections.push(`--- core/html\n\n${cleaned}\n\n--- /core/html`);
      }
    }
  }

  // Emit remaining comments after the last block
  while (commentIdx < commentPositions.length) {
    sections.push(`// ${commentPositions[commentIdx].text}`);
    commentIdx++;
  }

  return sections.join('\n\n') + '\n';
}
