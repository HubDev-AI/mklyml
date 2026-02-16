import type { TokenizedLine } from './types';

const BLOCK_END_RE = /^---\s+\/([\w-]+(?:\/[\w-]+)?)\s*$/;
const BLOCK_START_RE = /^---\s+([\w-]+(?:\/[\w-]+)?)(?::\s*(.+))?\s*$/;
const PROPERTY_RE = /^(@[\w.#:,/-]+|[\w]+):\s+(.*)$/;
const COMMENT_RE = /^\/\//;

export function tokenize(source: string): TokenizedLine[] {
  return source.split('\n').map((line, i) => classifyLine(line, i + 1));
}

function classifyLine(line: string, lineNumber: number): TokenizedLine {
  const trimmed = line.trim();

  if (!trimmed) {
    return { type: 'blank', line: lineNumber };
  }

  if (COMMENT_RE.test(trimmed)) {
    return { type: 'comment', content: trimmed.slice(2).trim(), line: lineNumber };
  }

  // Block end must be checked before start (--- /type vs --- type)
  const endMatch = trimmed.match(BLOCK_END_RE);
  if (endMatch) {
    return { type: 'block_end', blockType: endMatch[1], line: lineNumber };
  }

  const startMatch = trimmed.match(BLOCK_START_RE);
  if (startMatch) {
    return {
      type: 'block_start',
      blockType: startMatch[1],
      label: startMatch[2]?.trim(),
      line: lineNumber,
    };
  }

  const propMatch = trimmed.match(PROPERTY_RE);
  if (propMatch) {
    let value = propMatch[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    return { type: 'property', key: propMatch[1], value, raw: line, line: lineNumber };
  }

  // Preserve original indentation for text lines
  return { type: 'text', content: line, line: lineNumber };
}
