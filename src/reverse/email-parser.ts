import { htmlToMarkdown } from './html-to-markdown';
import { extractMklyMeta } from './utils';
import type { MklyKit } from '../kit';

export interface ReverseEmailOptions {
  kits?: Record<string, MklyKit>;
}

export function reverseEmail(html: string, options?: ReverseEmailOptions): string {
  const sections: string[] = [];

  // Extract mkly:* meta tags from <head>
  const { uses: metaUses, themes: metaThemes, meta: mklyMeta } = extractMklyMeta(html);

  if (metaUses.length > 0 || metaThemes.length > 0 || Object.keys(mklyMeta).length > 0) {
    const lines: string[] = [];
    for (const kitName of metaUses) {
      lines.push(`--- use: ${kitName}`);
    }
    for (const themeName of metaThemes) {
      lines.push(`--- theme: ${themeName}`);
    }
    const metaEntries = Object.entries(mklyMeta);
    if (metaEntries.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push('--- meta');
      for (const [key, value] of metaEntries) {
        lines.push(`${key}: ${value}`);
      }
    }
    sections.push(lines.join('\n'));
  } else {
    // Fallback: extract title from <title> tag or subject meta
    const subjectMatch = html.match(/<meta\s+name="subject"\s+content="([^"]*)"/i);
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = subjectMatch?.[1] || titleMatch?.[1];
    if (title) {
      sections.push(`--- meta\ntitle: ${title}`);
    }
  }

  // Email HTML uses comment markers or table patterns
  // First try: find content tables with mkly-specific comment markers
  const blockComments = html.matchAll(/<!--\s*mkly:(\w+)\s*-->([\s\S]*?)(?=<!--\s*mkly:\w+\s*-->|<!--\s*\/mkly\s*-->|$)/gi);

  for (const match of blockComments) {
    const blockType = match[1];
    const content = htmlToMarkdown(match[2]);
    if (content) {
      sections.push(`--- ${blockType}\n\n${content}`);
    }
  }

  // If no comment markers found, use heuristic content parsing
  if (sections.length <= 1) {
    const seen = new Set<string>();

    // Strategy 1: find <td> cells with padding (old email format)
    const contentCellRegex = /<td[^>]*style="[^"]*padding[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = contentCellRegex.exec(html)) !== null) {
      const cellContent = cellMatch[1].trim();
      if (!cellContent) continue;
      if (/^\s*<table\b/i.test(cellContent) && !/<\/table>\s*\S/i.test(cellContent)) continue;

      const md = htmlToMarkdown(cellContent).trim();
      if (md && !seen.has(md)) {
        seen.add(md);
        if (/<h[1-6]\b/i.test(cellContent)) {
          const levelMatch = cellContent.match(/<h([1-6])\b/i);
          const level = levelMatch ? levelMatch[1] : '1';
          sections.push(`--- core/heading\nlevel: ${level}\n\n${md}`);
        } else {
          sections.push(`--- core/text\n\n${md}`);
        }
      }
    }

    // Strategy 2: find styled block-level elements (new CSS-inlined format)
    if (sections.length <= 1) {
      // Match heading elements
      const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
      let hMatch;
      while ((hMatch = headingRegex.exec(html)) !== null) {
        const level = hMatch[1];
        const md = htmlToMarkdown(hMatch[2]).trim();
        if (md && !seen.has(md)) {
          seen.add(md);
          sections.push(`--- core/heading\nlevel: ${level}\n\n${md}`);
        }
      }

      // Match div/p elements with text content (style attr optional — properly compiled blocks may not have inline styles)
      const blockRegex = /<(?:div|p)\b[^>]*>([\s\S]*?)<\/(?:div|p)>/gi;
      let bMatch;
      while ((bMatch = blockRegex.exec(html)) !== null) {
        const inner = bMatch[1].trim();
        if (!inner) continue;
        // Skip wrapper divs that only contain other divs/tables
        if (/^<(?:div|table|tr|td)\b/i.test(inner) && !/<\/(?:div|table)>\s*\S/i.test(inner)) continue;

        const md = htmlToMarkdown(inner).trim();
        if (md && !seen.has(md)) {
          seen.add(md);
          sections.push(`--- core/text\n\n${md}`);
        }
      }
    }
  }

  return sections.join('\n\n') + '\n';
}
