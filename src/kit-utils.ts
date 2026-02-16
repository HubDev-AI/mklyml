import type { MklyBlock } from './types';
import { escapeHtml, isSafeUrl, markdownToHtml } from './utils';

export { escapeHtml, isSafeUrl, markdownToHtml } from './utils';

export function safeUrl(url: string | undefined): string {
  if (!url) return '';
  return isSafeUrl(url) ? escapeHtml(url) : '';
}

export function md(block: MklyBlock): string {
  return markdownToHtml(block.content, block.contentLineMap);
}

export function clampInt(value: string | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
