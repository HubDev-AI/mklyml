export function estimateTokens(source: string): number {
  if (!source) return 0;
  // Simple heuristic: ~4 chars per token (rough BPE approximation)
  // This is intentionally simple — not a real tokenizer
  return Math.ceil(source.length / 4);
}

export interface TokenComparison {
  mklyTokens: number;
  htmlTokens: number;
  savings: number;
  savingsPercent: number;
}

export function compareWithHtml(mklySource: string, htmlOutput: string): TokenComparison {
  const mklyTokens = estimateTokens(mklySource);
  const htmlTokens = estimateTokens(htmlOutput);
  const savings = htmlTokens - mklyTokens;
  const savingsPercent = htmlTokens > 0 ? Math.round((savings / htmlTokens) * 100) : 0;
  return { mklyTokens, htmlTokens, savings, savingsPercent };
}
