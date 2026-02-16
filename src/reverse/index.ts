import { detectOrigin } from './detector';
import type { HtmlOrigin } from './detector';
import { reverseWeb } from './web-parser';
import { reverseEmail } from './email-parser';
import { reverseGeneric } from './generic-parser';
import type { MklyKit } from '../kit';

export type { HtmlOrigin } from './detector';
export { detectOrigin } from './detector';
export { reverseWeb } from './web-parser';
export type { ParsedBlock, ReverseWebOptions } from './web-parser';
export { reverseEmail } from './email-parser';
export { reverseGeneric } from './generic-parser';
export { htmlToMarkdown } from './html-to-markdown';
export { importHtml } from './import';
export type { ImportOptions } from './import';

export interface HtmlToMklyOptions {
  origin?: HtmlOrigin;
  preserveStyles?: boolean;
  preserveMeta?: boolean;
  kits?: Record<string, MklyKit>;
}

export function htmlToMkly(html: string, options?: HtmlToMklyOptions): string {
  // Strip compiler-injected data-mkly-* attributes (sourceMap, active state, block identity)
  const cleanHtml = html.replace(/\s+data-mkly-[\w-]+(?:="[^"]*")?/g, '');
  const origin = options?.origin ?? detectOrigin(cleanHtml);

  switch (origin) {
    case 'mkly-web':
      return reverseWeb(cleanHtml, { ...options, kits: options?.kits });
    case 'mkly-email':
      return reverseEmail(cleanHtml, { kits: options?.kits });
    case 'generic':
      return reverseGeneric(cleanHtml);
  }
}
