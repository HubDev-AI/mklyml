export type HtmlOrigin = 'mkly-web' | 'mkly-email' | 'generic';

export function detectOrigin(html: string): HtmlOrigin {
  if (html.includes('class="mkly-document"') || /class="mkly-[\w-]+"/.test(html)) {
    return 'mkly-web';
  }

  if (html.includes('<!--[if mso]>') && html.includes('role="presentation"')) {
    return 'mkly-email';
  }

  return 'generic';
}
