import type { MklyPreset } from './types';

export const CORE_PRESETS: MklyPreset[] = [
  {
    name: 'default',
    displayName: 'Core/Default',
    description: 'Clean modern — 8px radius, subtle shadows, standard padding',
    rawCss: `/* mkly base layout — core/default preset */

/* ── document root ── */
.mkly-document {
  font-family: var(--mkly-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
  font-size: 16px;
  line-height: 1.65;
  padding: var(--mkly-spacing, 24px);
  max-width: 680px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --_gs: var(--mkly-gap-scale, 1);
}

.mkly-document * { box-sizing: border-box; }

/* ── html tags ── */
.mkly-document p {
  margin: 0 0 1em;
  line-height: 1.65;
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
  line-height: 1.6;
}
.mkly-document li:last-child { margin-bottom: 0; }

.mkly-document blockquote:not([class]) {
  margin: 0;
  padding: 0;
  font-style: italic;
}

.mkly-document hr {
  border: none;
  height: 1px;
  margin: calc(24px * var(--_gs)) 0;
}

.mkly-document code:not(pre code) {
  font-family: var(--mkly-font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace);
  font-size: 0.88em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.mkly-document pre {
  border-width: 1px;
  border-style: solid;
  border-radius: var(--mkly-radius, 8px);
  overflow-x: auto;
  margin: 0;
}

.mkly-document table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em;
}
.mkly-document th, .mkly-document td {
  padding: 10px 14px;
  text-align: left;
  border-bottom-width: 1px;
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
  margin: 0 0 calc(24px * var(--_gs));
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
  margin-bottom: calc(24px * var(--_gs));
  line-height: 1.65;
}

/* ── image block ── */
.mkly-core-image {
  margin: 0 0 calc(24px * var(--_gs));
  line-height: 0;
}
.mkly-core-image__img {
  width: 100%;
  border-radius: var(--mkly-radius, 8px);
  display: block;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* ── button block ── */
.mkly-core-button {
  margin: 0 0 calc(24px * var(--_gs));
}
.mkly-core-button__link {
  display: inline-block;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none !important;
  padding: 12px 28px;
  border-radius: var(--mkly-radius, 8px);
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* ── divider block ── */
.mkly-core-divider {
  margin: calc(24px * var(--_gs)) 0;
  border: none;
  height: 1px;
}

/* ── spacer block ── */
.mkly-core-spacer {
  line-height: 0;
  font-size: 0;
}

/* ── code block ── */
.mkly-core-code {
  margin: 0 0 calc(24px * var(--_gs));
  border-radius: var(--mkly-radius, 8px);
  padding: 16px 20px;
  border-width: 1px;
  border-style: solid;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.mkly-core-code pre {
  overflow-x: auto;
  font-family: var(--mkly-font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace);
  font-size: 13px;
  line-height: 1.6;
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
  margin: 0 0 calc(24px * var(--_gs));
  font-style: italic;
  padding: 22px 28px 22px 32px;
  border-left-width: 4px;
  border-left-style: solid;
  border-radius: 0 var(--mkly-radius, 8px) var(--mkly-radius, 8px) 0;
  line-height: 1.75;
  font-size: 1.05em;
}
.mkly-core-quote p { margin-bottom: 0.6em; }
.mkly-core-quote p:last-of-type { margin-bottom: 0; }
.mkly-core-quote__author {
  display: block;
  margin-top: 14px;
  padding-top: 12px;
  border-top-width: 1px;
  border-top-style: solid;
  font-size: 0.85em;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* ── hero block ── */
.mkly-core-hero {
  margin: 0 0 calc(24px * var(--_gs));
  position: relative;
  overflow: hidden;
  border-radius: var(--mkly-radius, 8px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.mkly-core-hero__img {
  border-radius: var(--mkly-radius, 8px);
  display: block;
  width: 100%;
}
.mkly-core-hero__content {
  padding: 28px 24px;
}
.mkly-core-hero__content h1 {
  font-size: 1.75em;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.mkly-core-hero__content h2 {
  font-size: 1.4em;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.3;
}
.mkly-core-hero__content p {
  margin: 0 0 0.75em;
  line-height: 1.6;
}

/* ── section block ── */
.mkly-core-section {
  margin: 0 0 calc(24px * var(--_gs));
  padding-top: calc(24px * var(--_gs));
  border-top-width: 1px;
  border-top-style: solid;
}
.mkly-core-section__title {
  font-family: var(--mkly-font-heading, inherit);
  font-size: 1.3em;
  font-weight: 700;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* ── card block ── */
.mkly-core-card {
  margin: 0 0 calc(16px * var(--_gs));
  border-radius: var(--mkly-radius, 8px);
  overflow: hidden;
  border-width: 1px;
  border-style: solid;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.mkly-core-card__img {
  width: 100%;
  display: block;
}
.mkly-core-card__body {
  padding: 20px;
}
.mkly-core-card__body h2 {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.3;
}
.mkly-core-card__body p {
  margin: 0 0 8px;
  font-size: 0.95em;
  line-height: 1.55;
}
.mkly-core-card__link {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.9em;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
}

/* ── list block ── */
.mkly-core-list {
  margin: 0 0 calc(24px * var(--_gs));
}
.mkly-core-list ul, .mkly-core-list ol {
  padding-left: 1.5em;
  margin: 0;
}
.mkly-core-list li {
  margin-bottom: 6px;
  line-height: 1.6;
}
.mkly-core-list li:last-child { margin-bottom: 0; }

/* ── header block ── */
.mkly-core-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: calc(24px * var(--_gs));
  padding-bottom: 20px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
}
.mkly-core-header__logo {
  height: 40px;
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
  margin-top: calc(24px * var(--_gs));
  text-align: center;
  font-size: 0.85em;
  padding-top: 20px;
  border-top-width: 1px;
  border-top-style: solid;
  line-height: 1.6;
}
.mkly-core-footer p {
  margin: 0 0 6px;
}
.mkly-core-footer a {
  font-weight: 500;
  text-decoration: underline;
}

/* ── cta block ── */
.mkly-core-cta {
  text-align: center;
  margin: 0 0 calc(24px * var(--_gs));
  padding: 32px 24px;
  border-radius: var(--mkly-radius, 8px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.mkly-core-cta p {
  margin: 0 0 8px;
  font-size: 1.05em;
  line-height: 1.6;
}
.mkly-core-cta__button {
  display: inline-block;
  margin-top: 16px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none !important;
  padding: 12px 28px;
  border-radius: var(--mkly-radius, 8px);
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}`,
    css: `core/heading
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/text
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/image
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/image.img
  borderRadius: 8px

core/button
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/button.link
  padding: 12px 28px
  borderRadius: 8px

core/divider
  marginTop: calc(24px * var(--mkly-gap-scale, 1))
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/code
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  borderRadius: 8px
  padding: 16px 20px

core/quote
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  padding: 22px 28px 22px 32px

core/hero
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  borderRadius: 8px

core/hero.img
  borderRadius: 8px

core/hero.content
  padding: 28px 24px

core/section
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  paddingTop: calc(24px * var(--mkly-gap-scale, 1))

core/section.title
  paddingBottom: 10px

core/card
  marginBottom: calc(16px * var(--mkly-gap-scale, 1))
  borderRadius: 8px
  overflow: hidden

core/card.body
  padding: 20px

core/list
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))

core/header
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  paddingBottom: 20px

core/footer
  marginTop: calc(24px * var(--mkly-gap-scale, 1))
  paddingTop: 20px

core/cta
  textAlign: center
  marginBottom: calc(24px * var(--mkly-gap-scale, 1))
  padding: 32px 24px
  borderRadius: 8px

core/cta.button
  padding: 12px 28px
  borderRadius: 8px
core/spacer
  lineHeight: 0
  fontSize: 0
`,
  },
];
