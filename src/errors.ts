import type { MklyBlock, CompileContext, CompileError } from './types';
import { escapeHtml } from './utils';

export function requireProp(
  block: MklyBlock,
  key: string,
  ctx: CompileContext,
): string | undefined {
  const val = block.properties[key];
  if (val === undefined) {
    ctx.errors.push({
      message: `Missing required property "${key}" on ${block.blockType} block`,
      blockType: block.blockType,
      line: block.position.start.line,
      property: key,
      severity: 'error',
    });
  }
  return val;
}

export function warnMissing(
  block: MklyBlock,
  key: string,
  ctx: CompileContext,
  message?: string,
): void {
  ctx.errors.push({
    message: message ?? `Missing property "${key}" on ${block.blockType} block`,
    blockType: block.blockType,
    line: block.position.start.line,
    property: key,
    severity: 'warning',
  });
}

export function compileError(
  block: MklyBlock,
  message: string,
  ctx: CompileContext,
  severity: CompileError['severity'] = 'error',
): void {
  ctx.errors.push({
    message,
    blockType: block.blockType,
    line: block.position.start.line,
    severity,
  });
}

export function errorHtml(message: string, line: number): string {
  return [
    '<div class="mkly-error" data-mkly-error data-line="',
    String(line),
    '" style="padding:8px 12px;margin:4px 0;background:#fff0f0;border-left:3px solid #e53935;color:#c62828;font:13px/1.4 monospace;">',
    escapeHtml(message),
    ' <span style="opacity:0.6;">\u2014 line ',
    String(line),
    '</span></div>',
  ].join('');
}

export function prop(block: MklyBlock, key: string): string | undefined {
  return block.properties[key];
}

const CSS_VALUE_RE = /^[\w\s#%.,()+-]+$/;

export function safeCss(value: string): string | undefined {
  return CSS_VALUE_RE.test(value) ? value : undefined;
}

const CSS_UNIT_RE = /^-?\d+(\.\d+)?(px|em|rem|%|pt|cm|mm|in|vh|vw|vmin|vmax)$/i;
const BARE_NUMBER_RE = /^-?\d+(\.\d+)?$/;

/**
 * Normalize a CSS value — appends `defaultUnit` to bare numbers, passes
 * through values that already carry a unit. Prevents duplication like `222pxpx`.
 *
 *   cssVal('222')        → '222px'
 *   cssVal('222px')      → '222px'
 *   cssVal('2em')        → '2em'
 *   cssVal('#ff0000')    → '#ff0000'
 *   cssVal('calc(..)')   → 'calc(..)'
 */
export function cssVal(value: string, defaultUnit = 'px'): string {
  const v = value.trim();
  if (CSS_UNIT_RE.test(v)) return v;
  if (BARE_NUMBER_RE.test(v)) return v + defaultUnit;
  return v;
}
