import type { BlockDefinition, MklyBlock, CompileContext, CompileError, ParseError } from './types';
import { escapeHtml } from './utils';
import type { BlockSchema } from './schemas';
import { validateBlock } from './schemas';

export interface RegistryOptions {
  schemas?: Map<string, BlockSchema>;
}

export class BlockRegistry {
  private definitions = new Map<string, BlockDefinition>();
  private schemas: Map<string, BlockSchema> | undefined;

  constructor(options?: RegistryOptions) {
    this.schemas = options?.schemas;
  }

  register(definition: BlockDefinition): this {
    this.definitions.set(definition.name, definition);
    return this;
  }

  get(name: string): BlockDefinition | undefined {
    return this.definitions.get(name);
  }

  has(name: string): boolean {
    return this.definitions.has(name);
  }

  compile(block: MklyBlock, ctx: CompileContext): string {
    const def = this.definitions.get(block.blockType);
    if (def) {
      // Warn if block has body content but its contentMode is 'properties' (content will be ignored)
      if (def.contentMode === 'properties' && block.content?.trim()) {
        ctx.errors.push({
          message: `"${block.blockType}" does not support body content — text below properties will be ignored`,
          blockType: block.blockType,
          line: block.position.start.line,
          severity: 'warning',
        });
      }
      // Warn if text-mode block has properties (they will be ignored by the renderer)
      if (def.contentMode === 'text' && Object.keys(block.properties).length > 0) {
        ctx.errors.push({
          message: `"${block.blockType}" is a text block — properties are not supported and will be ignored`,
          blockType: block.blockType,
          line: block.position.start.line,
          severity: 'warning',
        });
      }
      return def.compile(block, ctx);
    }
    ctx.errors.push({
      message: `Unknown block type "${block.blockType}"`,
      blockType: block.blockType,
      line: block.position.start.line,
      severity: 'warning',
    });
    const content = block.content ? escapeHtml(block.content) : '';
    return `<div data-block="${escapeHtml(block.blockType)}" class="mkly-unknown">${content}</div>`;
  }

  validate(block: MklyBlock): Array<ParseError | CompileError> {
    const errors: Array<ParseError | CompileError> = [];
    if (!this.definitions.has(block.blockType)) {
      errors.push({
        message: `Unknown block type: ${block.blockType}`,
        line: block.position.start.line,
        severity: 'warning',
      });
    }

    if (this.schemas) {
      const schemaErrors = validateBlock(block, this.schemas);
      errors.push(...schemaErrors);
    }

    return errors;
  }

  listTypes(): string[] {
    return Array.from(this.definitions.keys());
  }
}
