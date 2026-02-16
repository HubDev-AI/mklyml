import { z } from 'zod';
import type { ContentMode, CompileError, MklyBlock } from './types';

// ---------------------------------------------------------------------------
// Block schema definition
// ---------------------------------------------------------------------------

export interface BlockSchema {
  name: string;
  description: string;
  properties: z.ZodObject<z.ZodRawShape>;
  contentMode: ContentMode;
  isContainer?: boolean;
}

// ---------------------------------------------------------------------------
// Reusable refinements
// ---------------------------------------------------------------------------

const urlString = z.string().url().describe('URL');
const optionalUrl = z.string().url().optional().describe('Optional URL');
const optionalString = z.string().optional().describe('Optional text');

// ---------------------------------------------------------------------------
// Core block schemas (16)
// ---------------------------------------------------------------------------

const headingSchema: BlockSchema = {
  name: 'heading',
  description: 'Heading element (h1-h6)',
  properties: z.object({
    level: z.coerce.number().int().min(1).max(6).optional().describe('Heading level 1-6'),
    text: optionalString.describe('Heading text (alternative to content)'),
  }),
  contentMode: 'text',
};

const textSchema: BlockSchema = {
  name: 'text',
  description: 'Rich text paragraph with markdown support',
  properties: z.object({}),
  contentMode: 'text',
};

const imageSchema: BlockSchema = {
  name: 'image',
  description: 'Image with optional link wrapper',
  properties: z.object({
    src: urlString.describe('Image source URL (required)'),
    alt: optionalString.describe('Alt text for accessibility'),
    url: optionalUrl.describe('Link URL when image is clicked'),
    width: optionalString.describe('Image width (e.g. "100%", "400")'),
  }),
  contentMode: 'properties',
};

const buttonSchema: BlockSchema = {
  name: 'button',
  description: 'Call-to-action button with link',
  properties: z.object({
    url: optionalUrl.describe('Button link URL'),
    href: optionalUrl.describe('Alias for url'),
    label: optionalString.describe('Button text'),
  }),
  contentMode: 'mixed',
};

const dividerSchema: BlockSchema = {
  name: 'divider',
  description: 'Horizontal rule divider',
  properties: z.object({}),
  contentMode: 'properties',
};

const spacerSchema: BlockSchema = {
  name: 'spacer',
  description: 'Vertical spacing element',
  properties: z.object({
    height: z.string().regex(/^\d+(\.\d+)?(px|em|rem|%|vh)?$/i, 'height must be a number with optional unit').describe('Height (e.g. 40 or 40px)'),
  }),
  contentMode: 'properties',
};

const codeSchema: BlockSchema = {
  name: 'code',
  description: 'Code block with optional syntax highlighting',
  properties: z.object({
    lang: optionalString.describe('Programming language for highlighting'),
  }),
  contentMode: 'mixed',
};

const quoteSchema: BlockSchema = {
  name: 'quote',
  description: 'Blockquote with optional attribution',
  properties: z.object({
    author: optionalString.describe('Quote attribution'),
  }),
  contentMode: 'mixed',
};

const heroSchema: BlockSchema = {
  name: 'hero',
  description: 'Large hero section with image and overlay content',
  properties: z.object({
    image: optionalUrl.describe('Hero background image URL'),
    src: optionalUrl.describe('Alias for image'),
    alt: optionalString.describe('Image alt text for accessibility'),
  }),
  contentMode: 'mixed',
};

const sectionSchema: BlockSchema = {
  name: 'section',
  description: 'Container section that groups child blocks',
  properties: z.object({
    title: optionalString.describe('Section heading'),
  }),
  contentMode: 'mixed',
  isContainer: true,
};

const cardSchema: BlockSchema = {
  name: 'card',
  description: 'Content card with optional image and link',
  properties: z.object({
    image: optionalUrl.describe('Card image URL'),
    link: optionalUrl.describe('Card link URL'),
    url: optionalUrl.describe('Alias for link'),
  }),
  contentMode: 'mixed',
};

const listSchema: BlockSchema = {
  name: 'list',
  description: 'Ordered or unordered list (use markdown - or 1. syntax)',
  properties: z.object({}),
  contentMode: 'text',
};

const headerSchema: BlockSchema = {
  name: 'header',
  description: 'Document header with logo and title',
  properties: z.object({
    logo: optionalUrl.describe('Logo image URL'),
    title: optionalString.describe('Header title text'),
  }),
  contentMode: 'mixed',
};

const footerSchema: BlockSchema = {
  name: 'footer',
  description: 'Document footer with links and credits',
  properties: z.object({}),
  contentMode: 'mixed',
};

const ctaSchema: BlockSchema = {
  name: 'cta',
  description: 'Call-to-action section with button and supporting text',
  properties: z.object({
    url: optionalUrl.describe('CTA button link URL'),
    href: optionalUrl.describe('Alias for url'),
    buttonText: optionalString.describe('Button label text'),
    label: optionalString.describe('Alias for buttonText'),
  }),
  contentMode: 'mixed',
};

const htmlSchema: BlockSchema = {
  name: 'html',
  description: 'Raw HTML passthrough block — content is output verbatim',
  properties: z.object({
    prettify: z.enum(['true', 'false']).optional().describe('Add typography styles for readable text formatting'),
  }),
  contentMode: 'verbatim',
};

// ---------------------------------------------------------------------------
// Schema collections
// ---------------------------------------------------------------------------

export const CORE_SCHEMAS: BlockSchema[] = [
  headingSchema, textSchema, imageSchema, buttonSchema, dividerSchema,
  spacerSchema, codeSchema, quoteSchema, heroSchema, sectionSchema,
  cardSchema, listSchema, headerSchema, footerSchema, ctaSchema, htmlSchema,
];

export function createBlockSchemas(
  ...extras: BlockSchema[][]
): Map<string, BlockSchema> {
  const map = new Map<string, BlockSchema>();
  for (const schema of CORE_SCHEMAS) map.set(schema.name, schema);
  for (const group of extras) {
    for (const schema of group) map.set(schema.name, schema);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateBlock(
  block: MklyBlock,
  schemas: Map<string, BlockSchema>,
): CompileError[] {
  const errors: CompileError[] = [];
  // Try qualified name first, then fall back to bare name (e.g. 'newsletter/intro' → 'intro')
  const schema = schemas.get(block.blockType)
    ?? (block.blockType.includes('/') ? schemas.get(block.blockType.split('/').pop()!) : undefined);

  if (!schema) {
    errors.push({
      message: `Unknown block type: ${block.blockType}`,
      blockType: block.blockType,
      line: block.position.start.line,
      severity: 'warning',
    });
    return errors;
  }

  const result = schema.properties.safeParse(block.properties);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      errors.push({
        message: `${block.blockType}: ${path ? `"${path}" - ` : ''}${issue.message}`,
        blockType: block.blockType,
        line: block.position.start.line,
        property: path || undefined,
        severity: 'error',
      });
    }
  }

  return errors;
}

export type { BlockSchema as MklyBlockSchema };
