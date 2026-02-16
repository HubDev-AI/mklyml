import { parse } from './parser';
import type { MklyDocument, MklyBlock, BlockDefinition } from './types';
import type { MklyKit } from './kit';

// ---------------------------------------------------------------------------
// AST → mkly source serializer
// ---------------------------------------------------------------------------

function serializeBlock(block: MklyBlock, indent: number): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);
  const isContainer = block.children.length > 0;
  const labelSuffix = block.label ? `: ${block.label}` : '';

  lines.push(`${prefix}--- ${block.blockType}${labelSuffix}`);

  // Properties
  for (const [key, value] of Object.entries(block.properties)) {
    lines.push(`${prefix}${key}: ${value}`);
  }

  // Content body
  if (block.content) {
    lines.push('');
    for (const line of block.content.split('\n')) {
      lines.push(prefix + line);
    }
  }

  // Children
  for (const child of block.children) {
    lines.push('');
    lines.push(serializeBlock(child, indent));
  }

  // Closing tag for containers
  if (isContainer) {
    lines.push('');
    lines.push(`${prefix}--- /${block.blockType}`);
  }

  return lines.join('\n');
}

function serializeDocument(doc: MklyDocument): string {
  const sections: string[] = [];

  // Canonical order: uses → defines → themes → presets → meta → styles → blocks

  // Use declarations
  for (const use of doc.uses) {
    sections.push(`--- use: ${use}`);
  }

  // Inline theme definitions
  for (const theme of doc.inlineThemes) {
    const lines = [`--- define-theme: ${theme.name}`];
    if (theme.variables) {
      for (const [key, value] of Object.entries(theme.variables)) {
        lines.push(`${key}: ${value}`);
      }
    }
    if (theme.css) {
      if (theme.variables && Object.keys(theme.variables).length > 0) {
        lines.push('');
      }
      lines.push(theme.css);
    }
    sections.push(lines.join('\n'));
  }

  // Inline preset definitions
  for (const preset of doc.inlinePresets) {
    sections.push(`--- define-preset: ${preset.name}\n${preset.css}`);
  }

  // Theme declarations
  for (const theme of doc.themes) {
    sections.push(`--- theme: ${theme}`);
  }

  // Preset declarations
  for (const preset of doc.presets) {
    sections.push(`--- preset: ${preset}`);
  }

  // Meta block
  if (Object.keys(doc.meta).length > 0) {
    const metaLines = ['--- meta'];
    for (const [key, value] of Object.entries(doc.meta)) {
      metaLines.push(`${key}: ${value}`);
    }
    sections.push(metaLines.join('\n'));
  }

  // Style blocks
  for (const style of doc.styles) {
    sections.push(`--- style\n${style}`);
  }

  // Content blocks
  for (const block of doc.blocks) {
    sections.push(serializeBlock(block, 0));
  }

  return sections.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Block definition lookup
// ---------------------------------------------------------------------------

type BlockDefMap = Map<string, BlockDefinition>;

function buildBlockDefMap(kits: Record<string, MklyKit>): BlockDefMap {
  const map = new Map<string, BlockDefinition>();
  for (const kit of Object.values(kits)) {
    if (!kit.blocks) continue;
    for (const block of kit.blocks) {
      map.set(`${kit.name}/${block.name}`, block);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// stripContent — remove editorial content, keep structure
// ---------------------------------------------------------------------------

function stripBlock(block: MklyBlock, defs: BlockDefMap): MklyBlock {
  const def = defs.get(block.blockType);
  const hints = def?.contentHints;

  const stripped: MklyBlock = {
    ...block,
    properties: { ...block.properties },
    children: [],
  };

  if (hints) {
    // Remove content properties
    if (hints.contentProps) {
      for (const prop of hints.contentProps) {
        delete stripped.properties[prop];
      }
    }

    // Clear content body
    if (hints.contentBody) {
      stripped.content = '';
    }

    // Handle children: if contentChildren, remove all children
    if (hints.contentChildren) {
      stripped.children = [];
    } else {
      stripped.children = block.children.map(c => stripBlock(c, defs));
    }
  } else {
    // No hints — recurse into children but keep everything
    stripped.children = block.children.map(c => stripBlock(c, defs));
  }

  return stripped;
}

export function stripContent(source: string, kits: Record<string, MklyKit>): string {
  const doc = parse(source);
  const defs = buildBlockDefMap(kits);
  const strippedDoc: MklyDocument = {
    ...doc,
    blocks: doc.blocks.map(b => stripBlock(b, defs)),
  };
  return serializeDocument(strippedDoc);
}

// ---------------------------------------------------------------------------
// injectSampleContent — fill empty content slots with placeholder text
// ---------------------------------------------------------------------------

const SAMPLE_CONTENT: Record<string, {
  props?: Record<string, string>;
  body?: string;
  children?: Array<{ blockType: string; props?: Record<string, string>; body?: string }>;
}> = {
  'newsletter/intro': {
    body: "Welcome back! Here's your curated roundup of the latest news, tools, and insights from this week.",
  },
  'newsletter/featured': {
    props: {
      image: 'https://picsum.photos/seed/mkly-featured/600/300',
      source: 'Example Source',
      author: 'Jane Doe',
      link: 'https://example.com/featured-article',
    },
    body: 'A groundbreaking development is reshaping the industry. This in-depth report explores what it means for teams and the road ahead.',
  },
  'newsletter/item': {
    props: {
      source: 'Tech Weekly',
      link: 'https://example.com/article',
    },
    body: 'A brief summary of an interesting article or development worth reading this week.',
  },
  'newsletter/category': {
    children: [
      {
        blockType: 'newsletter/item',
        props: { source: 'Source A', link: 'https://example.com/1' },
        body: 'First sample item covering an interesting development in the field.',
      },
      {
        blockType: 'newsletter/item',
        props: { source: 'Source B', link: 'https://example.com/2' },
        body: 'Second sample item with a brief summary of another noteworthy story.',
      },
    ],
  },
  'newsletter/quickHits': {
    body: '- [Sample link one](https://example.com/1) — A quick highlight\n- [Sample link two](https://example.com/2) — Another brief note\n- [Sample link three](https://example.com/3) — One more quick hit',
  },
  'newsletter/tools': {
    children: [
      {
        blockType: 'newsletter/item',
        props: { source: 'Tool Review', link: 'https://example.com/tool' },
        body: 'A useful tool that helps streamline your workflow.',
      },
    ],
  },
  'newsletter/tipOfTheDay': {
    body: 'Here is a practical tip that can save you time and help you work more efficiently.',
  },
  'newsletter/community': {
    props: { author: 'Community Member' },
    body: 'This newsletter has been an incredible resource. The curated content saves me hours every week!',
  },
  'newsletter/personalNote': {
    body: "I've been reflecting on the trends we've seen this week, and there's a lot to be excited about in the months ahead.",
  },
  'newsletter/poll': {
    props: {
      question: 'What topic would you like to see more of?',
      option1: 'Deep dives',
      option2: 'Quick tips',
      option3: 'Tool reviews',
      option4: 'Industry news',
    },
  },
  'newsletter/recommendations': {
    body: '- [Recommended Resource](https://example.com/rec1) — Essential reading\n- [Another Great Find](https://example.com/rec2) — Worth your time',
  },
  'newsletter/sponsor': {
    props: {
      image: 'https://picsum.photos/seed/mkly-sponsor/400/200',
      link: 'https://example.com/sponsor',
      label: 'Learn more',
    },
    body: 'Build and deploy with **SampleProduct** — the fastest way to ship your next project.',
  },
  'newsletter/outro': {
    body: "Thanks for reading! If you enjoyed this issue, share it with a friend.",
  },
  'newsletter/custom': {
    body: 'A custom section with flexible content to highlight anything special.',
  },
  'core/text': {
    body: 'This is a sample paragraph demonstrating the layout and typography of this template.',
  },
  'core/heading': {
    body: 'Sample Heading',
  },
  'core/image': {
    props: { src: 'https://picsum.photos/seed/mkly-image/600/400' },
  },
  'core/button': {
    props: { url: 'https://example.com', label: 'Click Here' },
  },
  'core/quote': {
    props: { author: 'Notable Author' },
    body: 'A thoughtful quote that captures the essence of the content.',
  },
  'core/footer': {
    body: 'Copyright 2026. [Unsubscribe](https://example.com/unsub) | [View online](https://example.com/view)',
  },
  'core/cta': {
    props: { url: 'https://example.com/action' },
    body: 'Ready to get started? Take the next step today.',
  },
  'core/card': {
    props: {
      image: 'https://picsum.photos/seed/mkly-card/400/250',
      link: 'https://example.com/card',
    },
    body: 'A brief description of the card content with a link to learn more.',
  },
  'core/code': {
    body: 'const greeting = "Hello, world!";\nconsole.log(greeting);',
  },
  'core/list': {
    body: '- First item in the list\n- Second item in the list\n- Third item in the list',
  },
  'core/hero': {
    props: { image: 'https://picsum.photos/seed/mkly-hero/800/400' },
    body: '# Welcome\n\nDiscover what this template has to offer.',
  },
  'core/section': {
    children: [
      {
        blockType: 'core/text',
        body: 'Sample content inside this section to demonstrate the layout.',
      },
    ],
  },
};

function makeDummyBlock(blockType: string, props: Record<string, string>, body: string, children: MklyBlock[] = []): MklyBlock {
  return {
    blockType,
    properties: props,
    content: body,
    children,
    position: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
  };
}

function injectBlock(block: MklyBlock, defs: BlockDefMap): MklyBlock {
  const def = defs.get(block.blockType);
  const hints = def?.contentHints;
  if (!hints) {
    // No hints — recurse into children
    return {
      ...block,
      children: block.children.map(c => injectBlock(c, defs)),
    };
  }

  const sample = SAMPLE_CONTENT[block.blockType];
  const injected: MklyBlock = {
    ...block,
    properties: { ...block.properties },
    children: [...block.children],
  };

  // Inject content properties
  if (hints.contentProps && sample?.props) {
    for (const prop of hints.contentProps) {
      if (!injected.properties[prop] && sample.props[prop]) {
        injected.properties[prop] = sample.props[prop];
      }
    }
  }

  // Inject content body
  if (hints.contentBody && !injected.content && sample?.body) {
    injected.content = sample.body;
  }

  // Inject children for contentChildren containers
  if (hints.contentChildren && injected.children.length === 0 && sample?.children) {
    injected.children = sample.children.map(c =>
      makeDummyBlock(
        c.blockType,
        c.props ?? {},
        c.body ?? '',
      ),
    );
  }

  // Recurse into existing children
  injected.children = injected.children.map(c => injectBlock(c, defs));

  return injected;
}

export function injectSampleContent(source: string, kits: Record<string, MklyKit>): string {
  const doc = parse(source);
  const defs = buildBlockDefMap(kits);
  const injectedDoc: MklyDocument = {
    ...doc,
    blocks: doc.blocks.map(b => injectBlock(b, defs)),
  };
  return serializeDocument(injectedDoc);
}

// Re-export the serializer for testing
export { serializeDocument as _serializeDocument };
