import type { ValidationResult } from './validate';

export interface FormatOptions {
  includeSource?: boolean;
  maxErrors?: number;
}

export function formatErrors(
  result: ValidationResult,
  source: string,
  options?: FormatOptions,
): string {
  const maxErrors = options?.maxErrors ?? 10;
  const includeSource = options?.includeSource ?? true;
  const lines = source.split('\n');

  const errors = result.errors.filter(e => e.severity === 'error');
  const warnings = result.errors.filter(e => e.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) return '';

  const parts: string[] = [];
  const totalIssues = errors.length + warnings.length;
  if (errors.length > 0) {
    parts.push(
      `VALIDATION FAILED — ${errors.length} error${errors.length !== 1 ? 's' : ''}${warnings.length > 0 ? `, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}` : ''} found`,
    );
  } else {
    parts.push(
      `VALIDATION PASSED with ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} — please fix`,
    );
  }

  let shown = 0;

  for (let i = 0; i < errors.length && shown < maxErrors; i++) {
    const err = errors[i];
    const suggestion = result.suggestions.find(
      s => s.line === err.line && s.message.toLowerCase().includes(
        err.message.includes('Unknown block type') ? 'unknown block' :
        err.message.includes('requires') ? 'missing required' :
        err.message.toLowerCase().substring(0, 20),
      ),
    );

    parts.push('');
    parts.push(`ERROR ${i + 1} (line ${err.line}): ${err.message}`);

    if (includeSource && err.line > 0 && err.line <= lines.length) {
      const start = Math.max(0, err.line - 1);
      const end = Math.min(lines.length, err.line + 1);
      for (let l = start; l < end; l++) {
        parts.push(`  > ${lines[l]}`);
      }
    }

    if (suggestion?.fix) {
      parts.push(`  FIX: ${suggestion.fix}`);
    }

    shown++;
  }

  for (let i = 0; i < warnings.length && shown < maxErrors; i++) {
    const warn = warnings[i];
    const suggestion = result.suggestions.find(s => s.line === warn.line);

    parts.push('');
    parts.push(`WARNING ${i + 1} (line ${warn.line}): ${warn.message}`);

    if (includeSource && warn.line > 0 && warn.line <= lines.length) {
      const start = Math.max(0, warn.line - 1);
      const end = Math.min(lines.length, warn.line + 1);
      for (let l = start; l < end; l++) {
        parts.push(`  > ${lines[l]}`);
      }
    }

    if (suggestion?.fix) {
      parts.push(`  FIX: ${suggestion.fix}`);
    }

    shown++;
  }

  if (totalIssues > maxErrors) {
    parts.push('');
    parts.push(`... and ${totalIssues - maxErrors} more issue${totalIssues - maxErrors !== 1 ? 's' : ''}`);
  }

  return parts.join('\n');
}
