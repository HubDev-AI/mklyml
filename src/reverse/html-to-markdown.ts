import { kebabToCamel } from './utils';

function normalizeInlineText(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeBlockText(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function htmlToMarkdown(html: string): string {
  let text = html;

  // Normalize inter-tag whitespace from prettified HTML.
  // Collapse ">\n    <" → ">\n<" to prevent indentation leaking into content.
  // Preserve single spaces between inline elements (no newline present).
  text = text.replace(/>\s*\n\s*/g, '>\n');

  // Strip outer wrapping tags (p, div)
  text = text.replace(/^<(?:p|div)[^>]*>|<\/(?:p|div)>$/gi, '');

  // Strong/bold
  text = text.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, (_m, inner: string) =>
    `**${normalizeInlineText(inner)}**`,
  );

  // Em/italic
  text = text.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, (_m, inner: string) =>
    `*${normalizeInlineText(inner)}*`,
  );

  // Inline styled spans → mkly inline syntax (inside-out loop for nested spans)
  const spanRe = /<span\s+style="([^"]*)"[^>]*>((?:(?!<\/?span[\s>])[\s\S])*?)<\/span>/gi;
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(spanRe, (_match, style: string, inner: string) => {
      const mklyStyles = cssToMklyInline(style);
      if (mklyStyles) return `{${mklyStyles}}${inner}{/}`;
      return inner;
    });
  }

  // Code inline — collapse whitespace to prevent multi-line backtick syntax
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, (_m, inner: string) =>
    '`' + inner.replace(/\s+/g, ' ').trim() + '`',
  );

  // Links
  text = text.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, inner: string) =>
    `[${normalizeInlineText(inner)}](${href})`,
  );

  // Headings — preserve {.className} annotations from class attributes
  text = text.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, (_, a, c) => `# ${normalizeBlockText(c)}${classAnnotation(a)}`);
  text = text.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, a, c) => `## ${normalizeBlockText(c)}${classAnnotation(a)}`);
  text = text.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_, a, c) => `### ${normalizeBlockText(c)}${classAnnotation(a)}`);
  text = text.replace(/<h4([^>]*)>([\s\S]*?)<\/h4>/gi, (_, a, c) => `#### ${normalizeBlockText(c)}${classAnnotation(a)}`);
  text = text.replace(/<h5([^>]*)>([\s\S]*?)<\/h5>/gi, (_, a, c) => `##### ${normalizeBlockText(c)}${classAnnotation(a)}`);
  text = text.replace(/<h6([^>]*)>([\s\S]*?)<\/h6>/gi, (_, a, c) => `###### ${normalizeBlockText(c)}${classAnnotation(a)}`);

  // List items — preserve {.className} annotations
  text = text.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (_, a, c) => `- ${normalizeBlockText(c)}${classAnnotation(a)}`);

  // Paragraphs — preserve {.className} annotations
  text = text.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_, a, c) => `${normalizeBlockText(c)}${classAnnotation(a)}\n`);

  // Line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&nbsp;/g, '\\~');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

/** Extract style class (s1, s2, ...) from tag attributes and return {.className} annotation. */
function classAnnotation(attrs: string): string {
  const m = attrs.match(/class="([^"]*)"/);
  if (!m) return '';
  const styleClass = m[1].split(/\s+/).find(c => /^s\d+$/.test(c));
  return styleClass ? ` {.${styleClass}}` : '';
}

function cssToMklyInline(styleString: string): string {
  const declarations = styleString.split(';').map(d => d.trim()).filter(Boolean);
  return declarations.map(decl => {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) return '';
    const prop = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    const mklyProp = kebabToCamel(prop);
    return `@${mklyProp}:${val}`;
  }).filter(Boolean).join(' ');
}
