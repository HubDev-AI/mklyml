import type { MklyPreset } from './types';

export const CORE_PRESETS: MklyPreset[] = [
  {
    name: 'default',
    displayName: 'Core/Default',
    description: 'Clean modern — 0.5rem radius, subtle shadows, standard padding',
    rawCss: `/* mkly base layout — core/default preset */

/* ── document root ── */
.mkly-document {
  font-family: var(--mkly-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
  font-size: 1rem;
  line-height: calc(1.65 * var(--_lhs, 1));
  padding: var(--mkly-spacing, 1.5rem);
  max-width: 42.5rem;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --_gs: var(--mkly-gap-scale, 1);
  --_lhs: var(--mkly-line-height-scale, 1);
}

.mkly-document * { box-sizing: border-box; }

/* ── html tags ── */
.mkly-document p {
  margin: 0 0 1em;
  line-height: calc(1.65 * var(--_lhs, 1));
}
.mkly-document p:last-child { margin-bottom: 0; }

.mkly-document a {
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s;
}
.mkly-document a:not([class]):hover { text-decoration: underline; }

.mkly-document strong { font-weight: 700; }
.mkly-document em { font-style: italic; }

.mkly-document img {
  max-width: 100%;
  height: auto;
  display: block;
}

.mkly-document h1, .mkly-document h2, .mkly-document h3,
.mkly-document h4, .mkly-document h5, .mkly-document h6 {
  font-family: var(--mkly-font-heading, inherit);
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 0.5em;
  letter-spacing: -0.01em;
}
.mkly-document h1 { font-size: 2em; letter-spacing: -0.02em; }
.mkly-document h2 { font-size: 1.5em; letter-spacing: -0.015em; }
.mkly-document h3 { font-size: 1.25em; }
.mkly-document h4 { font-size: 1.1em; }
.mkly-document h5 { font-size: 1em; }
.mkly-document h6 { font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.04em; }

.mkly-document ul, .mkly-document ol {
  margin: 0 0 1em;
  padding-left: 1.5em;
}
.mkly-document li {
  margin-bottom: 0.35em;
  line-height: calc(1.6 * var(--_lhs, 1));
}
.mkly-document li:last-child { margin-bottom: 0; }

.mkly-document blockquote:not([class]) {
  margin: 0;
  padding: 0;
  font-style: italic;
}

.mkly-document hr {
  border: none;
  height: 0.0625rem;
  margin: calc(1.5rem * var(--_gs)) 0;
}

.mkly-document code:not(pre code) {
  font-family: var(--mkly-font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace);
  font-size: 0.88em;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
}
.mkly-document pre {
  border-width: 0.0625rem;
  border-style: solid;
  border-radius: var(--mkly-radius, 0.5rem);
  overflow-x: auto;
  margin: 0;
}

.mkly-document table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em;
}
.mkly-document th, .mkly-document td {
  padding: 0.625rem 0.875rem;
  text-align: left;
  border-bottom-width: 0.0625rem;
  border-bottom-style: solid;
}
.mkly-document th {
  font-weight: 600;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── heading block ── */
.mkly-core-heading {
  font-family: var(--mkly-font-heading, inherit);
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 calc(1.5rem * var(--_gs));
  letter-spacing: -0.01em;
}
.mkly-core-heading--1 { font-size: 2em; letter-spacing: -0.02em; }
.mkly-core-heading--2 { font-size: 1.5em; letter-spacing: -0.015em; }
.mkly-core-heading--3 { font-size: 1.25em; }
.mkly-core-heading--4 { font-size: 1.1em; }
.mkly-core-heading--5 { font-size: 1em; }
.mkly-core-heading--6 { font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.04em; }

/* ── text block ── */
.mkly-core-text {
  margin-bottom: calc(1.5rem * var(--_gs));
  line-height: calc(1.65 * var(--_lhs, 1));
}

/* ── image block ── */
.mkly-core-image {
  margin: 0 0 calc(1.5rem * var(--_gs));
  line-height: 0;
}
.mkly-core-image__img {
  width: 100%;
  border-radius: var(--mkly-radius, 0.5rem);
  display: block;
  box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.06);
}

/* ── button block ── */
.mkly-core-button {
  margin: 0 0 calc(1.5rem * var(--_gs));
}
.mkly-core-button__link {
  display: inline-block;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none !important;
  padding: 0.75rem 1.75rem;
  border-radius: var(--mkly-radius, 0.5rem);
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
  line-height: 1.4;
  box-shadow: 0 0.0625rem 0.1875rem rgba(0,0,0,0.08);
}

/* ── divider block ── */
.mkly-core-divider {
  margin: calc(1.5rem * var(--_gs)) 0;
  border: none;
  height: 0.0625rem;
}

/* ── spacer block ── */
.mkly-core-spacer {
  line-height: 0;
  font-size: 0;
}

/* ── code block ── */
.mkly-core-code {
  margin: 0 0 calc(1.5rem * var(--_gs));
  border-radius: var(--mkly-radius, 0.5rem);
  padding: 1rem 1.25rem;
  border-width: 0.0625rem;
  border-style: solid;
  overflow: hidden;
  box-shadow: 0 0.0625rem 0.25rem rgba(0,0,0,0.04);
}
.mkly-core-code pre {
  overflow-x: auto;
  font-family: var(--mkly-font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace);
  font-size: 0.8125rem;
  line-height: calc(1.6 * var(--_lhs, 1));
  margin: 0;
  border: none;
  padding: 0;
}
.mkly-core-code code {
  font-family: inherit;
  font-size: inherit;
}

/* ── quote block ── */
.mkly-core-quote {
  margin: 0 0 calc(1.5rem * var(--_gs));
  font-style: italic;
  padding: 1.375rem 1.75rem 1.375rem 2rem;
  border-left-width: 0.25rem;
  border-left-style: solid;
  border-radius: 0 var(--mkly-radius, 0.5rem) var(--mkly-radius, 0.5rem) 0;
  line-height: calc(1.75 * var(--_lhs, 1));
  font-size: 1.05em;
}
.mkly-core-quote p { margin-bottom: 0.6em; }
.mkly-core-quote p:last-of-type { margin-bottom: 0; }
.mkly-core-quote__author {
  display: block;
  margin-top: 0.875rem;
  padding-top: 0.75rem;
  border-top-width: 0.0625rem;
  border-top-style: solid;
  font-size: 0.85em;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* ── hero block ── */
.mkly-core-hero {
  margin: 0 0 calc(1.5rem * var(--_gs));
  position: relative;
  overflow: hidden;
  border-radius: var(--mkly-radius, 0.5rem);
  box-shadow: 0 0.25rem 1rem rgba(0,0,0,0.08);
}
.mkly-core-hero__img {
  border-radius: var(--mkly-radius, 0.5rem);
  display: block;
  width: 100%;
}
.mkly-core-hero__content {
  padding: 1.75rem 1.5rem;
}
.mkly-core-hero__content h1 {
  font-size: 1.75em;
  font-weight: 700;
  margin: 0 0 0.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.mkly-core-hero__content h2 {
  font-size: 1.4em;
  font-weight: 600;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}
.mkly-core-hero__content p {
  margin: 0 0 0.75em;
  line-height: calc(1.6 * var(--_lhs, 1));
}

/* ── section block ── */
.mkly-core-section {
  margin: 0 0 calc(1.5rem * var(--_gs));
  padding-top: calc(1.5rem * var(--_gs));
  border-top-width: 0.0625rem;
  border-top-style: solid;
}
.mkly-core-section__title {
  font-family: var(--mkly-font-heading, inherit);
  font-size: 1.3em;
  font-weight: 700;
  margin: 0 0 1rem;
  padding-bottom: 0.625rem;
  border-bottom-width: 0.125rem;
  border-bottom-style: solid;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* ── card block ── */
.mkly-core-card {
  margin: 0 0 calc(1rem * var(--_gs));
  border-radius: var(--mkly-radius, 0.5rem);
  overflow: hidden;
  border-width: 0.0625rem;
  border-style: solid;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.06);
}
.mkly-core-card__img {
  width: 100%;
  display: block;
}
.mkly-core-card__body {
  padding: 1.25rem;
}
.mkly-core-card__body h2 {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}
.mkly-core-card__body p {
  margin: 0 0 0.5rem;
  font-size: 0.95em;
  line-height: calc(1.55 * var(--_lhs, 1));
}
.mkly-core-card__link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.9em;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
}

/* ── list block ── */
.mkly-core-list {
  margin: 0 0 calc(1.5rem * var(--_gs));
}
.mkly-core-list ul, .mkly-core-list ol {
  padding-left: 1.5em;
  margin: 0;
}
.mkly-core-list li {
  margin-bottom: 0.375rem;
  line-height: calc(1.6 * var(--_lhs, 1));
}
.mkly-core-list li:last-child { margin-bottom: 0; }

/* ── header block ── */
.mkly-core-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: calc(1.5rem * var(--_gs));
  padding-bottom: 0.875rem;
  border-bottom-width: 0.0625rem;
  border-bottom-style: solid;
}
.mkly-core-header__logo {
  height: 2.5rem;
  width: auto;
  display: block;
  flex-shrink: 0;
}
.mkly-core-header__title {
  font-family: var(--mkly-font-heading, inherit);
  font-size: 1.4em;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

/* ── footer block ── */
.mkly-core-footer {
  margin-top: calc(1.5rem * var(--_gs));
  text-align: center;
  font-size: 0.85em;
  padding-top: 1.25rem;
  border-top-width: 0.0625rem;
  border-top-style: solid;
  line-height: calc(1.6 * var(--_lhs, 1));
}
.mkly-core-footer p {
  margin: 0 0 0.375rem;
}
.mkly-core-footer a {
  font-weight: 500;
  text-decoration: underline;
}

/* ── cta block ── */
.mkly-core-cta {
  text-align: center;
  margin: 0 0 calc(1.5rem * var(--_gs));
  padding: 2rem 1.5rem;
  border-radius: var(--mkly-radius, 0.5rem);
  box-shadow: 0 0.125rem 0.75rem rgba(0,0,0,0.06);
}
.mkly-core-cta p {
  margin: 0 0 0.5rem;
  font-size: 1.05em;
  line-height: calc(1.6 * var(--_lhs, 1));
}
.mkly-core-cta__button {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none !important;
  padding: 0.75rem 1.75rem;
  border-radius: var(--mkly-radius, 0.5rem);
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
  line-height: 1.4;
  box-shadow: 0 0.0625rem 0.1875rem rgba(0,0,0,0.08);
}`,
    css: `core/heading
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/text
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/image
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/image.img
  borderRadius: 0.5rem

core/button
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/button.link
  padding: 0.75rem 1.75rem
  borderRadius: 0.5rem

core/divider
  marginTop: calc(1.5rem * var(--mkly-gap-scale, 1))
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/code
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  borderRadius: 0.5rem
  padding: 1rem 1.25rem

core/quote
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  padding: 1.375rem 1.75rem 1.375rem 2rem

core/hero
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  borderRadius: 0.5rem

core/hero.img
  borderRadius: 0.5rem

core/hero.content
  padding: 1.75rem 1.5rem

core/section
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  paddingTop: calc(1.5rem * var(--mkly-gap-scale, 1))

core/section.title
  paddingBottom: 0.625rem

core/card
  marginBottom: calc(1rem * var(--mkly-gap-scale, 1))
  borderRadius: 0.5rem
  overflow: hidden

core/card.body
  padding: 1.25rem

core/list
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))

core/header
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  paddingBottom: 1.25rem

core/footer
  marginTop: calc(1.5rem * var(--mkly-gap-scale, 1))
  paddingTop: 1.25rem

core/cta
  textAlign: center
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  padding: 2rem 1.5rem
  borderRadius: 0.5rem

core/cta.button
  padding: 0.75rem 1.75rem
  borderRadius: 0.5rem
core/spacer
  lineHeight: 0
  fontSize: 0

newsletter/featured
  marginBottom: calc(1.5rem * var(--mkly-gap-scale, 1))
  borderRadius: 0.5rem
  overflow: hidden

newsletter/featured.img
  width: 100%

newsletter/item
  marginBottom: calc(1rem * var(--mkly-gap-scale, 1))
  borderRadius: 0.5rem
  display: grid
  gridTemplateColumns: 1fr
  overflow: hidden

newsletter/item.img
  width: 100%
  aspectRatio: 16/9
  objectFit: cover

newsletter/item.body
  overflow: visible
  minWidth: 0
  padding: 0.75rem 1.25rem 0.8125rem
`,
  },
];
