export function escapeHtml(s: string): string {
  return s
    .replace(/\\~/g, '\x00NBSP\x00')
    .replace(/&(?=#?\w+;)/g, '\x00AMP\x00')
    .replace(/&/g, '&amp;')
    .replace(/\x00AMP\x00/g, '&')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\x00NBSP\x00/g, '&nbsp;');
}

const OL_RE = /^(\d+)[.)]\s+(.+)$/;

/** Match {.className} attribute annotation at end of a line. */
const ATTR_CLASS_RE = /\s*\{\.([\w][\w-]*)\}\s*$/;

/** Extract {.className} from end of text, returning clean text + optional class attribute string. */
function extractClassAttr(text: string): { clean: string; classAttr: string } {
  const m = text.match(ATTR_CLASS_RE);
  if (!m) return { clean: text, classAttr: '' };
  return { clean: text.slice(0, m.index!), classAttr: ` class="${m[1]}"` };
}

export function markdownToHtml(content: string, lineMap?: number[]): string {
  if (!content) return '';

  const { processed, styles } = processInlineStyles(content);

  const lines = processed.split('\n');
  const result: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function closeList() {
    if (listType) {
      result.push(`</${listType}>`);
      listType = null;
    }
  }

  function la(idx: number): string {
    if (!lineMap || idx >= lineMap.length) return '';
    return ` data-mkly-line="${lineMap[idx]}"`;
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const t = lines[idx].trim();

    if (!t) {
      closeList();
      continue;
    }

    if (t.startsWith('### ')) {
      closeList();
      const { clean, classAttr } = extractClassAttr(t.slice(4));
      result.push(`<h3${la(idx)}${classAttr}>${inlineFormat(clean)}</h3>`);
    } else if (t.startsWith('## ')) {
      closeList();
      const { clean, classAttr } = extractClassAttr(t.slice(3));
      result.push(`<h2${la(idx)}${classAttr}>${inlineFormat(clean)}</h2>`);
    } else if (t.startsWith('# ')) {
      closeList();
      const { clean, classAttr } = extractClassAttr(t.slice(2));
      result.push(`<h1${la(idx)}${classAttr}>${inlineFormat(clean)}</h1>`);
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      if (listType !== 'ul') { closeList(); result.push('<ul>'); listType = 'ul'; }
      const { clean, classAttr } = extractClassAttr(t.slice(2));
      result.push(`<li${la(idx)}${classAttr}>${inlineFormat(clean)}</li>`);
    } else {
      const olMatch = t.match(OL_RE);
      if (olMatch) {
        if (listType !== 'ol') { closeList(); result.push('<ol>'); listType = 'ol'; }
        const { clean, classAttr } = extractClassAttr(olMatch[2]);
        result.push(`<li${la(idx)}${classAttr}>${inlineFormat(clean)}</li>`);
      } else {
        closeList();
        const { clean, classAttr } = extractClassAttr(t);
        result.push(`<p${la(idx)}${classAttr}>${inlineFormat(clean)}</p>`);
      }
    }
  }

  closeList();
  const html = result.join('\n');
  return styles.length > 0 ? restoreInlineStyles(html, styles) : html;
}

function processInlineStyles(content: string): { processed: string; styles: Array<{ id: number; css: string }> } {
  const styles: Array<{ id: number; css: string }> = [];
  let id = 0;
  let processed = content;

  // Match innermost styles first (content with no '{'), loop to resolve nesting
  const re = /\{@([^}]+)\}([^{]*)\{\/\}/g;
  let prev = '';
  while (prev !== processed) {
    prev = processed;
    processed = processed.replace(re, (_match, styleStr: string, text: string) => {
      const css = parseInlineStyleDecl(styleStr);
      const currentId = id++;
      styles.push({ id: currentId, css });
      return `\x00MKLY_S${currentId}\x00${text}\x00MKLY_E${currentId}\x00`;
    });
  }

  return { processed, styles };
}

function parseInlineStyleDecl(styleStr: string): string {
  return styleStr.trim().split(/\s+/).map(decl => {
    const match = decl.match(/^@?([\w-]+):(.+)$/);
    if (!match) return '';
    const prop = camelToKebab(match[1]);
    return `${prop}:${match[2]}`;
  }).filter(Boolean).join(';');
}

export function toKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function camelToKebab(str: string): string {
  if (str === 'bg') return 'background';
  if (str === 'bgColor') return 'background-color';
  return toKebab(str);
}

function restoreInlineStyles(html: string, styles: Array<{ id: number; css: string }>): string {
  let result = html;
  for (const { id, css } of styles) {
    result = result.replace(`\x00MKLY_S${id}\x00`, `<span style="${css}">`);
    result = result.replace(`\x00MKLY_E${id}\x00`, '</span>');
  }
  return result;
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, url) => {
        const href = url.replace(/&amp;/g, '&');
        if (isSafeUrl(href)) {
          return `<a href="${escapeHtml(href)}">${label}</a>`;
        }
        return label;
      },
    );
}

const UNSAFE_URL_RE = /^\s*(javascript|data|vbscript):/i;

export function isSafeUrl(url: string): boolean {
  const normalized = url.replace(/[\x00\s]/g, '');
  return !UNSAFE_URL_RE.test(normalized);
}
