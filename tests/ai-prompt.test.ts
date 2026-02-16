import { describe, it, expect } from 'bun:test';
import {
  buildMklySystemPrompt,
  buildKitAuthoringGuide,
  buildPluginAuthoringGuide,
  ANTI_PATTERNS,
  EXAMPLES,
  estimateTokens,
  compareWithHtml,
} from '../src/index';

describe('AI prompt builder', () => {
  describe('buildMklySystemPrompt', () => {
    it('should produce a non-empty prompt', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include version information', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('version 1');
    });

    it('should include syntax rules', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('SYNTAX');
      expect(prompt).toContain('--- kit/blockType');
    });

    it('should include content mode rules', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('CONTENT MODES');
      expect(prompt).toContain('"text"');
      expect(prompt).toContain('"mixed"');
      expect(prompt).toContain('"properties"');
    });

    it('should include block schemas by default', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('AVAILABLE BLOCKS');
      expect(prompt).toContain('heading');
      expect(prompt).toContain('text');
      expect(prompt).toContain('image');
    });

    it('should not include newsletter blocks without extraSchemas', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).not.toContain('--- intro (text): Newsletter introduction');
      expect(prompt).not.toContain('--- featured (mixed): Featured article');
    });

    it('should include anti-patterns by default', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('COMMON MISTAKES');
      expect(prompt).toContain('WRONG');
      expect(prompt).toContain('RIGHT');
    });

    it('should exclude anti-patterns when disabled', () => {
      const prompt = buildMklySystemPrompt({ includeAntiPatterns: false });
      expect(prompt).not.toContain('COMMON MISTAKES');
    });

    it('should include examples by default', () => {
      const prompt = buildMklySystemPrompt();
      expect(prompt).toContain('EXAMPLE');
      expect(prompt).toContain('--- meta');
    });

    it('should exclude examples when disabled', () => {
      const prompt = buildMklySystemPrompt({ includeExamples: false });
      expect(prompt).not.toContain('EXAMPLE');
    });

    it('should exclude schema when disabled', () => {
      const prompt = buildMklySystemPrompt({ includeSchema: false });
      expect(prompt).not.toContain('AVAILABLE BLOCKS');
    });

    it('should include maxBlocks limit when specified', () => {
      const prompt = buildMklySystemPrompt({ maxBlocks: 20 });
      expect(prompt).toContain('Maximum 20 blocks');
    });

    it('should be under 4000 tokens (estimated)', () => {
      const prompt = buildMklySystemPrompt();
      const tokens = estimateTokens(prompt);
      expect(tokens).toBeLessThan(4000);
    });
  });

  describe('buildKitAuthoringGuide', () => {
    it('should produce a guide with defineKit', () => {
      const guide = buildKitAuthoringGuide();
      expect(guide).toContain('defineKit');
      expect(guide).toContain('defineBlock');
    });

    it('should mention schemas and styles', () => {
      const guide = buildKitAuthoringGuide();
      expect(guide).toContain('schemas');
      expect(guide).toContain('styles');
    });
  });

  describe('buildPluginAuthoringGuide', () => {
    it('should produce a guide with definePlugin', () => {
      const guide = buildPluginAuthoringGuide();
      expect(guide).toContain('definePlugin');
      expect(guide).toContain('renderers');
    });

    it('should mention wrapOutput', () => {
      const guide = buildPluginAuthoringGuide();
      expect(guide).toContain('wrapOutput');
    });
  });

  describe('ANTI_PATTERNS', () => {
    it('should have at least 8 patterns', () => {
      expect(ANTI_PATTERNS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have name, wrong, correct, explanation for each', () => {
      for (const pattern of ANTI_PATTERNS) {
        expect(pattern.name.length).toBeGreaterThan(0);
        expect(pattern.wrong.length).toBeGreaterThan(0);
        expect(pattern.correct.length).toBeGreaterThan(0);
        expect(pattern.explanation.length).toBeGreaterThan(0);
      }
    });
  });

  describe('EXAMPLES', () => {
    it('should have at least 3 examples', () => {
      expect(EXAMPLES.length).toBeGreaterThanOrEqual(3);
    });

    it('should have name, description, source for each', () => {
      for (const example of EXAMPLES) {
        expect(example.name.length).toBeGreaterThan(0);
        expect(example.description.length).toBeGreaterThan(0);
        expect(example.source.length).toBeGreaterThan(0);
      }
    });

    it('should have valid mkly source in each example', () => {
      const { parse } = require('../src/parser');
      for (const example of EXAMPLES) {
        const doc = parse(example.source);
        const fatalErrors = doc.errors.filter((e: { severity: string }) => e.severity === 'error');
        expect(fatalErrors).toHaveLength(0);
      }
    });
  });

  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate tokens based on character count', () => {
      expect(estimateTokens('Hello world')).toBeGreaterThan(0);
    });

    it('should roughly correspond to ~4 chars per token', () => {
      const tokens = estimateTokens('a'.repeat(100));
      expect(tokens).toBe(25);
    });
  });

  describe('compareWithHtml', () => {
    it('should show mkly is more token-efficient than HTML', () => {
      const mklySource = '--- core/text\n\nHello world';
      const htmlOutput = '<main class="mkly-document"><div class="mkly-core-text"><p>Hello world</p></div></main>';
      const result = compareWithHtml(mklySource, htmlOutput);
      expect(result.mklyTokens).toBeLessThan(result.htmlTokens);
      expect(result.savings).toBeGreaterThan(0);
      expect(result.savingsPercent).toBeGreaterThan(0);
    });

    it('should handle empty inputs', () => {
      const result = compareWithHtml('', '');
      expect(result.mklyTokens).toBe(0);
      expect(result.htmlTokens).toBe(0);
      expect(result.savingsPercent).toBe(0);
    });
  });
});
