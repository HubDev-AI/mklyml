import { describe, it, expect } from 'bun:test';
import { createCompletionData } from '../src/completions';
import { CORE_SCHEMAS } from '../src/schemas';
import { CORE_KIT } from '../src/blocks';

describe('completions', () => {
  describe('createCompletionData', () => {
    it('should extract block completions from kit schemas with qualified names', () => {
      const data = createCompletionData([], [CORE_KIT]);
      expect(data.blocks.length).toBe(16);
      expect(data.blocks[0].type).toBe('block');

      const heading = data.blocks.find(b => b.label === 'core/heading');
      expect(heading).toBeDefined();
      expect(heading!.description).toBe('Heading element (h1-h6)');
    });

    it('should extract property completions per block', () => {
      const data = createCompletionData([], [CORE_KIT]);

      const heroProps = data.properties.get('core/hero');
      expect(heroProps).toBeDefined();
      expect(heroProps!.length).toBeGreaterThan(0);
      expect(heroProps!.every(p => p.type === 'property')).toBe(true);

      const imageLabel = heroProps!.find(p => p.label === 'image');
      expect(imageLabel).toBeDefined();
      expect(imageLabel!.description.length).toBeGreaterThan(0);
    });

    it('should not include properties for blocks with empty schemas', () => {
      const data = createCompletionData([], [CORE_KIT]);
      const textProps = data.properties.get('core/text');
      expect(textProps).toBeUndefined();
    });

    it('should extract kit completions', () => {
      const data = createCompletionData([], [CORE_KIT]);
      expect(data.kits.length).toBe(1);
      expect(data.kits[0].label).toBe('core');
      expect(data.kits[0].type).toBe('kit');
    });

    it('should include style variable completions', () => {
      const data = createCompletionData(CORE_SCHEMAS);
      expect(data.variables.length).toBeGreaterThan(0);
      expect(data.variables.every(v => v.type === 'variable')).toBe(true);

      const accent = data.variables.find(v => v.label === 'accent');
      expect(accent).toBeDefined();
      expect(accent!.description).toBe('Primary accent color');
    });

    it('should have descriptions for all core block schemas', () => {
      for (const schema of CORE_SCHEMAS) {
        expect(schema.description.length).toBeGreaterThan(0);
      }
    });
  });
});
