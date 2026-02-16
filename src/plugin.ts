import type { MklyBlock, MklyDocument, CompileContext, CompileResult } from './types';

type BlockCompileFn = (block: MklyBlock, ctx: CompileContext) => string;

export interface MklyPlugin {
  name: string;
  renderers?: Record<string, BlockCompileFn>;
  transform?: (doc: MklyDocument) => MklyDocument;
  afterCompile?: (result: CompileResult, ctx: CompileContext) => CompileResult;
  wrapOutput?: (content: string, meta: Record<string, string>, ctx: CompileContext, maxWidth: number, uses?: string[]) => string;
}

export function definePlugin(plugin: MklyPlugin): MklyPlugin {
  return plugin;
}

export function applyPlugins(plugins: MklyPlugin[]): {
  renderers: Map<string, BlockCompileFn>;
  transforms: Array<(doc: MklyDocument) => MklyDocument>;
  afterCompile: Array<(result: CompileResult, ctx: CompileContext) => CompileResult>;
  wrapOutput?: (content: string, meta: Record<string, string>, ctx: CompileContext, maxWidth: number, uses?: string[]) => string;
} {
  const renderers = new Map<string, BlockCompileFn>();
  const transforms: Array<(doc: MklyDocument) => MklyDocument> = [];
  const afterCompile: Array<(result: CompileResult, ctx: CompileContext) => CompileResult> = [];
  let wrapOutput: MklyPlugin['wrapOutput'];

  for (const plugin of plugins) {
    if (plugin.renderers) {
      for (const [name, fn] of Object.entries(plugin.renderers)) {
        renderers.set(name, fn);
      }
    }
    if (plugin.transform) transforms.push(plugin.transform);
    if (plugin.afterCompile) afterCompile.push(plugin.afterCompile);
    if (plugin.wrapOutput) wrapOutput = plugin.wrapOutput;
  }

  return { renderers, transforms, afterCompile, wrapOutput };
}
