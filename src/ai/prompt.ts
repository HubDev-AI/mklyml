import type { BlockSchema } from '../schemas';
import type { BlockDocs } from '../types';
import { CORE_SCHEMAS } from '../schemas';
import { MKLY_DEFAULT_VERSION, getAvailableFeatures } from '../version';
import { ANTI_PATTERNS } from './examples';
import { EXAMPLES } from './examples';
import type { MklyKit } from '../kit';
import { CORE_KIT } from '../blocks';
import { STYLE_VARIABLES } from '../style-parser';

export interface PromptOptions {
  version?: number;
  kits?: string[];
  includeExamples?: boolean;
  includeAntiPatterns?: boolean;
  includeSchema?: boolean;
  maxBlocks?: number;
  extraSchemas?: BlockSchema[];
}

function contentModeRules(): string {
  return `CONTENT MODES (critical — choose the right one):
- "text": ONLY markdown content. No properties. Key:value lines become content text, NOT key-value pairs.
- "properties": ONLY key-value properties. No markdown body.
- "mixed": Properties first, then blank line, then markdown content. The blank line is REQUIRED.`;
}

function formatBlockSchema(schema: BlockSchema): string {
  const props = Object.entries(schema.properties.shape);
  const container = schema.isContainer ? ' [container]' : '';
  const propList = props.length > 0
    ? props.map(([key, zodType]) => {
        const desc = (zodType as { description?: string }).description ?? '';
        return `  ${key}: ${desc}`;
      }).join('\n')
    : '  (no properties)';
  return `--- ${schema.name} (${schema.contentMode}${container}): ${schema.description}\n${propList}`;
}

function getSchemas(options?: PromptOptions): BlockSchema[] {
  const schemas = [...CORE_SCHEMAS];
  if (options?.extraSchemas) {
    schemas.push(...options.extraSchemas);
  }
  return schemas;
}

export function buildMklySystemPrompt(options?: PromptOptions): string {
  const version = options?.version ?? MKLY_DEFAULT_VERSION;
  const includeExamples = options?.includeExamples ?? true;
  const includeAntiPatterns = options?.includeAntiPatterns ?? true;
  const includeSchema = options?.includeSchema ?? true;

  const sections: string[] = [];

  sections.push(`You generate mkly markup (version ${version}). mkly is a block-based language that compiles to HTML.`);
  sections.push(`Features: ${getAvailableFeatures(version).join(', ')}`);

  sections.push(`SYNTAX:
- Blocks start with --- kit/blockType (e.g. --- core/heading, --- newsletter/intro)
- Labels: --- use: kitName, --- theme: themeName (colon labels are for use/theme only)
- Titled blocks: use the title: property (e.g. --- core/section\\ntitle: Featured)
- Properties: key: value (right after block start)
- Content: markdown text (after blank line in mixed mode)
- Containers: close with --- /kit/blockType (e.g. --- /core/section)
- Comments: // ignored
- Meta: --- meta (version, title, subject)
- Style: --- style (mkly CSS v2)
- Use: --- use: kitName
- Theme: --- theme: themeName (select a predefined theme from a kit)`);

  sections.push(`STYLING:
- Block-level: use a --- style block (mkly CSS v2 indented syntax). All block styling goes here.
  Variables: name: value at top level (e.g. accent: #e2725b → --mkly-accent)
  Block selectors: bare word at top level (e.g. core/text, heading)
  CSS properties: indented under selector (e.g. padding: 16px)
  Sub-elements: .sub indented under block (e.g. .img under core/card)
  Pseudo-classes: :pseudo indented under block (e.g. :hover)
  Variable refs: $name resolves to var(--mkly-name) (e.g. color: $accent)
  Aliases: bg → background, fg → color, rounded → border-radius
- Inline text: {@prop:val}styled text{/} (wraps text in <span style="...">)
- Multiple inline props: {@color:red @fontSize:18px @fontWeight:bold}text{/}
- Compiles to: <span style="color:red;font-size:18px;font-weight:bold">text</span>
- Do NOT use @property: value on blocks — that syntax is removed. Use --- style blocks instead.`);

  sections.push(contentModeRules());

  if (includeSchema) {
    const schemas = getSchemas(options);
    sections.push('AVAILABLE BLOCKS:\n' + schemas.map(formatBlockSchema).join('\n\n'));
  }

  if (options?.maxBlocks) {
    sections.push(`LIMIT: Maximum ${options.maxBlocks} blocks per document.`);
  }

  if (includeAntiPatterns) {
    const patterns = ANTI_PATTERNS.map(p =>
      `WRONG:\n${p.wrong}\nRIGHT:\n${p.correct}\nWHY: ${p.explanation}`
    ).join('\n\n');
    sections.push(`COMMON MISTAKES — AVOID THESE:\n${patterns}`);
  }

  if (includeExamples) {
    const minimal = EXAMPLES.find(e => e.name === 'minimal');
    if (minimal) {
      sections.push(`EXAMPLE:\n\`\`\`mkly\n${minimal.source}\n\`\`\``);
    }
  }

  return sections.join('\n\n');
}

export function buildKitAuthoringGuide(): string {
  return `KIT AUTHORING GUIDE

A kit bundles blocks, schemas, styles, and lifecycle hooks.

\`\`\`typescript
import { defineKit, defineBlock } from '@mklyml/core';
import { z } from 'zod';

const myKit = defineKit({
  name: 'my-kit',
  description: 'Custom blocks for my project',
  blocks: [
    defineBlock({
      name: 'banner',
      contentMode: 'mixed',
      compile: (block, ctx) => {
        const title = block.properties.title ?? '';
        return \`<div class="mkly-banner"><h2>\${title}</h2>\${block.content}</div>\`;
      },
    }),
  ],
  schemas: [{
    name: 'banner',
    description: 'Banner with title and content',
    properties: z.object({
      title: z.string().optional().describe('Banner heading'),
    }),
    contentMode: 'mixed',
  }],
  styles: '.mkly-banner { padding: 24px; background: #f0f0f0; }',
  transform: (doc) => doc, // optional pre-compile transform
  afterCompile: (result, ctx) => result, // optional post-compile hook
});

// Usage: --- use: my-kit activates the kit
mkly(source, { kits: { 'my-kit': myKit } });
\`\`\`

Key rules:
- Block types are namespaced: kit/blockName (e.g. core/heading, newsletter/intro)
- contentMode determines how the parser treats the block's body
- compile() receives the parsed block and must return an HTML string
- Container blocks must include {{children}} in their output
- Schemas enable validation and editor autocomplete`;
}

export function buildPluginAuthoringGuide(): string {
  return `PLUGIN AUTHORING GUIDE

Plugins modify rendering behavior without adding new block types.

\`\`\`typescript
import { definePlugin } from '@mklyml/core';

const myPlugin = definePlugin({
  name: 'my-plugin',
  renderers: {
    // Override how specific blocks render
    text: (block, ctx) => \`<custom-text>\${block.content}</custom-text>\`,
  },
  // Transform document before compilation
  transform: (doc) => doc,
  // Wrap final output (replace the default web wrapper)
  wrapOutput: (content, meta, ctx, maxWidth) => {
    return \`<div class="custom-wrapper">\${content}</div>\`;
  },
  // Post-process compilation result
  afterCompile: (result, ctx) => result,
});

mkly(source, { plugins: [myPlugin] });
\`\`\`

Key rules:
- Plugin renderers override kit/core renderers for specific block types
- wrapOutput replaces the default HTML wrapper entirely
- The email plugin (@mklyml/core-email) is a built-in plugin reference
- Multiple plugins compose — renderers from later plugins win`;
}

// ---------------------------------------------------------------------------
// Block docs → markdown (for AI prompts)
// ---------------------------------------------------------------------------

export interface BlockDocsMarkdownOptions {
  /** Kits to include (in addition to core). Pass specific kits to filter. */
  kits?: MklyKit[];
  /** Only emit docs for these kit names (e.g. ['newsletter']). Omit to include all. */
  only?: string[];
  /** Skip core kit blocks. */
  skipCore?: boolean;
  /** Include mkly usage example per block. Default true. */
  includeExamples?: boolean;
  /** Include HTML preview per block. Default false. */
  includeHtmlPreview?: boolean;
}

function formatBlockDoc(
  blockType: string,
  schema: BlockSchema | undefined,
  docs: BlockDocs | undefined,
  includeExamples: boolean,
  includeHtmlPreview: boolean,
): string {
  const parts: string[] = [];
  const container = schema?.isContainer ? ' (container)' : '';
  const mode = schema ? ` — ${schema.contentMode} mode` : '';

  parts.push(`### \`--- ${blockType}\`${container}${mode}`);

  if (docs) {
    parts.push(docs.summary);
  } else if (schema) {
    parts.push(schema.description);
  }

  // Schema properties (from Zod)
  if (schema) {
    const props = Object.entries(schema.properties.shape);
    if (props.length > 0) {
      parts.push('\n**Properties:**');
      for (const [key, zodType] of props) {
        const desc = (zodType as { description?: string }).description ?? '';
        parts.push(`- \`${key}\`: ${desc}`);
      }
    }
  }

  // Detailed property docs
  if (docs?.properties && docs.properties.length > 0) {
    const hasSchemaProps = schema && Object.keys(schema.properties.shape).length > 0;
    if (!hasSchemaProps) {
      parts.push('\n**Properties:**');
    }
    for (const p of docs.properties) {
      const req = p.required ? ' *(required)*' : '';
      const ex = p.example ? ` — e.g. \`${p.example}\`` : '';
      parts.push(`- \`${p.name}\`${req}: ${p.description}${ex}`);
    }
  }

  if (docs && includeExamples) {
    parts.push(`\n**Example:**\n\`\`\`mkly\n${docs.usage}\n\`\`\``);
  }

  if (docs && includeHtmlPreview) {
    parts.push(`\n**Output:**\n\`\`\`html\n${docs.htmlPreview}\n\`\`\``);
  }

  if (docs?.tips && docs.tips.length > 0) {
    parts.push('\n**Tips:**');
    for (const tip of docs.tips) {
      parts.push(`- ${tip}`);
    }
  }

  return parts.join('\n');
}

export function buildBlockDocsMarkdown(options?: BlockDocsMarkdownOptions): string {
  const extraKits = options?.kits ?? [];
  const only = options?.only ? new Set(options.only) : null;
  const skipCore = options?.skipCore ?? false;
  const includeExamples = options?.includeExamples ?? true;
  const includeHtmlPreview = options?.includeHtmlPreview ?? false;

  const allKits = skipCore ? extraKits : [CORE_KIT, ...extraKits];
  const sections: string[] = [];

  for (const kit of allKits) {
    if (only && !only.has(kit.name)) continue;

    const schemas = kit.schemas ?? [];
    const docsMap = kit.docs ?? {};
    const blockEntries: string[] = [];

    // Blocks with schemas
    for (const schema of schemas) {
      const docs = docsMap[schema.name];
      blockEntries.push(formatBlockDoc(schema.name, schema, docs, includeExamples, includeHtmlPreview));
    }

    // Blocks with docs but no schema (docs-only entries)
    for (const [blockType, docs] of Object.entries(docsMap)) {
      if (!schemas.some(s => s.name === blockType)) {
        blockEntries.push(formatBlockDoc(blockType, undefined, docs, includeExamples, includeHtmlPreview));
      }
    }

    if (blockEntries.length > 0) {
      sections.push(`## ${kit.name} kit\n\n${blockEntries.join('\n\n')}`);
    }
  }

  if (sections.length === 0) return '';
  return `# Block Reference\n\n${sections.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Full reference (existing — includes syntax, style blocks, themes, etc.)
// ---------------------------------------------------------------------------

export interface BlockReferenceOptions {
  kits?: MklyKit[];
  includeConversionGuide?: boolean;
  includeInlineStyles?: boolean;
  includeExamples?: boolean;
  compact?: boolean;
}

export function buildBlockReference(options?: BlockReferenceOptions): string {
  const kits = options?.kits ?? [];
  const allKits = [CORE_KIT, ...kits];
  const includeConversion = options?.includeConversionGuide ?? false;
  const includeInline = options?.includeInlineStyles ?? true;
  const includeExamples = options?.includeExamples ?? true;
  const compact = options?.compact ?? false;

  const sections: string[] = [];

  sections.push(`# mkly Markup Language Reference

## Syntax
- Blocks start with \`--- kit/blockType\` (e.g. \`--- core/heading\`, \`--- newsletter/intro\`)
- Labels: \`--- use: kitName\`, \`--- theme: themeName\` (colon labels are for use/theme only)
- Titled blocks: use the \`title:\` property (e.g. \`--- core/section\\ntitle: Featured\`)
- Properties: \`key: value\` (immediately after block start)
- Content: markdown text (after blank line in mixed mode)
- Containers: close with \`--- /kit/blockType\` (e.g. \`--- /core/section\`)
- Comments: \`// ignored\`
- Meta: \`--- meta\` (version, title, subject)
- Style: \`--- style\` (mkly CSS v2 — variables, block selectors, sub-elements)
- Use: \`--- use: kitName\`
- Theme: \`--- theme: themeName\` (select a predefined theme)`);

  sections.push(contentModeRules());

  if (includeInline) {
    sections.push(`## Styling

### Block-level styles (--- style block)
All block-level styles go in a \`--- style\` block using mkly v2 indented syntax:
\`\`\`mkly
--- style
accent: #e2725b
fontHeading: Georgia, serif

core/heading
  background: #f0f0f0
  padding: 16px
  borderRadius: 8px
  color: $accent

core/card
  .img
    objectFit: cover
  :hover
    transform: translateY(-2px)
\`\`\`

- Top-level \`name: value\` = CSS variables (e.g. accent → --mkly-accent)
- Top-level bare words = block type selectors (e.g. core/heading)
- Indented \`property: value\` = CSS properties for that block
- \`.sub\` = sub-element targets (e.g. .img under core/card)
- \`:pseudo\` = pseudo-class targets (e.g. :hover)
- \`$variable\` refs = var(--mkly-variable) (e.g. color: $accent)
- Aliases: bg → background, fg → color, rounded → border-radius

### Inline text styles
Style specific text within content:
\`\`\`
{@color:red}red text{/}
{@fontSize:18px @fontWeight:bold}big bold text{/}
\`\`\`
Compiles to: \`<span style="color:red">red text</span>\`

Note: Do NOT use \`@property: value\` on blocks — that syntax is removed. Use \`--- style\` blocks for block-level styling.`);
  }

  const blockSections: string[] = [];

  for (const kit of allKits) {
    const kitLabel = kit.name === 'core' ? '' : ` (${kit.name} kit)`;
    const schemas = kit.schemas ?? [];

    for (const schema of schemas) {
      const docs = kit.docs?.[schema.name];
      const container = schema.isContainer ? ' [container]' : '';

      const parts: string[] = [];
      parts.push(`### --- ${schema.name}${kitLabel}`);
      parts.push(`${schema.description} | Mode: ${schema.contentMode}${container}`);

      if (docs && !compact) {
        parts.push(`\n${docs.summary}`);
      }

      const props = Object.entries(schema.properties.shape);
      if (props.length > 0) {
        parts.push('\nProperties:');
        for (const [key, zodType] of props) {
          const desc = (zodType as { description?: string }).description ?? '';
          parts.push(`  ${key}: ${desc}`);
        }
      }

      if (docs && includeExamples) {
        parts.push(`\nExample:\n\`\`\`mkly\n${docs.usage}\n\`\`\``);

        if (!compact) {
          parts.push(`\nOutput:\n\`\`\`html\n${docs.htmlPreview}\n\`\`\``);
        }
      }

      if (docs?.properties && docs.properties.length > 0 && !compact) {
        parts.push('\nDetailed properties:');
        for (const p of docs.properties) {
          const req = p.required ? ' (required)' : '';
          const ex = p.example ? ` — e.g. "${p.example}"` : '';
          parts.push(`  ${p.name}${req}: ${p.description}${ex}`);
        }
      }

      if (docs?.tips && docs.tips.length > 0 && !compact) {
        parts.push('\nTips:');
        for (const tip of docs.tips) {
          parts.push(`  - ${tip}`);
        }
      }

      blockSections.push(parts.join('\n'));
    }
  }

  // Theme reference
  const themeSections: string[] = [];
  for (const kit of allKits) {
    if (kit.themes && kit.themes.length > 0) {
      const kitLabel = kit.name === 'core' ? 'core' : kit.name;
      for (const theme of kit.themes) {
        const desc = theme.description ?? '';
        const vars = theme.variables
          ? Object.entries(theme.variables).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ')
          : '';
        themeSections.push(`- \`--- theme: ${kitLabel}/${theme.name}\` — ${desc}${vars ? ` (${vars}, ...)` : ''}`);
      }
    }
  }
  if (themeSections.length > 0) {
    sections.push(`## Themes\n\nSelect a predefined theme with \`--- theme: name\` or \`--- theme: kit/name\`.\n\n${themeSections.join('\n')}`);
  }

  sections.push(`## Available Blocks\n\n${blockSections.join('\n\n')}`);

  if (includeConversion) {
    sections.push(`## HTML Conversion

### htmlToMkly(html, options?)
Converts HTML back to mkly source. Detects origin:
- \`mkly-web\`: HTML generated by mkly web output (has mkly-* classes)
- \`mkly-email\`: HTML from mkly email plugin (table-based)
- \`generic\`: Any other HTML

Semantic mapping: h1-h6 → core/heading, p → core/text, img → core/image, blockquote → core/quote, etc.
Pattern recognition: cards, CTAs, heroes detected by structure.
Fallback: unrecognized elements → \`--- html\` verbatim blocks.

### importHtml(html, options?)
Smart import for external HTML (e.g., Mailchimp newsletters):
1. Strips boilerplate (scripts, tracking pixels, wrappers)
2. Unwraps table layouts (email HTML uses tables for layout)
3. Pattern matching (hero, header, card, CTA, footer detection)
4. Fallback to \`--- core/html\` blocks for unrecognized content`);
  }

  if (!compact) {
    const varList = STYLE_VARIABLES.slice(0, 10).map(v => `  ${v.name}: ${v.description}`).join('\n');
    sections.push(`## Style System

All block-level styles are defined in a single \`--- style\` block using mkly v2 indented syntax.
Do NOT use \`@property: value\` on blocks — that syntax is removed.

### Style Variables
Top-level \`name: value\` entries become CSS custom properties:
\`\`\`mkly
--- style
accent: #e2725b
fontBody: -apple-system, sans-serif
fontHeading: Georgia, serif
radius: 8px
spacing: 24px
\`\`\`

Available variables:
${varList}

### Block-Level Styles
Top-level bare words are block type selectors. Indented properties are CSS for that block:
\`\`\`mkly
--- style
core/heading
  letterSpacing: -0.5px
  color: $accent

core/text
  background: #f5f5f5
  padding: 16px
\`\`\`

### Sub-Element & Pseudo-Class Targeting
Use \`.sub\` for sub-elements and \`:pseudo\` for pseudo-classes, indented under a block selector:
\`\`\`mkly
--- style
core/card
  borderRadius: 12px
  .img
    objectFit: cover
  :hover
    transform: translateY(-2px)
\`\`\`

### Variable References
Use \`$name\` to reference style variables: \`color: $accent\` → \`color: var(--mkly-accent)\`

### Aliases
bg → background, fg → color, rounded → border-radius`);
  }

  return sections.join('\n\n');
}
