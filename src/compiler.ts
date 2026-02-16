import type { MklyDocument, MklyBlock, CompileOptions, CompileContext, CompileResult, MklyTheme, MklyPreset, SourceMapEntry } from './types';
import type { MklyKit } from './kit';
import type { MklyPlugin } from './plugin';
import { BlockRegistry } from './registry';
import { applyKits } from './kit';
import { applyPlugins } from './plugin';
import { parseMklyStyle, themeToCSS } from './style-parser';
import { DEFAULT_STYLES } from './styles';
import { parseStyleGraph, compileLayeredCSS, mergeStyleGraphs, emptyStyleGraph } from './style-graph';
import type { StyleGraph } from './style-graph';

export interface CompileWithKitsOptions extends CompileOptions {
  kits?: Record<string, MklyKit>;
  plugins?: MklyPlugin[];
  theme?: Record<string, string>;
}

export function compile(
  doc: MklyDocument,
  registry: BlockRegistry,
  options?: CompileWithKitsOptions,
): CompileResult {
  const maxWidth = options?.maxWidth ?? 600;
  const availableKits = options?.kits ?? {};
  const plugins = options?.plugins ?? [];

  // Resolve --- use declarations against available kits
  const resolvedKits: MklyKit[] = [];
  for (const kitName of doc.uses) {
    const kit = availableKits[kitName];
    if (kit) {
      resolvedKits.push(kit);
    } else {
      doc.errors.push({
        message: `Unknown kit "${kitName}" — not available. Available kits: ${Object.keys(availableKits).join(', ') || 'none'}`,
        line: 1,
        severity: 'error',
      });
    }
  }

  // Bail if version is missing or invalid (mandatory field)
  const hasVersionError = doc.errors.some(e =>
    e.severity === 'error' && (e.message.includes('Missing required "version"') || e.message.includes('Invalid version')),
  );
  if (hasVersionError) {
    return { html: '', errors: doc.errors };
  }

  // Derive version from the core kit (the kit named 'core')
  const coreKit = resolvedKits.find(k => k.name === 'core');
  const supportedVersions = coreKit?.versions?.supported ?? [1];
  const currentVersion = coreKit?.versions?.current ?? 1;

  // Validate document version against core kit's supported versions
  if (doc.version !== currentVersion && !supportedVersions.includes(doc.version)) {
    return {
      html: '',
      errors: [...doc.errors, {
        message: `Unsupported version: ${doc.version}. Supported: ${supportedVersions.join(', ')}`,
        blockType: '',
        line: 1,
        severity: 'error' as const,
        property: undefined,
      }],
    };
  }

  // Apply kits with version gating — blocks with since > docVersion are filtered out
  const { styles, keyframes, transforms: kitTransforms, afterCompile: kitAfterCompile, themes: allThemes, defaultThemes, presets: allPresets, defaultPresets } = applyKits(registry, resolvedKits, doc.version);
  const {
    renderers: pluginRenderers,
    transforms: pluginTransforms,
    afterCompile: pluginAfterCompile,
    wrapOutput,
  } = applyPlugins(plugins);

  // Register inline theme/preset definitions (from --- define-theme / --- define-preset blocks)
  for (const inlineTheme of doc.inlineThemes) {
    allThemes.set(`inline/${inlineTheme.name}`, inlineTheme);
  }
  for (const inlinePreset of doc.inlinePresets) {
    allPresets.set(`inline/${inlinePreset.name}`, inlinePreset);
  }

  // Resolve themes: only use explicitly declared doc.themes (no fallback to kit defaults)
  const themeNames = doc.themes;
  const resolvedThemes: MklyTheme[] = [];
  for (const name of themeNames) {
    if (name.includes('/')) {
      // Fully-qualified name: exact lookup
      const theme = allThemes.get(name);
      if (theme) {
        resolvedThemes.push(theme);
      } else {
        doc.errors.push({ message: `Unknown theme "${name}" — not found in any kit`, line: 1, severity: 'warning' });
      }
    } else {
      // Shorthand: resolve from every kit that has this theme name
      let found = false;
      for (const kit of resolvedKits) {
        const qualified = `${kit.name}/${name}`;
        const theme = allThemes.get(qualified);
        if (theme) {
          resolvedThemes.push(theme);
          found = true;
        }
      }
      // Fallback: check inline themes by name
      if (!found) {
        const inlineTheme = allThemes.get(`inline/${name}`);
        if (inlineTheme) {
          resolvedThemes.push(inlineTheme);
          found = true;
        }
      }
      if (!found) {
        doc.errors.push({ message: `Unknown theme "${name}" — not found in any kit or inline definition`, line: 1, severity: 'warning' });
      }
    }
  }

  // Resolve presets: only use explicitly declared doc.presets (no fallback to kit defaults)
  const presetNames = doc.presets;
  const resolvedPresets: MklyPreset[] = [];
  for (const name of presetNames) {
    if (name.includes('/')) {
      const preset = allPresets.get(name);
      if (preset) {
        resolvedPresets.push(preset);
      } else {
        doc.errors.push({ message: `Unknown preset "${name}" — not found in any kit`, line: 1, severity: 'warning' });
      }
    } else {
      let found = false;
      for (const kit of resolvedKits) {
        const qualified = `${kit.name}/${name}`;
        const preset = allPresets.get(qualified);
        if (preset) {
          resolvedPresets.push(preset);
          found = true;
        }
      }
      // Fallback: check inline presets by name
      if (!found) {
        const inlinePreset = allPresets.get(`inline/${name}`);
        if (inlinePreset) {
          resolvedPresets.push(inlinePreset);
          found = true;
        }
      }
      if (!found) {
        doc.errors.push({ message: `Unknown preset "${name}" — not found in any kit or inline definition`, line: 1, severity: 'warning' });
      }
    }
  }

  let transformedDoc = doc;
  for (const transform of [...kitTransforms, ...pluginTransforms]) {
    transformedDoc = transform(transformedDoc);
  }

  // Build StyleGraph from document --- style blocks (before block compilation so plugins can access it)
  const styleGraphs: StyleGraph[] = [];
  for (const styleSource of transformedDoc.styles) {
    const graph = parseStyleGraph(styleSource);
    if (graph.warnings) {
      for (const w of graph.warnings) {
        doc.errors.push({ message: `Style: ${w.message}`, severity: w.severity, line: 0 });
      }
    }
    styleGraphs.push(graph);
  }
  const styleGraph = styleGraphs.length > 0
    ? mergeStyleGraphs(...styleGraphs)
    : emptyStyleGraph();

  // Build ctx.variables: API options < theme variables < StyleGraph variables
  const mergedVariables: Record<string, string> = {};
  for (const theme of resolvedThemes) {
    if (theme.variables) {
      Object.assign(mergedVariables, theme.variables);
    }
  }
  for (const sv of styleGraph.variables) {
    mergedVariables[sv.name] = sv.value;
  }
  // API-level variables have highest priority
  Object.assign(mergedVariables, options?.variables ?? {});

  const ctx: CompileContext = {
    variables: mergedVariables,
    errors: [],
    extraStyles: new Set(),
    styleGraph,
  };

  const sourceMap = options?.sourceMap ?? false;
  const entries: SourceMapEntry[] = [];
  let htmlOffset = 0;

  // Sort comments by line for interleaving with blocks
  const comments = [...transformedDoc.comments].sort((a, b) => a.line - b.line);
  let commentIdx = 0;

  const htmlParts: string[] = [];
  for (const block of transformedDoc.blocks) {
    // Emit any comments that appear before this block
    while (commentIdx < comments.length && comments[commentIdx].line < block.position.start.line) {
      const c = comments[commentIdx];
      const commentHtml = `<!-- mkly-c: ${c.content.replace(/--/g, '—')} -->`;
      htmlParts.push(commentHtml);
      htmlOffset += commentHtml.length + 1;
      commentIdx++;
    }
    const html = compileBlock(block, registry, pluginRenderers, ctx, sourceMap, 0);
    if (sourceMap) {
      entries.push({
        sourceLine: block.position.start.line,
        sourceEndLine: block.position.end.line,
        blockType: block.blockType,
        htmlOffset,
        htmlLength: html.length,
        children: [],
      });
    }
    htmlParts.push(html);
    htmlOffset += html.length + 1;
  }
  // Emit any remaining comments after the last block
  while (commentIdx < comments.length) {
    htmlParts.push(`<!-- mkly-c: ${comments[commentIdx].content.replace(/--/g, '—')} -->`);
    commentIdx++;
  }
  const blocksHtml = htmlParts.join('\n');

  // Build theme CSS
  const themeCSS: string[] = [];
  for (const theme of resolvedThemes) {
    if (theme.variables) {
      const themeCss = themeToCSS(theme.variables);
      if (themeCss) themeCSS.push(themeCss);
    }
    if (theme.rawCss) {
      themeCSS.push(theme.rawCss);
    }
    if (theme.css) {
      const parsed = parseMklyStyle(theme.css);
      if (parsed.css) themeCSS.push(parsed.css);
    }
  }

  // Build preset CSS
  const presetCSS: string[] = [];
  for (const preset of resolvedPresets) {
    if (preset.rawCss) {
      presetCSS.push(preset.rawCss);
    }
    if (preset.css) {
      const parsed = parseMklyStyle(preset.css);
      if (parsed.css) presetCSS.push(parsed.css);
    }
    if (preset.keyframes) {
      const kfCss = Object.entries(preset.keyframes)
        .map(([name, body]) => `@keyframes ${name}{${body}}`)
        .join('\n');
      if (kfCss) presetCSS.push(kfCss);
    }
  }

  // API-level theme override
  const apiThemeCSS = options?.theme ? themeToCSS(options.theme) : undefined;

  // Block-contributed styles
  const blockContribCSS = [...ctx.extraStyles];

  // Compile layered CSS with @layer cascade
  const layeredCSS = compileLayeredCSS(styleGraph, {
    diagnosticCSS: DEFAULT_STYLES,
    kitCSS: styles.length > 0 ? styles : undefined,
    kitKeyframes: Object.keys(keyframes).length > 0 ? keyframes : undefined,
    themeCSS: themeCSS.length > 0 ? themeCSS : undefined,
    presetCSS: presetCSS.length > 0 ? presetCSS : undefined,
    apiThemeCSS: apiThemeCSS || undefined,
    blockContribCSS: blockContribCSS.length > 0 ? blockContribCSS : undefined,
  });

  const extraCSS = [layeredCSS];

  const usedKitNames = doc.uses.filter(name => availableKits[name]);
  const activeThemeNames = themeNames.filter(name =>
    allThemes.has(name) || allThemes.has(`inline/${name}`),
  );
  const activePresetNames = presetNames.filter(name =>
    allPresets.has(name) || allPresets.has(`inline/${name}`),
  );

  const html = wrapOutput
    ? wrapOutput(blocksHtml, transformedDoc.meta, ctx, maxWidth, usedKitNames)
    : wrapWeb(blocksHtml, extraCSS, maxWidth, transformedDoc.meta, usedKitNames, activeThemeNames, activePresetNames, sourceMap, transformedDoc.styles, transformedDoc.inlineThemes, transformedDoc.inlinePresets);

  let result: CompileResult = {
    html,
    errors: [...transformedDoc.errors, ...ctx.errors],
    ...(sourceMap ? { sourceMap: entries } : {}),
    styleGraph,
  };

  for (const hook of [...kitAfterCompile, ...pluginAfterCompile]) {
    result = hook(result, ctx);
  }

  return result;
}

const MAX_DEPTH = 50;

function compileBlock(
  block: MklyBlock,
  registry: BlockRegistry,
  pluginRenderers: Map<string, (block: MklyBlock, ctx: CompileContext) => string>,
  ctx: CompileContext,
  sourceMap: boolean,
  depth = 0,
): string {
  if (depth > MAX_DEPTH) {
    return '<!-- mkly: max nesting depth exceeded -->';
  }
  const pluginRenderer = pluginRenderers.get(block.blockType);
  let html = pluginRenderer
    ? pluginRenderer(block, ctx)
    : registry.compile(block, ctx);

  // Inject source map + block identity attributes
  if (sourceMap) {
    html = html.replace(/^<(\w+)/, `<$1 data-mkly-line="${block.position.start.line}" data-mkly-id="${block.blockType}:${block.position.start.line}"`);
  }

  if (block.children.length > 0) {
    const childrenHtml = block.children
      .map(child => compileBlock(child, registry, pluginRenderers, ctx, sourceMap, depth + 1))
      .join('\n');
    html = html.replace('{{children}}', childrenHtml);
  } else {
    html = html.replace('{{children}}', '');
  }

  return html;
}

function escapeMetaContent(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildMetaTags(meta: Record<string, string>, uses: string[], themes?: string[], presets?: string[]): string {
  const tags: string[] = [];
  for (const kitName of uses) {
    tags.push(`<meta name="mkly:use" content="${escapeMetaContent(kitName)}">`);
  }
  if (themes) {
    for (const themeName of themes) {
      tags.push(`<meta name="mkly:theme" content="${escapeMetaContent(themeName)}">`);
    }
  }
  if (presets) {
    for (const presetName of presets) {
      tags.push(`<meta name="mkly:preset" content="${escapeMetaContent(presetName)}">`);
    }
  }
  for (const [key, value] of Object.entries(meta)) {
    tags.push(`<meta name="mkly:${escapeMetaContent(key)}" content="${escapeMetaContent(value)}">`);
  }
  return tags.length > 0 ? tags.join('\n') + '\n' : '';
}

function serializeInlineDefines(inlineThemes: MklyTheme[], inlinePresets: MklyPreset[]): string {
  const parts: string[] = [];
  for (const theme of inlineThemes) {
    const lines: string[] = [`--- define-theme: ${theme.name}`];
    if (theme.variables) {
      for (const [key, value] of Object.entries(theme.variables)) {
        lines.push(`${key}: ${value}`);
      }
    }
    if (theme.css) {
      if (theme.variables && Object.keys(theme.variables).length > 0) lines.push('');
      lines.push(theme.css);
    }
    parts.push(lines.join('\n'));
  }
  for (const preset of inlinePresets) {
    const lines: string[] = [`--- define-preset: ${preset.name}`];
    if (preset.css) {
      lines.push(preset.css);
    }
    parts.push(lines.join('\n'));
  }
  return parts.join('\n---\n');
}

function wrapWeb(content: string, extraCSS: string[], maxWidth: number, meta?: Record<string, string>, uses?: string[], themes?: string[], presets?: string[], sourceMap?: boolean, styleSources?: string[], inlineThemes?: MklyTheme[], inlinePresets?: MklyPreset[]): string {
  if (sourceMap) {
    extraCSS = [...extraCSS, '[data-mkly-active]{outline:2px solid rgba(59,130,246,0.5);outline-offset:2px;transition:outline 0.15s}'];
  }
  const styleTag = extraCSS.length > 0
    ? `<style>${extraCSS.join('\n')}</style>\n`
    : '';
  const metaTags = meta && uses ? buildMetaTags(meta, uses, themes, presets) : '';
  const syncScript = sourceMap
    ? `<script>
document.addEventListener('click',function(e){var el=e.target.closest('[data-mkly-line]');if(el)window.parent.postMessage({type:'mkly:click',line:+el.dataset.mklyLine},location.origin)});
window.addEventListener('message',function(e){if(e.origin!==location.origin)return;if(e.data&&e.data.type==='mkly:highlight'){var line=e.data.line;if(typeof line!=='number')return;document.querySelectorAll('[data-mkly-active]').forEach(function(x){x.removeAttribute('data-mkly-active')});var el=document.querySelector('[data-mkly-line="'+line+'"]');if(el){el.setAttribute('data-mkly-active','');el.scrollIntoView({behavior:'smooth',block:'nearest'})}}});
</script>\n`
    : '';
  // Embed original style block source for round-trip preservation
  const styleSourceTag = styleSources && styleSources.length > 0
    ? `<script type="text/mkly-style">${styleSources.join('\n---\n')}</script>\n`
    : '';
  // Embed inline theme/preset definitions for round-trip preservation
  const hasInlineDefines = (inlineThemes && inlineThemes.length > 0) || (inlinePresets && inlinePresets.length > 0);
  const definesSourceTag = hasInlineDefines
    ? `<script type="text/mkly-defines">${serializeInlineDefines(inlineThemes ?? [], inlinePresets ?? [])}</script>\n`
    : '';
  return [
    styleTag,
    syncScript,
    styleSourceTag,
    definesSourceTag,
    metaTags,
    `<main class="mkly-document" style="max-width:${maxWidth}px;margin:0 auto;">`,
    content,
    '</main>',
  ].join('');
}
