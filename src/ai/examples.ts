export interface AntiPattern {
  name: string;
  wrong: string;
  correct: string;
  explanation: string;
}

export const ANTI_PATTERNS: AntiPattern[] = [
  {
    name: 'properties-in-text-block',
    wrong: '--- newsletter/intro\ntitle: Welcome\n\nHello world',
    correct: '--- newsletter/intro\n\nHello world',
    explanation: 'intro has contentMode "text" — key:value lines become content, not properties.',
  },
  {
    name: 'missing-blank-line',
    wrong: '--- core/card\nimage: photo.jpg\n## Title',
    correct: '--- core/card\nimage: photo.jpg\n\n## Title',
    explanation: 'In mixed mode, content must be separated from properties by a blank line.',
  },
  {
    name: 'nesting-same-type',
    wrong: '--- core/section\ntitle: Outer\n\n--- core/section\ntitle: Inner\n\n--- /core/section\n\n--- /core/section',
    correct: '--- core/section\ntitle: Outer\n\n--- newsletter/category\ntitle: Inner\n\n--- /newsletter/category\n\n--- /core/section',
    explanation: 'Never nest same-type containers. Use different types for nesting levels.',
  },
  {
    name: 'unclosed-container',
    wrong: '--- core/section\ntitle: Features\n\n--- core/card\nContent\n\n--- core/text\nMore',
    correct: '--- core/section\ntitle: Features\n\n--- core/card\nContent\n\n--- /core/section\n\n--- core/text\nMore',
    explanation: 'Container blocks must be explicitly closed with --- /blockType.',
  },
  {
    name: 'raw-html-in-content',
    wrong: '--- core/text\n\n<b>Bold text</b> and <a href="url">link</a>',
    correct: '--- core/text\n\n**Bold text** and [link](url)',
    explanation: 'Use markdown for inline formatting. Raw HTML is escaped, not rendered.',
  },
  {
    name: 'properties-after-content',
    wrong: '--- core/card\n\n## Title\nimage: photo.jpg',
    correct: '--- core/card\nimage: photo.jpg\n\n## Title',
    explanation: 'Properties must come before content. After content starts, key:value lines are absorbed as content.',
  },
  {
    name: 'missing-required-property',
    wrong: '--- core/image\nalt: A photo',
    correct: '--- core/image\nsrc: https://example.com/photo.jpg\nalt: A photo',
    explanation: 'Image blocks require the "src" property.',
  },
  {
    name: 'wrong-block-for-purpose',
    wrong: '--- core/text\n\n- Item 1\n- Item 2\n- Item 3',
    correct: '--- newsletter/quickHits\n\n- Item 1\n- Item 2\n- Item 3',
    explanation: 'Use semantic block types. quickHits is for bullet lists in newsletters, list for general lists.',
  },
  {
    name: 'properties-mode-with-content',
    wrong: '--- core/divider\n\nSome text below the line',
    correct: '--- core/divider\n\n--- core/text\n\nSome text below the line',
    explanation: 'Divider has contentMode "properties" — it cannot have text content. Use a separate block.',
  },
  {
    name: 'label-on-non-container',
    wrong: '--- core/text: My Title\n\nParagraph content',
    correct: '--- core/heading\nlevel: 2\n\nMy Title\n\n--- core/text\n\nParagraph content',
    explanation: 'Labels after colons are primarily for containers (section, category). Use properties or content for other blocks.',
  },
  {
    name: 'raw-html-for-inline-styles',
    wrong: '--- core/text\n\n<span style="color:red">Red text</span>',
    correct: '--- core/text\n\n{@color:red}Red text{/}',
    explanation: 'Use {@prop:val}text{/} syntax for inline styling. Raw HTML is escaped in text blocks.',
  },
  {
    name: 'style-inline-comments',
    wrong: '--- style\nprimary: #4A3728 // Dark brown\naccent: #D4A574 // Golden tan',
    correct: '--- style\nprimary: #4A3728\naccent: #D4A574',
    explanation: 'Do NOT put // comments on the same line as values. They corrupt the value. Use // only on dedicated comment lines.',
  },
  {
    name: 'style-html-element-selector',
    wrong: '--- style\nbody\n  bg: #F7F3EB\n  fg: #333333',
    correct: '--- style\nbg: #F7F3EB\nfg: #333333',
    explanation: '"body", "div", "span" etc. are NOT mkly blocks. For document-level styles, use variables at indent 0 (no selector).',
  },
  {
    name: 'style-sass-functions',
    wrong: '--- style\ncore/card\n  :hover\n    bg: darken($accent, 10%)',
    correct: '--- style\ncore/card\n  :hover\n    bg: #c9945f',
    explanation: 'darken(), lighten(), mix() are Sass — not valid CSS. Use actual color values or CSS color-mix().',
  },
  {
    name: 'style-props-after-sub-element',
    wrong: '--- style\nnewsletter/featured\n  .source\n    fg: $accent\n  padding: 32px 0',
    correct: '--- style\nnewsletter/featured\n  padding: 32px 0\n  .source\n    fg: $accent',
    explanation: 'Put block-level properties BEFORE sub-elements. Properties after .sub go to the sub-element, not the block.',
  },
  {
    name: 'style-fighting-theme',
    wrong: '--- theme: newsletter/graphite\n\n--- style\nbg: #F7F3EB\nfg: #333333',
    correct: '--- theme: newsletter/cream\n\n--- style\nprimary: #4A3728',
    explanation: 'Pick a theme that matches your desired look. Don\'t override every color — that defeats the purpose of the theme.',
  },
];

export interface Example {
  name: string;
  description: string;
  source: string;
}

export const EXAMPLES: Example[] = [
  {
    name: 'minimal',
    description: 'Simplest valid document',
    source: `--- meta
version: 1
title: Hello

--- core/text

Hello world with **bold** and *italic* text.`,
  },
  {
    name: 'newsletter',
    description: 'Newsletter with sections and items',
    source: `--- use: newsletter

--- meta
version: 1
title: Weekly Digest

--- core/header
logo: https://example.com/logo.png
title: Weekly Digest

--- newsletter/intro

Welcome back! Here's what happened this week.

--- newsletter/category
title: Top Stories

--- newsletter/item
source: TechCrunch
link: https://example.com/story

New framework promises faster builds.

--- /newsletter/category

--- core/cta
url: https://example.com/subscribe
buttonText: Subscribe

Enjoyed this? Share with a friend.

--- core/footer

[Unsubscribe](https://example.com/unsub) | Built with mkly`,
  },
  {
    name: 'styled',
    description: 'Document with custom styling via --- style block',
    source: `--- use: core

--- meta
version: 1
title: Styled Page

--- style
accent: #3b82f6
fontHeading: Georgia, serif

core/heading
  letterSpacing: -0.5px
  color: $accent

core/card
  borderRadius: 12px
  .img
    objectFit: cover

--- core/heading
level: 1

Welcome

--- core/text

Content with custom styling applied.`,
  },
  {
    name: 'styled-blocks',
    description: 'Document with block-level and inline text styling',
    source: `--- meta
version: 1
title: Styled Blocks

--- style
accent: #e2725b

core/text
  background: #f5f5f5
  padding: 16px
  borderRadius: 12px

core/heading
  color: $accent

--- core/heading
level: 1

Welcome

--- core/text

This has {@color:#e2725b}colored text{/} and {@fontSize:18px @fontWeight:bold}big bold{/} words.`,
  },
];
