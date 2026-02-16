export function extractMklyMeta(html: string): { uses: string[]; themes: string[]; presets: string[]; meta: Record<string, string> } {
  const uses: string[] = [];
  const themes: string[] = [];
  const presets: string[] = [];
  const meta: Record<string, string> = {};
  // Match <meta> tags with mkly: attributes in either attribute order.
  // Browsers may serialize outerHTML with name before content or vice versa.
  const metaRegex = /<meta\s+(?:name="mkly:([^"]+)"\s+content="([^"]*)"|content="([^"]*)"\s+name="mkly:([^"]+)")\s*\/?>/gi;
  let m;
  while ((m = metaRegex.exec(html)) !== null) {
    const key = m[1] ?? m[4];
    const rawValue = m[2] ?? m[3];
    if (!key || rawValue === undefined) continue;
    const value = rawValue.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<');
    if (key === 'use') {
      uses.push(value);
    } else if (key === 'theme') {
      themes.push(value);
    } else if (key === 'preset') {
      presets.push(value);
    } else {
      meta[key] = value;
    }
  }
  return { uses, themes, presets, meta };
}

export const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export function kebabToCamel(str: string): string {
  if (str === 'background') return 'bg';
  if (str === 'background-color') return 'bgColor';
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
