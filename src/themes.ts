import type { MklyTheme } from './types';

/** Color-mapping CSS shared by light and dark themes — maps every element to theme variables */
const THEME_COLOR_CSS = `
.mkly-document {
  color: var(--mkly-text);
  background: var(--mkly-bg);
}
.mkly-document p { color: var(--mkly-text); }
.mkly-document a { color: var(--mkly-accent); }
.mkly-document a:not([class]):hover { color: var(--mkly-accent-hover); }
.mkly-document h1, .mkly-document h2, .mkly-document h3,
.mkly-document h4, .mkly-document h5, .mkly-document h6 { color: var(--mkly-text); }
.mkly-document strong { color: var(--mkly-text); }
.mkly-document em { color: var(--mkly-text); }
.mkly-document blockquote { color: var(--mkly-muted); }
.mkly-document hr { border-color: var(--mkly-border); }
.mkly-document code:not(pre code) { background: var(--mkly-code-bg); color: var(--mkly-text); }
.mkly-document pre { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }

/* core blocks */
.mkly-core-heading { color: var(--mkly-text); }
.mkly-core-text { color: var(--mkly-text); }
.mkly-core-button .mkly-core-button__link { background: var(--mkly-accent); color: var(--mkly-button-text); }
.mkly-core-button .mkly-core-button__link:hover { background: var(--mkly-accent-hover); }
.mkly-core-divider { background: var(--mkly-border); }
.mkly-core-code { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-core-quote { color: var(--mkly-muted); border-left-color: var(--mkly-accent); }
.mkly-core-quote__author { color: var(--mkly-muted); }
.mkly-core-hero { background: var(--mkly-bg-subtle); }
.mkly-core-section { border-top-color: var(--mkly-border); }
.mkly-core-section__title { color: var(--mkly-text); border-bottom-color: var(--mkly-accent); }
.mkly-core-card { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-core-card__body h2 { color: var(--mkly-text); }
.mkly-core-card__link { color: var(--mkly-accent); }
.mkly-core-card__link:hover { color: var(--mkly-accent-hover); }
.mkly-core-list { color: var(--mkly-text); }
.mkly-core-header { border-bottom-color: var(--mkly-border); }
.mkly-core-header__title { color: var(--mkly-text); }
.mkly-core-footer { color: var(--mkly-muted); border-top-color: var(--mkly-border); }
.mkly-core-footer a { color: var(--mkly-muted); }
.mkly-core-footer a:hover { color: var(--mkly-accent); }
.mkly-core-cta { background: var(--mkly-bg-subtle); }
.mkly-core-cta .mkly-core-cta__button { background: var(--mkly-accent); color: var(--mkly-button-text); }
.mkly-core-cta .mkly-core-cta__button:hover { background: var(--mkly-accent-hover); }

/* newsletter blocks */
.mkly-newsletter-intro { color: var(--mkly-text); }
.mkly-newsletter-featured { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-featured__source { color: var(--mkly-accent); }
.mkly-newsletter-featured__author { color: var(--mkly-muted); }
.mkly-newsletter-featured__link { color: var(--mkly-accent); }
.mkly-newsletter-featured__link:hover { color: var(--mkly-accent-hover); }
.mkly-newsletter-category { border-top-color: var(--mkly-border); }
.mkly-newsletter-category__title { color: var(--mkly-text); border-bottom-color: var(--mkly-accent); }
.mkly-newsletter-item { border-bottom-color: var(--mkly-border); }
.mkly-newsletter-item__source { color: var(--mkly-accent); }
.mkly-newsletter-item__link { color: var(--mkly-accent); }
.mkly-newsletter-item__link:hover { color: var(--mkly-accent-hover); }
.mkly-newsletter-quickHits { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-quickHits__title { color: var(--mkly-text); }
.mkly-newsletter-tools { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-tools__title { color: var(--mkly-text); }
.mkly-newsletter-tipOfTheDay { background: var(--mkly-bg-subtle); border-left-color: var(--mkly-accent); }
.mkly-newsletter-tipOfTheDay__title { color: var(--mkly-accent); }
.mkly-newsletter-community { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-community__quote { color: var(--mkly-muted); border-left-color: var(--mkly-accent); }
.mkly-newsletter-community__author { color: var(--mkly-text); border-top-color: var(--mkly-border); }
.mkly-newsletter-personalNote { color: var(--mkly-text); background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-poll { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-poll__question { color: var(--mkly-text); }
.mkly-newsletter-poll__option { color: var(--mkly-accent); border-color: var(--mkly-border); background: var(--mkly-bg); }
.mkly-newsletter-poll__option:hover { border-color: var(--mkly-accent); }
.mkly-newsletter-recommendations { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-recommendations__title { color: var(--mkly-text); }
.mkly-newsletter-sponsor { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-sponsor__badge { color: var(--mkly-muted); }
.mkly-newsletter-sponsor__link { color: var(--mkly-accent); }
.mkly-newsletter-sponsor__link:hover { color: var(--mkly-accent-hover); }
.mkly-newsletter-outro { color: var(--mkly-muted); }
.mkly-newsletter-outro .mkly-newsletter-outro__cta { background: var(--mkly-accent); color: var(--mkly-button-text); }
.mkly-newsletter-outro .mkly-newsletter-outro__cta:hover { background: var(--mkly-accent-hover); }
.mkly-newsletter-custom { background: var(--mkly-bg-subtle); border-color: var(--mkly-border); }
.mkly-newsletter-custom__title { color: var(--mkly-text); }
`;

export const CORE_THEMES: MklyTheme[] = [
  {
    name: 'default',
    displayName: 'Core/Default',
    description: 'No colors — inherits from browser, only sets fonts and spacing',
    variables: {
      radius: '0.5rem',
      fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontHeading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontMono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      spacing: '1.5rem',
    },
    rawCss: THEME_COLOR_CSS,
  },
  {
    name: 'light',
    displayName: 'Core/Light',
    description: 'Monochrome light — black on white, pure B&W',
    variables: {
      accent: '#000000',
      accentHover: '#333333',
      bg: '#ffffff',
      text: '#000000',
      muted: '#666666',
      border: '#d0d0d0',
      bgSubtle: '#ffffff',
      buttonText: '#ffffff',
      codeBg: '#f5f5f5',
      radius: '0.5rem',
      fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontHeading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontMono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      spacing: '1.5rem',
    },
    rawCss: THEME_COLOR_CSS,
  },
  {
    name: 'dark',
    displayName: 'Core/Dark',
    description: 'Monochrome dark — white on black, pure B&W',
    variables: {
      accent: '#ffffff',
      accentHover: '#cccccc',
      bg: '#000000',
      text: '#ffffff',
      muted: '#999999',
      border: '#333333',
      bgSubtle: '#000000',
      buttonText: '#000000',
      codeBg: '#111111',
      radius: '0.5rem',
      fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontHeading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      fontMono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      spacing: '1.5rem',
    },
    rawCss: THEME_COLOR_CSS,
  },
];
