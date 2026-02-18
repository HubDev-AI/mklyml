import type { BlockDefinition, BlockDocs, MklyBlock } from './types';
import { cls, lineAttr } from './types';
import type { MklyKit, ReverseBlockHandler } from './kit';
import { BlockRegistry } from './registry';
import { escapeHtml, markdownToHtml, isSafeUrl } from './utils';
import { requireProp, warnMissing, compileError, errorHtml, prop, safeCss, cssVal } from './errors';
import { CORE_SCHEMAS } from './schemas';
import { CORE_THEMES } from './themes';
import { CORE_PRESETS } from './presets';

function safeUrl(url: string | undefined): string {
  if (!url) return '';
  return isSafeUrl(url) ? escapeHtml(url) : '';
}

function md(block: MklyBlock): string {
  return markdownToHtml(block.content, block.contentLineMap);
}

function clampInt(value: string | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

const heading: BlockDefinition = {
  name: 'heading',
  contentMode: 'text',
  styleHints: {
    self: ['text-align', 'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  },
  contentHints: { contentBody: true },
  compile: (block) => {
    const level = clampInt(prop(block, 'level'), 1, 6, 2);
    const tag = `h${level}`;
    const text = block.content || prop(block, 'text') || '';
    return `<${tag} class="${cls(block)} ${cls(block, `--${level}`)}"${lineAttr(block, 'level', 'text')}>${escapeHtml(text)}</${tag}>`;
  },
};

const text: BlockDefinition = {
  name: 'text',
  contentMode: 'text',
  styleHints: {
    self: ['text-align', 'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  },
  contentHints: { contentBody: true },
  compile: (block) => `<div class="${cls(block)}">${md(block)}</div>`,
};

const image: BlockDefinition = {
  name: 'image',
  contentMode: 'properties',
  targets: {
    img: { label: 'Image' },
  },
  styleHints: {
    self: ['text-align', 'margin', 'padding', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
    img: ['width', 'height', 'margin', 'padding', 'max-width', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  },
  contentHints: { contentProps: ['src', 'url'] },
  compile: (block, ctx) => {
    const src = requireProp(block, 'src', ctx) ?? prop(block, 'url');
    if (!src) {
      return errorHtml('image block requires "src" property', block.position.start.line);
    }
    const alt = prop(block, 'alt');
    if (alt === undefined) {
      warnMissing(block, 'alt', ctx, 'image block is missing "alt" property (accessibility)');
    }
    const width = prop(block, 'width');
    const widthStyle = width ? ` width="${escapeHtml(width)}"` : '';
    return `<figure class="${cls(block)}"><img src="${safeUrl(src)}" alt="${escapeHtml(alt ?? '')}"${widthStyle} class="${cls(block, '__img')}"${lineAttr(block, 'src', 'url')}></figure>`;
  },
};

const button: BlockDefinition = {
  name: 'button',
  contentMode: 'mixed',
  targets: {
    link: { label: 'Link' },
  },
  styleHints: {
    self: ['text-align', 'margin', 'padding', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity'],
    link: ['text-align', 'color', 'background', 'font-family', 'font-size', 'font-weight', 'padding', 'margin', 'border-radius', 'border-width', 'border-style', 'border-color', 'box-shadow', 'opacity'],
  },
  contentHints: { contentProps: ['url', 'href', 'label'], contentBody: true },
  compile: (block, ctx) => {
    const url = prop(block, 'url') ?? prop(block, 'href');
    if (!url) {
      requireProp(block, 'url', ctx);
      return errorHtml('button block requires "url" property', block.position.start.line);
    }
    const label = prop(block, 'label') ?? block.content.trim();
    if (!label) {
      requireProp(block, 'label', ctx);
      return errorHtml('button block requires "label" property or text content', block.position.start.line);
    }
    return `<div class="${cls(block)}"><a href="${safeUrl(url)}" class="${cls(block, '__link')}"${lineAttr(block, 'url', 'href')}>${escapeHtml(label)}</a></div>`;
  },
};

const divider: BlockDefinition = {
  name: 'divider',
  contentMode: 'properties',
  styleHints: {
    self: ['width', 'max-width', 'height', 'color', 'background', 'margin', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity'],
  },
  compile: (block) => `<hr class="${cls(block)}">`,
};

const spacer: BlockDefinition = {
  name: 'spacer',
  contentMode: 'properties',
  styleHints: {
    self: ['background', 'margin'],
  },
  compile: (block, ctx) => {
    const raw = requireProp(block, 'height', ctx);
    if (!raw) {
      return errorHtml('spacer block requires "height" property', block.position.start.line);
    }
    const validated = safeCss(raw);
    if (!validated) {
      compileError(block, `Invalid CSS value for "height": ${raw}`, ctx);
      return errorHtml(`spacer has invalid "height" value: ${raw}`, block.position.start.line);
    }
    return `<div class="${cls(block)}" style="height:${cssVal(validated)};"${lineAttr(block, 'height')}></div>`;
  },
};

const code: BlockDefinition = {
  name: 'code',
  contentMode: 'mixed',
  styleHints: {
    self: ['font-family', 'font-size', 'color', 'background', 'padding', 'margin', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow', 'overflow'],
  },
  contentHints: { contentBody: true },
  compile: (block) => {
    const lang = prop(block, 'lang');
    const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
    return `<div class="${cls(block)}"><pre><code${langAttr}${lineAttr(block, 'lang')}>${escapeHtml(block.content)}</code></pre></div>`;
  },
};

const quote: BlockDefinition = {
  name: 'quote',
  contentMode: 'mixed',
  targets: {
    author: { label: 'Author' },
  },
  styleHints: {
    self: ['color', 'font-family', 'font-size', 'font-style', 'line-height', 'text-align', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
    author: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'margin', 'padding'],
  },
  contentHints: { contentProps: ['author'], contentBody: true },
  compile: (block) => {
    const author = prop(block, 'author');
    const footer = author
      ? `<footer class="${cls(block, '__author')}"${lineAttr(block, 'author')}>\u2014 ${escapeHtml(author)}</footer>`
      : '';
    return `<blockquote class="${cls(block)}">${md(block)}${footer}</blockquote>`;
  },
};

const hero: BlockDefinition = {
  name: 'hero',
  contentMode: 'mixed',
  targets: {
    img: { label: 'Image' },
    content: { label: 'Content' },
  },
  styleHints: {
    self: ['padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'text-align', 'min-height', 'overflow', 'opacity', 'box-shadow'],
    img: ['width', 'max-width', 'height', 'margin', 'padding', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
    content: ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'text-align', 'background', 'border-radius'],
  },
  contentHints: { contentProps: ['image', 'src'], contentBody: true },
  compile: (block) => {
    const src = prop(block, 'image') ?? prop(block, 'src');
    const alt = prop(block, 'alt') ?? '';
    const imageHtml = src
      ? `<img src="${safeUrl(src)}" alt="${escapeHtml(alt)}" class="${cls(block, '__img')}"${lineAttr(block, 'image', 'src')}>`
      : '';
    const contentHtml = block.content
      ? `<div class="${cls(block, '__content')}">${md(block)}</div>`
      : '';
    return `<section class="${cls(block)}">${imageHtml}${contentHtml}</section>`;
  },
};

const section: BlockDefinition = {
  name: 'section',
  contentMode: 'mixed',
  isContainer: true,
  targets: {
    title: { label: 'Title' },
  },
  styleHints: {
    self: ['text-align', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'gap', 'opacity', 'box-shadow', 'overflow'],
    title: ['color', 'font-family', 'font-size', 'font-weight', 'margin', 'padding', 'line-height', 'border-width', 'border-style', 'border-color'],
  },
  contentHints: { contentChildren: true },
  compile: (block) => {
    const title = prop(block, 'title');
    const titleHtml = title
      ? `<h2 class="${cls(block, '__title')}"${lineAttr(block, 'title')}>${escapeHtml(title)}</h2>`
      : '';
    return `<section class="${cls(block)}">${titleHtml}{{children}}</section>`;
  },
};

const card: BlockDefinition = {
  name: 'card',
  contentMode: 'mixed',
  targets: {
    img: { label: 'Image' },
    body: { label: 'Body' },
    link: { label: 'Link' },
  },
  styleHints: {
    self: ['text-align', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'box-shadow', 'overflow', 'opacity', 'max-width'],
    img: ['width', 'max-width', 'height', 'margin', 'padding', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
    body: ['text-align', 'color', 'font-size', 'font-family', 'line-height', 'padding', 'margin', 'background'],
    link: ['text-align', 'color', 'font-size', 'font-weight', 'font-family', 'padding', 'margin', 'background', 'border-radius'],
  },
  contentHints: { contentProps: ['image', 'link', 'url'], contentBody: true },
  compile: (block) => {
    const img = prop(block, 'image');
    const link = prop(block, 'link') ?? prop(block, 'url');
    const imgHtml = img
      ? `<img src="${safeUrl(img)}" alt="" class="${cls(block, '__img')}"${lineAttr(block, 'image')}>`
      : '';
    const linkHtml = link
      ? `<a href="${safeUrl(link)}" class="${cls(block, '__link')}"${lineAttr(block, 'link', 'url')}>Read more</a>`
      : '';
    return `<article class="${cls(block)}">${imgHtml}<div class="${cls(block, '__body')}">${md(block)}${linkHtml}</div></article>`;
  },
};

const list: BlockDefinition = {
  name: 'list',
  contentMode: 'text',
  styleHints: {
    self: ['text-align', 'color', 'font-family', 'font-size', 'font-style', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  },
  contentHints: { contentBody: true },
  compile: (block) => `<div class="${cls(block)}">${md(block)}</div>`,
};

const header: BlockDefinition = {
  name: 'header',
  contentMode: 'mixed',
  targets: {
    logo: { label: 'Logo' },
    title: { label: 'Title' },
    subtitle: { label: 'Subtitle' },
  },
  styleHints: {
    self: ['text-align', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
    logo: ['width', 'max-width', 'height', 'margin', 'padding', 'border-radius', 'opacity'],
    title: ['color', 'font-family', 'font-size', 'font-weight', 'margin', 'padding', 'line-height'],
    subtitle: ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'margin', 'padding', 'line-height'],
  },
  compile: (block) => {
    const logo = prop(block, 'logo');
    const title = prop(block, 'title') ?? block.content.trim();
    const logoHtml = logo
      ? `<img src="${safeUrl(logo)}" alt="" class="${cls(block, '__logo')}"${lineAttr(block, 'logo')}>`
      : '';
    const titleHtml = title
      ? `<h1 class="${cls(block, '__title')}"${lineAttr(block, 'title')}>${escapeHtml(title)}</h1>`
      : '';
    // When title is set via property, body content becomes the subtitle
    const subtitleHtml = prop(block, 'title') && block.content.trim()
      ? `<div class="${cls(block, '__subtitle')}">${md(block)}</div>`
      : '';
    return `<header class="${cls(block)}">${logoHtml}${titleHtml}${subtitleHtml}</header>`;
  },
};

const footer: BlockDefinition = {
  name: 'footer',
  contentMode: 'mixed',
  styleHints: {
    self: ['text-align', 'color', 'font-family', 'font-size', 'font-style', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'box-shadow'],
  },
  contentHints: { contentBody: true },
  compile: (block) => `<footer class="${cls(block)}">${md(block)}</footer>`,
};

const cta: BlockDefinition = {
  name: 'cta',
  contentMode: 'mixed',
  targets: {
    button: { label: 'Button' },
  },
  styleHints: {
    self: ['text-align', 'color', 'font-family', 'font-size', 'line-height', 'padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity'],
    button: ['text-align', 'color', 'background', 'font-family', 'font-size', 'font-weight', 'padding', 'margin', 'border-radius', 'border-width', 'border-style', 'border-color', 'box-shadow', 'opacity'],
  },
  contentHints: { contentProps: ['url', 'href'], contentBody: true },
  compile: (block, ctx) => {
    const url = prop(block, 'url') ?? prop(block, 'href');
    if (!url) {
      requireProp(block, 'url', ctx);
      return errorHtml('cta block requires "url" property', block.position.start.line);
    }
    const label = prop(block, 'buttonText') ?? prop(block, 'label');
    if (!label) {
      requireProp(block, 'buttonText', ctx);
      return errorHtml('cta block requires "buttonText" or "label" property', block.position.start.line);
    }
    const contentHtml = block.content ? md(block) : '';
    return `<div class="${cls(block)}">${contentHtml}<a href="${safeUrl(url)}" class="${cls(block, '__button')}"${lineAttr(block, 'url', 'href')}>${escapeHtml(label)}</a></div>`;
  },
};

const PRETTY_CSS = [
  '.mkly-core-html--pretty{',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;',
  'font-size:16px;line-height:1.7;color:inherit;',
  'white-space:pre-line;word-wrap:break-word',
  '}',
  '.mkly-core-html--pretty h1,.mkly-core-html--pretty h2,.mkly-core-html--pretty h3,.mkly-core-html--pretty h4,.mkly-core-html--pretty h5,.mkly-core-html--pretty h6{margin:1.2em 0 0.4em;line-height:1.3;font-weight:700;white-space:normal}',
  '.mkly-core-html--pretty h1{font-size:2em}',
  '.mkly-core-html--pretty h2{font-size:1.5em}',
  '.mkly-core-html--pretty h3{font-size:1.25em}',
  '.mkly-core-html--pretty p{margin:0 0 1em;white-space:normal}',
  '.mkly-core-html--pretty ul,.mkly-core-html--pretty ol{margin:0 0 1em;padding-left:1.5em;white-space:normal}',
  '.mkly-core-html--pretty li{margin-bottom:0.3em}',
  '.mkly-core-html--pretty a{color:var(--mkly-accent,#3b82f6);text-decoration:underline}',
  '.mkly-core-html--pretty blockquote{margin:1em 0;padding:0.5em 1em;border-left:3px solid var(--mkly-border,rgba(128,128,128,0.3));font-style:italic;white-space:normal}',
  '.mkly-core-html--pretty code{font-family:"JetBrains Mono",Menlo,monospace;font-size:0.9em;padding:0.15em 0.35em;border-radius:3px;background:var(--mkly-codeBg,var(--mkly-bgSubtle,rgba(128,128,128,0.1)))}',
  '.mkly-core-html--pretty pre{margin:1em 0;padding:1em;border-radius:6px;background:var(--mkly-codeBg,var(--mkly-bgSubtle,rgba(128,128,128,0.08)));overflow-x:auto;white-space:pre}',
  '.mkly-core-html--pretty pre code{padding:0;background:none}',
  '.mkly-core-html--pretty hr{border:none;border-top:1px solid var(--mkly-border,rgba(128,128,128,0.2));margin:1.5em 0}',
  '.mkly-core-html--pretty img{max-width:100%;height:auto;border-radius:4px}',
  '.mkly-core-html--pretty table{border-collapse:collapse;width:100%;margin:1em 0;white-space:normal}',
  '.mkly-core-html--pretty th,.mkly-core-html--pretty td{padding:0.5em 0.75em;border:1px solid var(--mkly-border,rgba(128,128,128,0.2));text-align:left}',
  '.mkly-core-html--pretty th{font-weight:600;background:var(--mkly-bgSubtle,rgba(128,128,128,0.05))}',
].join('');

const html: BlockDefinition = {
  name: 'html',
  contentMode: 'verbatim',
  styleHints: {
    self: ['padding', 'margin', 'background', 'border-radius', 'border-width', 'border-style', 'border-color', 'opacity', 'overflow'],
    '>': ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'margin', 'padding', 'background', 'border-radius', 'opacity'],
  },
  compile: (block, ctx) => {
    let content = block.content;
    if (ctx.variables.__sanitize === 'true') {
      content = content
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
    }
    const pretty = prop(block, 'prettify') === 'true';
    if (pretty) ctx.extraStyles.add(PRETTY_CSS);
    const blockClass = cls(block) + (pretty ? ' mkly-core-html--pretty' : '');
    return `<div class="${blockClass}">${content}</div>`;
  },
};

const CORE_BLOCKS: BlockDefinition[] = [
  heading, text, image, button, divider, spacer, code, quote,
  hero, section, card, list, header, footer, cta, html,
];

export function createRegistry(...presets: BlockDefinition[][]): BlockRegistry {
  const registry = new BlockRegistry();
  for (const preset of presets) {
    for (const def of preset) registry.register(def);
  }
  return registry;
}

export { CORE_BLOCKS };

const CORE_REVERSE: ReverseBlockHandler[] = [
  { cssClass: 'mkly-core-heading', blockType: 'core/heading' },
  { cssClass: 'mkly-core-text', blockType: 'core/text' },
  { cssClass: 'mkly-core-image', blockType: 'core/image' },
  { cssClass: 'mkly-core-button', blockType: 'core/button' },
  { cssClass: 'mkly-core-divider', blockType: 'core/divider' },
  { cssClass: 'mkly-core-spacer', blockType: 'core/spacer' },
  { cssClass: 'mkly-core-code', blockType: 'core/code' },
  { cssClass: 'mkly-core-quote', blockType: 'core/quote' },
  { cssClass: 'mkly-core-hero', blockType: 'core/hero' },
  { cssClass: 'mkly-core-section', blockType: 'core/section' },
  { cssClass: 'mkly-core-card', blockType: 'core/card' },
  { cssClass: 'mkly-core-list', blockType: 'core/list' },
  { cssClass: 'mkly-core-header', blockType: 'core/header' },
  { cssClass: 'mkly-core-footer', blockType: 'core/footer' },
  { cssClass: 'mkly-core-cta', blockType: 'core/cta' },
  { cssClass: 'mkly-core-html', blockType: 'core/html' },
];

const CORE_DOCS: Record<string, BlockDocs> = {
  'core/heading': {
    displayName: 'Heading',
    icon: 'heading',
    color: '#3b82f6',
    summary: 'Renders a heading element (h1-h6). Use the level property to control hierarchy.',
    usage: '--- core/heading\nlevel: 2\n\nWelcome to our newsletter',
    htmlPreview: '<h2 class="mkly-core-heading mkly-core-heading--2">Welcome to our newsletter</h2>',
    properties: [
      { name: 'level', description: 'Heading level 1-6', example: '2' },
      { name: 'text', description: 'Heading text (alternative to content)', example: 'Hello World' },
    ],
    tips: ['Default level is 2 if not specified', 'Use content mode (text after block) rather than text property for markdown support'],
  },
  'core/text': {
    displayName: 'Text',
    icon: 'text',
    color: '#64748b',
    summary: 'Rich text paragraph with full markdown support (bold, italic, links, lists).',
    usage: '--- core/text\n\nThis is **bold** and *italic* text with a [link](https://example.com).',
    htmlPreview: '<div class="mkly-core-text"><p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p></div>',
    properties: [],
    tips: ['Supports markdown: **bold**, *italic*, `code`, [links](url)', 'Has "text" content mode — everything is content, no key:value properties'],
  },
  'core/image': {
    displayName: 'Image',
    icon: 'image',
    color: '#10b981',
    summary: 'Displays an image with optional alt text and width control.',
    usage: '--- core/image\nsrc: https://picsum.photos/seed/mkly-image/600/400\nalt: A scenic mountain view\nwidth: 600',
    htmlPreview: '<figure class="mkly-core-image"><img src="https://picsum.photos/seed/mkly-image/600/400" alt="A scenic mountain view" width="600" class="mkly-core-image__img"></figure>',
    properties: [
      { name: 'src', description: 'Image URL', required: true, example: 'https://example.com/photo.jpg' },
      { name: 'alt', description: 'Alt text for accessibility', example: 'A scenic mountain view' },
      { name: 'width', description: 'Image display width', example: '600' },
      { name: 'url', description: 'Alias for src', example: 'https://example.com/photo.jpg' },
    ],
    tips: ['Always set alt text for accessibility', 'Use src (preferred) or url for the image source'],
  },
  'core/button': {
    displayName: 'Button',
    icon: 'button',
    color: '#f97316',
    summary: 'Renders a clickable button linking to a URL.',
    usage: '--- core/button\nurl: https://example.com\n\nClick me',
    htmlPreview: '<div class="mkly-core-button"><a href="https://example.com" class="mkly-core-button__link">Click me</a></div>',
    properties: [
      { name: 'url', description: 'Target URL', required: true, example: 'https://example.com' },
      { name: 'href', description: 'Alias for url', example: 'https://example.com' },
      { name: 'label', description: 'Button label (alternative to content)', example: 'Click me' },
    ],
    tips: ['Provide label via content (text after block) or the label property', 'Both url and href work as the link target'],
  },
  'core/divider': {
    displayName: 'Divider',
    icon: 'divider',
    color: '#9ca3af',
    summary: 'Horizontal rule to visually separate sections.',
    usage: '--- core/divider',
    htmlPreview: '<hr class="mkly-core-divider">',
    properties: [],
    tips: ['No properties needed — just the block declaration', 'Style with CSS variables or inline styles'],
  },
  'core/spacer': {
    displayName: 'Spacer',
    icon: 'spacer',
    color: '#94a3b8',
    summary: 'Adds vertical spacing between blocks.',
    usage: '--- core/spacer\nheight: 40',
    htmlPreview: '<div class="mkly-core-spacer" style="height:40px;"></div>',
    properties: [
      { name: 'height', description: 'Spacing height in pixels', required: true, example: '40' },
    ],
    tips: ['Value is in pixels (px unit is added automatically)', 'Use for precise spacing control between sections'],
  },
  'core/code': {
    displayName: 'Code',
    icon: 'code',
    color: '#f59e0b',
    summary: 'Displays a formatted code block with optional language hint.',
    usage: '--- core/code\nlang: javascript\n\nconst hello = "world";',
    htmlPreview: '<div class="mkly-core-code"><pre><code data-lang="javascript">const hello = &quot;world&quot;;</code></pre></div>',
    properties: [
      { name: 'lang', description: 'Programming language for syntax hints', example: 'javascript' },
    ],
    tips: ['Content is rendered verbatim (HTML-escaped)', 'Use lang property for syntax highlighting integration'],
  },
  'core/quote': {
    displayName: 'Quote',
    icon: 'quote',
    color: '#6366f1',
    summary: 'Blockquote with optional author attribution.',
    usage: '--- core/quote\nauthor: Albert Einstein\n\nImagination is more important than knowledge.',
    htmlPreview: '<blockquote class="mkly-core-quote"><p>Imagination is more important than knowledge.</p><footer class="mkly-core-quote__author">\u2014 Albert Einstein</footer></blockquote>',
    properties: [
      { name: 'author', description: 'Quote attribution', example: 'Albert Einstein' },
    ],
    tips: ['Content supports markdown formatting', 'Author is automatically prefixed with an em dash'],
  },
  'core/hero': {
    displayName: 'Hero',
    icon: 'hero',
    color: '#0ea5e9',
    summary: 'Full-width hero section with optional background image and overlay content.',
    usage: '--- core/hero\nimage: https://picsum.photos/seed/mkly-hero/800/400\nalt: Hero banner\n\n# Welcome\n\nYour journey starts here.',
    htmlPreview: '<section class="mkly-core-hero"><img src="https://picsum.photos/seed/mkly-hero/800/400" alt="Hero banner" class="mkly-core-hero__img"><div class="mkly-core-hero__content"><h1>Welcome</h1><p>Your journey starts here.</p></div></section>',
    properties: [
      { name: 'image', description: 'Hero background/banner image URL', example: 'https://example.com/hero.jpg' },
      { name: 'src', description: 'Alias for image', example: 'https://example.com/hero.jpg' },
      { name: 'alt', description: 'Alt text for the hero image', example: 'Hero banner' },
    ],
    tips: ['Content supports full markdown including headings', 'Image spans full width by default'],
  },
  'core/section': {
    displayName: 'Section',
    icon: 'section',
    color: '#06b6d4',
    summary: 'Container block that groups child blocks under an optional title.',
    usage: '--- core/section\ntitle: Latest News\n\n--- core/text\n\nHere are the latest updates.\n\n--- /core/section',
    htmlPreview: '<section class="mkly-core-section"><h2 class="mkly-core-section__title">Latest News</h2><!-- children rendered here --></section>',
    properties: [
      { name: 'title', description: 'Section heading text', example: 'Latest News' },
    ],
    tips: ['Set the title via the title: property', 'This is a container — close it with --- /section'],
  },
  'core/card': {
    displayName: 'Card',
    icon: 'card',
    color: '#8b5cf6',
    summary: 'Content card with optional image, text, and link.',
    usage: '--- core/card\nimage: https://picsum.photos/seed/mkly-card/400/250\nlink: https://example.com/article\n\nA brief summary of the article.',
    htmlPreview: '<article class="mkly-core-card"><img src="https://picsum.photos/seed/mkly-card/400/250" alt="" class="mkly-core-card__img"><div class="mkly-core-card__body"><p>A brief summary of the article.</p><a href="https://example.com/article" class="mkly-core-card__link">Read more</a></div></article>',
    properties: [
      { name: 'image', description: 'Card thumbnail image URL', example: 'https://example.com/thumb.jpg' },
      { name: 'link', description: 'Card link URL', example: 'https://example.com/article' },
      { name: 'url', description: 'Alias for link', example: 'https://example.com/article' },
    ],
    tips: ['Content supports markdown', 'Link automatically renders a "Read more" anchor'],
  },
  'core/list': {
    displayName: 'List',
    icon: 'list',
    color: '#14b8a6',
    summary: 'Renders markdown lists (ordered or unordered).',
    usage: '--- core/list\n\n- First item\n- Second item\n- Third item',
    htmlPreview: '<div class="mkly-core-list"><ul><li>First item</li><li>Second item</li><li>Third item</li></ul></div>',
    properties: [],
    tips: ['Use markdown list syntax: - for unordered, 1. for ordered', 'Supports nested lists via indentation'],
  },
  'core/header': {
    displayName: 'Header',
    icon: 'header',
    color: '#2563eb',
    summary: 'Newsletter/page header with optional logo and title.',
    usage: '--- core/header\nlogo: https://picsum.photos/seed/mkly-logo/200/50\ntitle: My Newsletter',
    htmlPreview: '<header class="mkly-core-header"><img src="https://picsum.photos/seed/mkly-logo/200/50" alt="" class="mkly-core-header__logo"><h1 class="mkly-core-header__title">My Newsletter</h1></header>',
    properties: [
      { name: 'logo', description: 'Logo image URL', example: 'https://example.com/logo.png' },
      { name: 'title', description: 'Header title text', example: 'My Newsletter' },
    ],
    tips: ['Title can also be provided as content text', 'Typically the first block in a document'],
  },
  'core/footer': {
    displayName: 'Footer',
    icon: 'footer',
    color: '#475569',
    summary: 'Page/newsletter footer with markdown content.',
    usage: '--- core/footer\n\nCopyright 2026. [Unsubscribe](https://example.com/unsub)',
    htmlPreview: '<footer class="mkly-core-footer"><p>Copyright 2026. <a href="https://example.com/unsub">Unsubscribe</a></p></footer>',
    properties: [],
    tips: ['Content supports full markdown including links', 'Typically the last block in a document'],
  },
  'core/cta': {
    displayName: 'Call to Action',
    icon: 'cta',
    color: '#f43f5e',
    summary: 'Call-to-action block with descriptive text and a prominent button.',
    usage: '--- core/cta\nurl: https://example.com/signup\nbuttonText: Sign Up Now\n\nJoin thousands of readers today.',
    htmlPreview: '<div class="mkly-core-cta"><p>Join thousands of readers today.</p><a href="https://example.com/signup" class="mkly-core-cta__button">Sign Up Now</a></div>',
    properties: [
      { name: 'url', description: 'Button target URL', required: true, example: 'https://example.com/signup' },
      { name: 'href', description: 'Alias for url', example: 'https://example.com/signup' },
      { name: 'buttonText', description: 'Button label text', required: true, example: 'Sign Up Now' },
      { name: 'label', description: 'Alias for buttonText', example: 'Sign Up Now' },
    ],
    tips: ['Both url and buttonText (or their aliases) are required', 'Content above the button supports markdown'],
  },
  'core/html': {
    displayName: 'HTML',
    icon: 'code',
    color: '#64748b',
    summary: 'Raw HTML passthrough — content is rendered as-is without processing. Toggle "prettify" for clean typography on plain text or markdown content.',
    usage: '--- core/html\nprettify: true\n\n<h2>My Content</h2>\n<p>Text with nice formatting.</p>\n\n--- /core/html',
    htmlPreview: '<div style="font-family:-apple-system,sans-serif;line-height:1.7"><h3 style="margin:0 0 8px;font-weight:700">Formatted Content</h3><p style="margin:0 0 8px">This is prettified HTML with clean typography, proper spacing, and readable text.</p><ul style="padding-left:1.5em;margin:0"><li>Lists look nice</li><li>Links are styled</li></ul></div>',
    properties: [
      { name: 'prettify', description: 'Add typography styles for readable formatting', example: 'true' },
    ],
    tips: ['Content is NOT escaped — use with care', 'Set prettify: true for clean text formatting without changing the HTML', 'Verbatim content mode: no markdown processing'],
  },
};

const CORE_KEYFRAMES: Record<string, string> = {
  fadeIn: 'from{opacity:0}to{opacity:1}',
  fadeOut: 'from{opacity:1}to{opacity:0}',
  slideUp: 'from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}',
  slideDown: 'from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}',
  slideInLeft: 'from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}',
  slideInRight: 'from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}',
  scaleIn: 'from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}',
  pulse: '0%,100%{opacity:1}50%{opacity:0.6}',
  bounce: '0%{transform:translateY(0)}30%{transform:translateY(-8px)}50%{transform:translateY(0)}70%{transform:translateY(-4px)}100%{transform:translateY(0)}',
  shake: '0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}',
};

export const CORE_KIT: MklyKit = {
  name: 'core',
  displayName: 'Core',
  description: 'Core layout and content blocks',
  versions: { supported: [1], current: 1 },
  blocks: CORE_BLOCKS,
  schemas: CORE_SCHEMAS,
  keyframes: CORE_KEYFRAMES,
  themes: CORE_THEMES,
  presets: CORE_PRESETS,
  reverse: CORE_REVERSE,
  docs: CORE_DOCS,
  metaProperties: [
    { name: 'version', description: 'Document format version', required: true, example: '1' },
    { name: 'title', description: 'Document or newsletter title', example: 'Weekly Digest' },
  ],
};
