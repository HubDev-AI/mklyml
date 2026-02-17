export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Decode common HTML entities back to their literal characters.
 * Used by property extraction functions so that values like
 * `&amp;` in HTML attributes/text are returned as `&`.
 */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, '\\~');
}

export function extractAttr(html: string, attr: string): string | undefined {
  const match = html.match(new RegExp(`${escapeRegex(attr)}="([^"]*)"`, 'i'));
  return match ? decodeHtmlEntities(match[1]) : undefined;
}

export function findTagWithClass(html: string, className: string): string | undefined {
  const regex = new RegExp(`<[^>]*${escapeRegex(className)}[^>]*>`, 'i');
  const match = html.match(regex);
  return match ? match[0] : undefined;
}

export function extractAttrFromTag(tag: string, attr: string): string | undefined {
  const match = tag.match(new RegExp(`${escapeRegex(attr)}="([^"]*)"`, 'i'));
  return match ? decodeHtmlEntities(match[1]) : undefined;
}

export function extractInnerHtml(html: string, className: string): string | undefined {
  const tag = findTagWithClass(html, className);
  if (!tag) return undefined;
  const tagName = tag.match(/^<(\w+)/)?.[1];
  if (!tagName) return undefined;
  const startIdx = html.indexOf(tag);
  if (startIdx < 0) return undefined;
  const afterTag = startIdx + tag.length;
  const closeTag = `</${tagName}>`;
  const endIdx = html.indexOf(closeTag, afterTag);
  if (endIdx < 0) return undefined;
  return html.substring(afterTag, endIdx);
}

export function extractTextContent(html: string, className: string): string | undefined {
  const inner = extractInnerHtml(html, className);
  if (inner === undefined) return undefined;
  return decodeHtmlEntities(inner.replace(/<[^>]+>/g, '').trim());
}

export function stripElementsByClass(html: string, ...classes: string[]): string {
  let r = html;
  for (const cssClass of classes) {
    r = r.replace(new RegExp(`<(?:img|br|hr)\\b[^>]*\\b${escapeRegex(cssClass)}\\b[^>]*/?>`, 'gi'), '');
    r = r.replace(new RegExp(`<(\\w+)\\b[^>]*\\b${escapeRegex(cssClass)}\\b[^>]*>[\\s\\S]*?</\\1>`, 'gi'), '');
  }
  return r;
}

export function extractAttrByClass(html: string, cssClass: string, attrName: string): string | undefined {
  const m = html.match(new RegExp(`<\\w+\\b[^>]*\\b${escapeRegex(cssClass)}\\b[^>]*>`, 'i'));
  return m ? extractAttr(m[0], attrName) : undefined;
}
