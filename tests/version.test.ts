import { describe, it, expect } from 'bun:test';
import { parse, mkly, MKLY_DEFAULT_VERSION, CORE_KIT, resolveVersion, validateVersionAgainstKit, getAvailableFeatures } from '../src/index';

describe('version system', () => {
  describe('MKLY_DEFAULT_VERSION', () => {
    it('should be 1', () => {
      expect(MKLY_DEFAULT_VERSION).toBe(1);
    });
  });

  describe('CORE_KIT versions', () => {
    it('should have versions defined', () => {
      expect(CORE_KIT.versions).toBeDefined();
      expect(CORE_KIT.versions!.current).toBe(1);
      expect(CORE_KIT.versions!.supported).toContain(1);
    });
  });

  describe('resolveVersion', () => {
    it('should error when no version in meta', () => {
      const result = resolveVersion({});
      expect(result.version).toBe(1);
      expect(result.error).toContain('Missing required');
    });

    it('should resolve explicit version 1', () => {
      const result = resolveVersion({ version: '1' });
      expect(result.version).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should error for non-numeric version', () => {
      const result = resolveVersion({ version: 'abc' });
      expect(result.version).toBe(1);
      expect(result.error).toContain('Invalid version');
    });

    it('should parse version number even if unsupported (validation happens at compile time)', () => {
      const result = resolveVersion({ version: '99' });
      expect(result.version).toBe(99);
      expect(result.error).toBeUndefined();
    });

    it('should not error for version with other meta', () => {
      const result = resolveVersion({ version: '1', title: 'Test' });
      expect(result.version).toBe(1);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateVersionAgainstKit', () => {
    it('should return null for supported version', () => {
      expect(validateVersionAgainstKit(1, CORE_KIT.versions)).toBeNull();
    });

    it('should return error for unsupported version', () => {
      expect(validateVersionAgainstKit(99, CORE_KIT.versions)).toContain('Unsupported version');
    });

    it('should return error for version 0', () => {
      expect(validateVersionAgainstKit(0, CORE_KIT.versions)).toContain('Unsupported version');
    });

    it('should use default [1] when no kit versions provided', () => {
      expect(validateVersionAgainstKit(1)).toBeNull();
      expect(validateVersionAgainstKit(2)).toContain('Unsupported version');
    });
  });

  describe('getAvailableFeatures', () => {
    it('should return features for version 1', () => {
      const features = getAvailableFeatures(1);
      expect(features.length).toBeGreaterThan(0);
      expect(features).toContain('core-blocks');
    });

    it('should return empty array for unknown version', () => {
      expect(getAvailableFeatures(99)).toEqual([]);
    });
  });

  describe('parser integration', () => {
    it('should set version 1 by default', () => {
      const doc = parse('--- core/text\n\nHello');
      expect(doc.version).toBe(1);
    });

    it('should set version from meta', () => {
      const doc = parse('--- meta\nversion: 1\n\n--- core/text\n\nHello');
      expect(doc.version).toBe(1);
      expect(doc.errors).toHaveLength(0);
    });

    it('should error on invalid version string', () => {
      const doc = parse('--- meta\nversion: abc\n\n--- core/text\n\nHello');
      expect(doc.version).toBe(1);
      expect(doc.errors.some(e => e.message.includes('Invalid version'))).toBe(true);
    });

    it('should parse unsupported version without parser error', () => {
      const doc = parse('--- meta\nversion: 99\n\n--- core/text\n\nHello');
      expect(doc.version).toBe(99);
      expect(doc.errors).toHaveLength(0);
    });

    it('should preserve version through the document', () => {
      const doc = parse('--- meta\nversion: 1\ntitle: Test\n\n--- core/heading\nlevel: 1\n\nHello');
      expect(doc.version).toBe(1);
      expect(doc.meta.version).toBe('1');
      expect(doc.meta.title).toBe('Test');
    });
  });

  describe('compiler integration', () => {
    it('should compile documents with version 1 and core kit', () => {
      const result = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/text\n\nHello', { kits: { core: CORE_KIT } });
      expect(result.html).toContain('Hello');
      expect(result.errors).toHaveLength(0);
    });

    it('should fail to compile with unsupported version', () => {
      const result = mkly('--- use: core\n\n--- meta\nversion: 99\n\n--- core/text\n\nHello', { kits: { core: CORE_KIT } });
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Unsupported version'))).toBe(true);
    });

    it('should error without explicit version', () => {
      const result = mkly('--- use: core\n\n--- core/text\n\nHello', { kits: { core: CORE_KIT } });
      expect(result.errors.some(e => e.message.includes('Missing required'))).toBe(true);
    });

    it('should produce unknown block warning without core kit', () => {
      const result = mkly('--- meta\nversion: 1\n\n--- core/text\n\nHello');
      expect(result.html).toContain('mkly-unknown');
    });

    it('should version-gate blocks with since > docVersion', () => {
      const { defineKit } = require('../src/index');
      const futureKit = defineKit({
        name: 'core',
        versions: { supported: [1, 2], current: 2 },
        blocks: [
          ...CORE_KIT.blocks!,
          { name: 'accordion', contentMode: 'mixed', since: 2, compile: () => '<div class="mkly-core-accordion">test</div>' },
        ],
      });

      // v1 doc should not have accordion
      const v1 = mkly('--- use: core\n\n--- meta\nversion: 1\n\n--- core/accordion\n\nContent', { kits: { core: futureKit } });
      expect(v1.html).toContain('mkly-unknown');

      // v2 doc should have accordion
      const v2 = mkly('--- use: core\n\n--- meta\nversion: 2\n\n--- core/accordion\n\nContent', { kits: { core: futureKit } });
      expect(v2.html).toContain('mkly-core-accordion');
    });
  });
});
