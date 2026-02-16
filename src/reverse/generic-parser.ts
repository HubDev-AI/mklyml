// ---------------------------------------------------------------------------
// Normalize browser-added indentation in multiline HTML
// ---------------------------------------------------------------------------

export function normalizeHtmlIndent(html: string): string {
  const lines = html.split('\n');
  if (lines.length <= 1) return html;
  let minIndent = Infinity;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const indent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent > 0 && minIndent < Infinity) {
    return lines.map((l, i) => i === 0 ? l : l.slice(minIndent)).join('\n');
  }
  return html;
}

// ---------------------------------------------------------------------------
// Main entry — wraps non-mkly HTML verbatim in a core/html block
// ---------------------------------------------------------------------------

export function reverseGeneric(html: string): string {
  // Strip script tags for security
  let content = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Extract body content if this is a full HTML document
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) content = bodyMatch[1];

  const trimmed = normalizeHtmlIndent(content.trim());
  if (!trimmed) return '';

  return `--- meta\nversion: 1\n\n--- use: core\n\n--- core/html\n\n${trimmed}\n\n--- /core/html\n`;
}
