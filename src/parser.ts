import type { MklyDocument, MklyBlock, ParseError } from './types';
import { tokenize } from './tokenizer';
import { resolveVersion, MKLY_DEFAULT_VERSION } from './version';

type State = 'idle' | 'properties' | 'content' | 'verbatim';

export interface ParseOptions {
  verbatimBlocks?: Set<string>;
  sourceMap?: boolean;
}

const MAX_SOURCE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_BLOCKS = 10_000;

// Directive ordering phases — canonical order: use → define → theme → meta → style → blocks
type DirectivePhase = 'use' | 'define' | 'theme' | 'meta' | 'style' | 'blocks';
const PHASE_IDX: Record<DirectivePhase, number> = { use: 0, define: 1, theme: 2, meta: 3, style: 4, blocks: 5 };

function orderingError(directive: string, currentPhase: DirectivePhase): string {
  switch (currentPhase) {
    case 'define': return `"--- ${directive}" must appear before "--- define-theme/define-preset" — move it above the define blocks`;
    case 'theme': return `"--- ${directive}" must appear before "--- theme:" — move it above the theme declarations`;
    case 'meta': return `"--- ${directive}" must appear before "--- meta" — move it above the meta block`;
    case 'style': return `"--- ${directive}" must appear before "--- style" — move it above the style block`;
    case 'blocks': return `"--- ${directive}" must appear before content blocks — move it above the first block`;
    default: return `"--- ${directive}" must appear earlier in the document`;
  }
}

export function parse(source: string, options?: ParseOptions): MklyDocument {
  if (source.length > MAX_SOURCE_SIZE) {
    return {
      version: MKLY_DEFAULT_VERSION,
      blocks: [],
      meta: {},
      styles: [],
      uses: [],
      themes: [],
      presets: [],
      inlineThemes: [],
      inlinePresets: [],
      comments: [],
      errors: [{ message: 'Document exceeds maximum size (10 MB)', line: 1, severity: 'error' }],
    };
  }

  const tokens = tokenize(source);
  const doc: MklyDocument = { version: MKLY_DEFAULT_VERSION, blocks: [], meta: {}, styles: [], uses: [], themes: [], presets: [], inlineThemes: [], inlinePresets: [], comments: [], errors: [] };
  const verbatimBlocks = options?.verbatimBlocks ?? new Set<string>();
  const sourceMap = options?.sourceMap ?? false;

  let state: State = 'idle';
  let current: MklyBlock | null = null;
  let specialBlock: 'meta' | 'style' | 'use' | 'theme' | 'preset' | 'define-theme' | 'define-preset' | null = null;
  let verbatimBlockType: string | null = null;
  let phase: DirectivePhase = 'use';
  const contentLines: string[] = [];
  const contentLineNumbers: number[] = [];
  const styleLines: string[] = [];
  const useLines: string[] = [];
  const themeLines: string[] = [];
  const presetLines: string[] = [];
  // Inline theme/preset definition accumulators
  let defineThemeName: string | null = null;
  const defineThemeVars: Record<string, string> = {};
  const defineThemeCssLines: string[] = [];
  let definePresetName: string | null = null;
  const definePresetCssLines: string[] = [];

  function flushContent() {
    if (!current) return;
    // Trim leading blanks (and their line numbers)
    while (contentLines.length > 0 && contentLines[0] === '') {
      contentLines.shift();
      contentLineNumbers.shift();
    }
    // Trim trailing blanks
    while (contentLines.length > 0 && contentLines[contentLines.length - 1] === '') {
      contentLines.pop();
      contentLineNumbers.pop();
    }
    current.content = contentLines.join('\n');
    if (sourceMap && contentLineNumbers.length > 0) {
      current.contentLineMap = [...contentLineNumbers];
    }
    contentLines.length = 0;
    contentLineNumbers.length = 0;
  }

  function flushStyle() {
    if (specialBlock === 'style' && styleLines.length > 0) {
      // Trim leading/trailing blank lines
      while (styleLines.length > 0 && styleLines[0].trim() === '') styleLines.shift();
      while (styleLines.length > 0 && styleLines[styleLines.length - 1].trim() === '') styleLines.pop();
      if (styleLines.length > 0) {
        doc.styles.push(styleLines.join('\n'));
      }
    }
    styleLines.length = 0;
  }

  function flushUse() {
    if (specialBlock === 'use' && useLines.length > 0) {
      for (const line of useLines) {
        const trimmed = line.trim();
        if (trimmed) doc.uses.push(trimmed);
      }
    }
    useLines.length = 0;
  }

  function flushTheme() {
    if (specialBlock === 'theme' && themeLines.length > 0) {
      for (const line of themeLines) {
        const trimmed = line.trim();
        if (trimmed) doc.themes.push(trimmed);
      }
    }
    themeLines.length = 0;
  }

  function flushPreset() {
    if (specialBlock === 'preset' && presetLines.length > 0) {
      for (const line of presetLines) {
        const trimmed = line.trim();
        if (trimmed) doc.presets.push(trimmed);
      }
    }
    presetLines.length = 0;
  }

  function flushDefineTheme() {
    if (specialBlock === 'define-theme' && defineThemeName) {
      while (defineThemeCssLines.length > 0 && !defineThemeCssLines[0].trim()) defineThemeCssLines.shift();
      while (defineThemeCssLines.length > 0 && !defineThemeCssLines[defineThemeCssLines.length - 1].trim()) defineThemeCssLines.pop();
      const hasVars = Object.keys(defineThemeVars).length > 0;
      const hasCss = defineThemeCssLines.length > 0;
      if (hasVars || hasCss) {
        doc.inlineThemes.push({
          name: defineThemeName,
          ...(hasVars ? { variables: { ...defineThemeVars } } : {}),
          ...(hasCss ? { css: defineThemeCssLines.join('\n') } : {}),
        });
      } else {
        doc.errors.push({ message: `Empty define-theme "${defineThemeName}" — add variables or CSS`, line: 1, severity: 'warning' });
      }
    }
    defineThemeName = null;
    for (const k of Object.keys(defineThemeVars)) delete defineThemeVars[k];
    defineThemeCssLines.length = 0;
  }

  function flushDefinePreset() {
    if (specialBlock === 'define-preset' && definePresetName) {
      while (definePresetCssLines.length > 0 && !definePresetCssLines[0].trim()) definePresetCssLines.shift();
      while (definePresetCssLines.length > 0 && !definePresetCssLines[definePresetCssLines.length - 1].trim()) definePresetCssLines.pop();
      if (definePresetCssLines.length > 0) {
        doc.inlinePresets.push({
          name: definePresetName,
          css: definePresetCssLines.join('\n'),
        });
      } else {
        doc.errors.push({ message: `Empty define-preset "${definePresetName}" — add CSS rules`, line: 1, severity: 'warning' });
      }
    }
    definePresetName = null;
    definePresetCssLines.length = 0;
  }

  function flushBlock(endLine?: number) {
    flushContent();
    flushStyle();
    flushUse();
    flushTheme();
    flushPreset();
    flushDefineTheme();
    flushDefinePreset();
    if (current) {
      if (endLine !== undefined) {
        current.position.end = { line: endLine, column: 1 };
      }
      doc.blocks.push(current);
      current = null;
    }
    state = 'idle';
    specialBlock = null;
    verbatimBlockType = null;
  }

  for (const token of tokens) {
    // Verbatim mode: capture everything as raw text until matching closing tag
    if (state === 'verbatim' && verbatimBlockType) {
      if (token.type === 'block_end' && token.blockType === verbatimBlockType) {
        flushContent();
        if (current) {
          current.position.end = { line: token.line, column: 1 };
          doc.blocks.push(current);
          current = null;
        }
        state = 'idle';
        verbatimBlockType = null;
        continue;
      }

      // Reconstruct original line from token
      switch (token.type) {
        case 'block_start':
          contentLines.push(`--- ${token.blockType}${token.label ? ': ' + token.label : ''}`);
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
        case 'block_end':
          contentLines.push(`--- /${token.blockType}`);
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
        case 'property':
          contentLines.push(token.raw);
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
        case 'text':
          contentLines.push(token.content);
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
        case 'blank':
          contentLines.push('');
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
        case 'comment':
          contentLines.push(`// ${token.content}`);
          if (sourceMap) contentLineNumbers.push(token.line);
          break;
      }
      continue;
    }

    switch (token.type) {
      case 'block_start': {
        if (doc.blocks.length >= MAX_BLOCKS) {
          doc.errors.push({ message: `Maximum block count (${MAX_BLOCKS}) exceeded`, line: token.line, severity: 'error' });
          continue;
        }
        flushBlock(token.line > 1 ? token.line - 1 : 1);

        if (token.blockType === 'meta') {
          if (PHASE_IDX[phase] > PHASE_IDX['meta']) {
            doc.errors.push({ message: orderingError('meta', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['meta'] > PHASE_IDX[phase]) phase = 'meta';
          specialBlock = 'meta';
          state = 'properties';
        } else if (token.blockType === 'style') {
          if (PHASE_IDX[phase] > PHASE_IDX['style']) {
            doc.errors.push({ message: orderingError('style', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['style'] > PHASE_IDX[phase]) phase = 'style';
          specialBlock = 'style';
          state = 'content';
        } else if (token.blockType === 'use') {
          if (PHASE_IDX[phase] > PHASE_IDX['use']) {
            doc.errors.push({ message: orderingError('use:', phase), line: token.line, severity: 'error' });
          }
          specialBlock = 'use';
          if (token.label) {
            doc.uses.push(token.label);
          }
          state = 'content';
        } else if (token.blockType === 'theme') {
          if (PHASE_IDX[phase] > PHASE_IDX['theme']) {
            doc.errors.push({ message: orderingError('theme:', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['theme'] > PHASE_IDX[phase]) phase = 'theme';
          specialBlock = 'theme';
          if (token.label) {
            doc.themes.push(token.label);
          }
          state = 'content';
        } else if (token.blockType === 'preset') {
          if (PHASE_IDX[phase] > PHASE_IDX['theme']) {
            doc.errors.push({ message: orderingError('preset:', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['theme'] > PHASE_IDX[phase]) phase = 'theme';
          specialBlock = 'preset';
          if (token.label) {
            doc.presets.push(token.label);
          }
          state = 'content';
        } else if (token.blockType === 'define-theme') {
          if (PHASE_IDX[phase] > PHASE_IDX['define']) {
            doc.errors.push({ message: orderingError('define-theme:', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['define'] > PHASE_IDX[phase]) phase = 'define';
          specialBlock = 'define-theme';
          defineThemeName = token.label ?? null;
          if (!defineThemeName) {
            doc.errors.push({ message: '"--- define-theme" requires a name (e.g. --- define-theme: my-theme)', line: token.line, severity: 'error' });
          }
          state = 'properties';
        } else if (token.blockType === 'define-preset') {
          if (PHASE_IDX[phase] > PHASE_IDX['define']) {
            doc.errors.push({ message: orderingError('define-preset:', phase), line: token.line, severity: 'error' });
          }
          if (PHASE_IDX['define'] > PHASE_IDX[phase]) phase = 'define';
          specialBlock = 'define-preset';
          definePresetName = token.label ?? null;
          if (!definePresetName) {
            doc.errors.push({ message: '"--- define-preset" requires a name (e.g. --- define-preset: my-preset)', line: token.line, severity: 'error' });
          }
          state = 'content';
        } else {
          if (PHASE_IDX['blocks'] > PHASE_IDX[phase]) phase = 'blocks';
          current = {
            blockType: token.blockType,
            properties: {},
            content: '',
            children: [],
            position: {
              start: { line: token.line, column: 1 },
              end: { line: token.line, column: 1 },
            },
            ...(token.label ? { label: token.label } : {}),
            ...(sourceMap ? { propertyLines: {} } : {}),
          };
          state = 'properties';

          if (verbatimBlocks.has(token.blockType)) {
            verbatimBlockType = token.blockType;
          }
        }
        break;
      }

      case 'block_end': {
        flushBlock(token.line);

        // Retroactive restructure: find matching open block, collect children
        let openIndex = -1;
        for (let i = doc.blocks.length - 1; i >= 0; i--) {
          if (doc.blocks[i].blockType === token.blockType) {
            openIndex = i;
            break;
          }
        }

        if (openIndex !== -1) {
          const container = doc.blocks[openIndex];
          container.children = doc.blocks.splice(openIndex + 1);
          container.position.end = { line: token.line, column: 1 };
        } else {
          doc.errors.push({
            message: `Closing --- /${token.blockType} has no matching opening block`,
            line: token.line,
            severity: 'warning',
          });
        }
        break;
      }

      case 'property': {
        if (specialBlock === 'style') {
          styleLines.push(token.raw);
        } else if (specialBlock === 'use') {
          useLines.push(token.raw);
        } else if (specialBlock === 'theme') {
          themeLines.push(token.raw);
        } else if (specialBlock === 'preset') {
          presetLines.push(token.raw);
        } else if (specialBlock === 'define-theme') {
          if (state === 'properties') {
            defineThemeVars[token.key] = token.value;
          } else {
            defineThemeCssLines.push(token.raw);
          }
        } else if (specialBlock === 'define-preset') {
          definePresetCssLines.push(token.raw);
        } else if (state === 'properties') {
          if (specialBlock === 'meta') {
            doc.meta[token.key] = token.value;
          } else if (current) {
            if (token.key.startsWith('@')) {
              doc.errors.push({
                message: `Invalid property "${token.key}" — property names cannot start with @. Use a --- style block for styling.`,
                line: token.line,
                severity: 'error',
              });
            } else {
              if (token.key in current.properties) {
                doc.errors.push({
                  message: `Duplicate property "${token.key}" — previous value will be overwritten`,
                  line: token.line,
                  severity: 'warning',
                });
              }
              current.properties[token.key] = token.value;
              if (sourceMap && current.propertyLines) {
                current.propertyLines[token.key] = token.line;
              }
            }
          }
        } else if (state === 'content') {
          contentLines.push(token.raw);
          if (sourceMap) contentLineNumbers.push(token.line);
        }
        break;
      }

      case 'text': {
        if (specialBlock === 'style') {
          styleLines.push(token.content);
        } else if (specialBlock === 'use') {
          useLines.push(token.content);
        } else if (specialBlock === 'theme') {
          themeLines.push(token.content);
        } else if (specialBlock === 'preset') {
          presetLines.push(token.content);
        } else if (specialBlock === 'define-theme') {
          if (state === 'properties') state = 'content';
          defineThemeCssLines.push(token.content);
        } else if (specialBlock === 'define-preset') {
          definePresetCssLines.push(token.content);
        } else if (state === 'properties' || state === 'content') {
          if (state === 'properties') {
            state = verbatimBlockType ? 'verbatim' : 'content';
          }
          contentLines.push(token.content);
          if (sourceMap) contentLineNumbers.push(token.line);
        }
        break;
      }

      case 'blank': {
        if (specialBlock === 'style') {
          styleLines.push('');
        } else if (specialBlock === 'use') {
          // skip blank lines in use blocks
        } else if (specialBlock === 'theme') {
          // skip blank lines in theme blocks
        } else if (specialBlock === 'preset') {
          // skip blank lines in preset blocks
        } else if (specialBlock === 'define-theme') {
          if (state === 'properties') {
            state = 'content';
          } else {
            defineThemeCssLines.push('');
          }
        } else if (specialBlock === 'define-preset') {
          definePresetCssLines.push('');
        } else if (state === 'properties') {
          state = verbatimBlockType ? 'verbatim' : 'content';
        } else if (state === 'content') {
          contentLines.push('');
          if (sourceMap) contentLineNumbers.push(token.line);
        }
        break;
      }

      case 'comment':
        if (specialBlock === 'style') {
          styleLines.push(`// ${token.content}`);
        } else {
          doc.comments.push({ content: token.content, line: token.line });
        }
        break;
    }
  }

  const lastLine = tokens.length > 0 ? tokens[tokens.length - 1].line : 1;
  flushBlock(lastLine);

  const versionResult = resolveVersion(doc.meta);
  doc.version = versionResult.version;
  if (versionResult.error) {
    doc.errors.push({ message: versionResult.error, line: 1, severity: 'error' });
  }

  return doc;
}
