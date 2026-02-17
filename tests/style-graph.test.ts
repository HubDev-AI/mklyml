import { describe, it, expect } from 'bun:test';
import {
  parseStyleGraph,
  serializeStyleGraph,
  compileStyleGraphToCSS,
  mergeRule,
  removeRule,
  getStyleValue,
  mergeStyleGraphs,
  emptyStyleGraph,
  resolveSelector,
  cssProperty,
  resolveValue,
  resolveForEmail,
  getEmailStyleMap,
  type StyleGraph,
} from '../src/style-graph';

// ===== parseStyleGraph: Basic Parsing =====

describe('parseStyleGraph: basic parsing', () => {
  it('parses empty source', () => {
    const graph = parseStyleGraph('');
    expect(graph.variables).toHaveLength(0);
    expect(graph.rules).toHaveLength(0);
  });

  it('parses whitespace-only source', () => {
    const graph = parseStyleGraph('   \n  \n  ');
    expect(graph.rules).toHaveLength(0);
  });

  it('parses a single block with one property', () => {
    const graph = parseStyleGraph('core/heading\n  color: #ff0000');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('core/heading');
    expect(graph.rules[0].target).toBe('self');
    expect(graph.rules[0].properties['color']).toBe('#ff0000');
  });

  it('parses multiple properties', () => {
    const graph = parseStyleGraph(
      'core/heading\n  color: #ff0000\n  fontSize: 24px\n  fontWeight: bold',
    );
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('#ff0000');
    expect(graph.rules[0].properties['font-size']).toBe('24px');
    expect(graph.rules[0].properties['font-weight']).toBe('bold');
  });

  it('parses multiple block selectors', () => {
    const source = 'core/heading\n  color: red\n\ncore/text\n  padding: 8px';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(2);
    expect(graph.rules[0].blockType).toBe('core/heading');
    expect(graph.rules[1].blockType).toBe('core/text');
  });

  it('parses variables at indent 0', () => {
    const graph = parseStyleGraph('accent: #e2725b\nbg: #ffffff');
    expect(graph.variables).toHaveLength(2);
    expect(graph.variables[0].name).toBe('accent');
    expect(graph.variables[0].value).toBe('#e2725b');
    expect(graph.rules).toHaveLength(0);
  });

  it('parses variables mixed with rules', () => {
    const source = 'accent: #e2725b\n\ncore/heading\n  color: $accent';
    const graph = parseStyleGraph(source);
    expect(graph.variables).toHaveLength(1);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('$accent');
  });

  it('ignores comment lines', () => {
    const source = '// This is a comment\ncore/heading\n  // Another comment\n  color: red';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('red');
  });

  it('strips inline comments from values', () => {
    const source = 'core/heading\n  color: #4A3728 // Dark brown';
    const graph = parseStyleGraph(source);
    expect(graph.rules[0].properties['color']).toBe('#4A3728');
  });
});

// ===== parseStyleGraph: Labels =====

describe('parseStyleGraph: labels', () => {
  it('parses label selector core/card:hero', () => {
    const graph = parseStyleGraph('core/card:hero\n  backgroundColor: #fef3c7');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('core/card');
    expect(graph.rules[0].label).toBe('hero');
    expect(graph.rules[0].target).toBe('self');
  });

  it('parses labeled rule with sub-element', () => {
    const source = 'core/card:hero\n  .img\n    objectFit: cover';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('core/card');
    expect(graph.rules[0].label).toBe('hero');
    expect(graph.rules[0].target).toBe('img');
  });

  it('keeps labeled and unlabeled rules separate', () => {
    const source = 'core/card\n  padding: 16px\n\ncore/card:hero\n  backgroundColor: yellow';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(2);
    expect(graph.rules[0].label).toBeUndefined();
    expect(graph.rules[1].label).toBe('hero');
  });

  it('parses newsletter/item:s1 label', () => {
    const source = 'newsletter/item:s1\n  .link\n    color: #1d4ed8';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('newsletter/item');
    expect(graph.rules[0].label).toBe('s1');
    expect(graph.rules[0].target).toBe('link');
  });
});

// ===== parseStyleGraph: Sub-elements & Pseudos =====

describe('parseStyleGraph: sub-elements and pseudos', () => {
  it('parses BEM sub-element .img', () => {
    const source = 'core/card\n  .img\n    objectFit: cover';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('img');
  });

  it('parses pseudo :hover on self', () => {
    const source = 'core/card\n  :hover\n    opacity: 0.8';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('self:hover');
  });

  it('parses sub-element with pseudo .img:hover', () => {
    const source = 'core/card\n  .img:hover\n    transform: scale(1.05)';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('img:hover');
  });

  it('parses tag descendant >p', () => {
    const source = 'core/text\n  >p\n    marginBottom: 8px';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('>p');
  });

  it('parses tag descendant with pseudo >a:hover', () => {
    const source = 'core/text\n  >a:hover\n    color: blue';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('>a:hover');
  });

  it('parses class descendant >.s1', () => {
    const source = 'core/text\n  >.s1\n    color: red';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('>.s1');
  });

  it('self properties + sub-element creates separate rules', () => {
    const source = 'core/card\n  padding: 16px\n  .img\n    objectFit: cover';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(2);
    expect(graph.rules[0].target).toBe('self');
    expect(graph.rules[0].properties['padding']).toBe('16px');
    expect(graph.rules[1].target).toBe('img');
    expect(graph.rules[1].properties['object-fit']).toBe('cover');
  });

  it('resets to self when property appears after sub-element at base indent', () => {
    const source = 'core/card\n  .img\n    objectFit: cover\n  padding: 16px';
    const graph = parseStyleGraph(source);
    // Should have both img and self rules
    const selfRule = graph.rules.find(r => r.target === 'self');
    const imgRule = graph.rules.find(r => r.target === 'img');
    expect(selfRule).toBeDefined();
    expect(imgRule).toBeDefined();
    expect(selfRule!.properties['padding']).toBe('16px');
    expect(imgRule!.properties['object-fit']).toBe('cover');
  });
});

// ===== parseStyleGraph: Warnings =====

describe('parseStyleGraph: warnings', () => {
  it('warns on Sass functions', () => {
    const graph = parseStyleGraph('core/heading\n  color: darken(#ff0000, 10%)');
    expect(graph.warnings).toBeDefined();
    expect(graph.warnings!.length).toBeGreaterThan(0);
    expect(graph.warnings![0].message).toContain('darken');
  });

  it('warns on HTML element names as selectors', () => {
    const graph = parseStyleGraph('body\n  color: red');
    expect(graph.warnings).toBeDefined();
    expect(graph.warnings!.some(w => w.message.includes('HTML element'))).toBe(true);
  });

  it('no warnings for valid content', () => {
    const graph = parseStyleGraph('core/heading\n  color: red');
    expect(graph.warnings).toBeUndefined();
  });
});

// ===== serializeStyleGraph =====

describe('serializeStyleGraph', () => {
  it('serializes empty graph', () => {
    expect(serializeStyleGraph(emptyStyleGraph())).toBe('');
  });

  it('serializes single rule', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: 'red' } }],
    };
    const output = serializeStyleGraph(graph);
    expect(output).toContain('core/heading');
    expect(output).toContain('color: red');
  });

  it('serializes variables before rules', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'accent', value: '#e2725b' }],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: '$accent' } }],
    };
    const output = serializeStyleGraph(graph);
    const accentIdx = output.indexOf('accent: #e2725b');
    const headingIdx = output.indexOf('core/heading');
    expect(accentIdx).toBeLessThan(headingIdx);
  });

  it('serializes labeled rules with colon syntax', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'self', label: 'hero', properties: { padding: '16px' } }],
    };
    const output = serializeStyleGraph(graph);
    expect(output).toContain('core/card:hero');
  });

  it('groups self and sub-element under same selector', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [
        { blockType: 'core/card', target: 'self', properties: { padding: '16px' } },
        { blockType: 'core/card', target: 'img', properties: { 'object-fit': 'cover' } },
      ],
    };
    const output = serializeStyleGraph(graph);
    // Should only have one "core/card" selector with .img indented under it
    const occurrences = output.split('core/card').length - 1;
    expect(occurrences).toBe(1);
    expect(output).toContain('.img');
  });

  it('serializes pseudo-selectors correctly', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'self:hover', properties: { opacity: '0.8' } }],
    };
    const output = serializeStyleGraph(graph);
    expect(output).toContain(':hover');
  });

  it('serializes tag descendants correctly', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/text', target: '>p', properties: { margin: '8px' } }],
    };
    const output = serializeStyleGraph(graph);
    expect(output).toContain('>p');
  });
});

// ===== Parse → Serialize Round-Trip =====

describe('parseStyleGraph → serializeStyleGraph round-trip', () => {
  it('round-trips a simple rule', () => {
    const source = 'core/heading\n  color: red';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].blockType).toBe('core/heading');
    expect(reparsed.rules[0].properties['color']).toBe('red');
  });

  it('round-trips variables', () => {
    const source = 'accent: #e2725b\nbg: #ffffff';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.variables).toHaveLength(2);
  });

  it('round-trips labeled rules', () => {
    const source = 'core/card:hero\n  backgroundColor: yellow';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].label).toBe('hero');
  });

  it('round-trips sub-elements', () => {
    const source = 'core/card\n  padding: 16px\n  .img\n    objectFit: cover';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    const selfRule = reparsed.rules.find(r => r.target === 'self');
    const imgRule = reparsed.rules.find(r => r.target === 'img');
    expect(selfRule).toBeDefined();
    expect(imgRule).toBeDefined();
  });

  it('round-trips tag descendants', () => {
    const source = 'core/text\n  >.s1\n    color: red';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].target).toBe('>.s1');
  });

  it('round-trips pseudos', () => {
    const source = 'core/card\n  :hover\n    opacity: 0.9';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].target).toBe('self:hover');
  });

  it('round-trips complex graph with mixed targets', () => {
    const source = [
      'accent: #e2725b',
      '',
      'core/card',
      '  padding: 16px',
      '  .img',
      '    objectFit: cover',
      '  :hover',
      '    opacity: 0.8',
      '',
      'core/card:hero',
      '  backgroundColor: yellow',
      '',
      'core/text',
      '  >.s1',
      '    color: red',
    ].join('\n');
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);

    expect(reparsed.variables).toHaveLength(1);
    expect(reparsed.rules.length).toBeGreaterThanOrEqual(5);

    // Verify specific rules survived
    const heroRule = reparsed.rules.find(r => r.label === 'hero');
    expect(heroRule).toBeDefined();
    const hoverRule = reparsed.rules.find(r => r.target === 'self:hover');
    expect(hoverRule).toBeDefined();
    const s1Rule = reparsed.rules.find(r => r.target === '>.s1');
    expect(s1Rule).toBeDefined();
  });
});

// ===== Serialization: interleaved self/sub-element =====

describe('serializeStyleGraph: interleaved rules', () => {
  it('merges multiple self rules created by interleaved sub-elements', () => {
    const graph = parseStyleGraph([
      'core/card',
      '  padding: 16px',
      '  .img',
      '    object-fit: cover',
      '  border: 1px solid #ccc',
      '  .body',
      '    color: #333',
      '  margin: 8px',
    ].join('\n'));

    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);

    // All self properties must survive the round-trip
    const selfRule = reparsed.rules.find(r => r.target === 'self');
    expect(selfRule?.properties).toHaveProperty('padding', '16px');
    expect(selfRule?.properties).toHaveProperty('border', '1px solid #ccc');
    expect(selfRule?.properties).toHaveProperty('margin', '8px');

    // Sub-element rules must survive too
    expect(reparsed.rules.find(r => r.target === 'img')?.properties).toHaveProperty('object-fit', 'cover');
    expect(reparsed.rules.find(r => r.target === 'body')?.properties).toHaveProperty('color', '#333');
  });
});

// ===== resolveSelector =====

describe('resolveSelector', () => {
  it('self → .mkly-core-card', () => {
    expect(resolveSelector('self', 'core/card')).toBe('.mkly-core-card');
  });

  it('self with label → .mkly-core-card--hero', () => {
    expect(resolveSelector('self', 'core/card', 'hero')).toBe('.mkly-core-card--hero');
  });

  it('self:hover → .mkly-core-card:hover', () => {
    expect(resolveSelector('self:hover', 'core/card')).toBe('.mkly-core-card:hover');
  });

  it('self:hover with label → .mkly-core-card--hero:hover', () => {
    expect(resolveSelector('self:hover', 'core/card', 'hero')).toBe('.mkly-core-card--hero:hover');
  });

  it('BEM sub-element → .mkly-core-card__img', () => {
    expect(resolveSelector('img', 'core/card')).toBe('.mkly-core-card__img');
  });

  it('BEM sub-element with label → .mkly-core-card--hero__img', () => {
    expect(resolveSelector('img', 'core/card', 'hero')).toBe('.mkly-core-card--hero__img');
  });

  it('BEM sub-element with pseudo → .mkly-core-card__img:hover', () => {
    expect(resolveSelector('img:hover', 'core/card')).toBe('.mkly-core-card__img:hover');
  });

  it('tag descendant >p → .mkly-core-text p', () => {
    expect(resolveSelector('>p', 'core/text')).toBe('.mkly-core-text p');
  });

  it('tag descendant with label → .mkly-core-text--s1 p', () => {
    expect(resolveSelector('>p', 'core/text', 's1')).toBe('.mkly-core-text--s1 p');
  });

  it('class descendant >.s1 → .mkly-core-text .s1', () => {
    expect(resolveSelector('>.s1', 'core/text')).toBe('.mkly-core-text .s1');
  });

  it('newsletter/item → .mkly-newsletter-item', () => {
    expect(resolveSelector('self', 'newsletter/item')).toBe('.mkly-newsletter-item');
  });
});

// ===== compileStyleGraphToCSS =====

describe('compileStyleGraphToCSS', () => {
  it('compiles empty graph to empty string', () => {
    expect(compileStyleGraphToCSS(emptyStyleGraph())).toBe('');
  });

  it('compiles variables to .mkly-document block', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'accent', value: '#e2725b' }],
      rules: [],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-document');
    expect(css).toContain('--mkly-accent: #e2725b');
  });

  it('compiles block rule to CSS', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: 'red' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-heading');
    expect(css).toContain('color: red;');
  });

  it('compiles labeled rule', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'self', label: 'hero', properties: { padding: '16px' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-card--hero');
    expect(css).toContain('padding: 16px;');
  });

  it('resolves $variable references in CSS output', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'accent', value: '#e2725b' }],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: '$accent' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('var(--mkly-accent)');
  });

  it('propagates inherited properties to text child elements for BEM targets', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'body', properties: { color: 'blue' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-card__body');
    // Should also have propagation rule
    expect(css).toContain(':is(p, li, h1');
  });

  it('does NOT propagate inherited properties for tag targets', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/text', target: '>p', properties: { color: 'blue' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-text p');
    // Should NOT have :is() propagation for tag targets
    expect(css).not.toContain(':is(');
  });

  it('emits user-defined variables as --mkly-* custom properties', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'primary', value: '#1a1a1a' }],
      rules: [{ blockType: 'core/text', target: 'self', properties: { color: '$primary' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    // Variable declaration must use --mkly-primary (not bare "primary")
    expect(css).toContain('--mkly-primary: #1a1a1a');
    expect(css).not.toMatch(/[^-]primary: #1a1a1a/);
    // Rule reference must match
    expect(css).toContain('var(--mkly-primary)');
  });

  it('emits camelCase user variables as kebab-case custom properties', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'brandColor', value: '#ff5500' }],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: '$brandColor' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('--mkly-brand-color: #ff5500');
    expect(css).toContain('var(--mkly-brand-color)');
  });

  it('does NOT propagate non-inherited properties', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'body', properties: { padding: '16px' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-card__body');
    // padding is not inherited, so no :is() rule
    expect(css).not.toContain(':is(');
  });
});

// ===== Mutation Functions =====

describe('mergeRule', () => {
  it('adds a new rule to empty graph', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('red');
  });

  it('updates existing property', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    graph = mergeRule(graph, 'core/heading', 'self', 'color', 'blue');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('blue');
  });

  it('adds property to existing rule', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    graph = mergeRule(graph, 'core/heading', 'self', 'fontSize', '24px');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBe('red');
    expect(graph.rules[0].properties['fontSize']).toBe('24px');
  });

  it('creates separate rules for different targets', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/card', 'self', 'padding', '16px');
    graph = mergeRule(graph, 'core/card', 'img', 'objectFit', 'cover');
    expect(graph.rules).toHaveLength(2);
  });

  it('creates separate rules for different labels', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/card', 'self', 'padding', '16px');
    graph = mergeRule(graph, 'core/card', 'self', 'backgroundColor', 'yellow', 'hero');
    expect(graph.rules).toHaveLength(2);
    expect(graph.rules[0].label).toBeUndefined();
    expect(graph.rules[1].label).toBe('hero');
  });

  it('is immutable — does not modify original graph', () => {
    const original = emptyStyleGraph();
    const modified = mergeRule(original, 'core/heading', 'self', 'color', 'red');
    expect(original.rules).toHaveLength(0);
    expect(modified.rules).toHaveLength(1);
  });
});

describe('removeRule', () => {
  it('removes a property from a rule', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    graph = mergeRule(graph, 'core/heading', 'self', 'fontSize', '24px');
    graph = removeRule(graph, 'core/heading', 'self', 'color');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties['color']).toBeUndefined();
    expect(graph.rules[0].properties['fontSize']).toBe('24px');
  });

  it('removes entire rule when last property is removed', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    graph = removeRule(graph, 'core/heading', 'self', 'color');
    expect(graph.rules).toHaveLength(0);
  });

  it('does nothing for non-existent property', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    const result = removeRule(graph, 'core/heading', 'self', 'fontSize');
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].properties['color']).toBe('red');
  });

  it('removes from labeled rule without affecting unlabeled', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/card', 'self', 'padding', '16px');
    graph = mergeRule(graph, 'core/card', 'self', 'backgroundColor', 'yellow', 'hero');
    graph = removeRule(graph, 'core/card', 'self', 'backgroundColor', 'hero');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].label).toBeUndefined();
    expect(graph.rules[0].properties['padding']).toBe('16px');
  });

  it('is immutable', () => {
    const original = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    const modified = removeRule(original, 'core/heading', 'self', 'color');
    expect(original.rules).toHaveLength(1);
    expect(modified.rules).toHaveLength(0);
  });
});

describe('getStyleValue', () => {
  it('returns value for existing property', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    expect(getStyleValue(graph, 'core/heading', 'self', 'color')).toBe('red');
  });

  it('returns undefined for non-existent property', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    expect(getStyleValue(graph, 'core/heading', 'self', 'fontSize')).toBeUndefined();
  });

  it('returns undefined for non-existent block type', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'color', 'red');
    expect(getStyleValue(graph, 'core/text', 'self', 'color')).toBeUndefined();
  });

  it('distinguishes labeled from unlabeled', () => {
    let graph = mergeRule(emptyStyleGraph(), 'core/card', 'self', 'padding', '16px');
    graph = mergeRule(graph, 'core/card', 'self', 'padding', '32px', 'hero');
    expect(getStyleValue(graph, 'core/card', 'self', 'padding')).toBe('16px');
    expect(getStyleValue(graph, 'core/card', 'self', 'padding', 'hero')).toBe('32px');
  });
});

// ===== mergeStyleGraphs =====

describe('mergeStyleGraphs', () => {
  it('merges two graphs', () => {
    const g1: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: 'red' } }],
    };
    const g2: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/text', target: 'self', properties: { padding: '8px' } }],
    };
    const merged = mergeStyleGraphs(g1, g2);
    expect(merged.rules).toHaveLength(2);
  });

  it('later graph overrides same rule', () => {
    const g1: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: 'red' } }],
    };
    const g2: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: 'blue', fontSize: '24px' } }],
    };
    const merged = mergeStyleGraphs(g1, g2);
    expect(merged.rules).toHaveLength(1);
    expect(merged.rules[0].properties['color']).toBe('blue');
    expect(merged.rules[0].properties['fontSize']).toBe('24px');
  });

  it('merges variables, later overrides', () => {
    const g1: StyleGraph = { variables: [{ name: 'accent', value: 'red' }], rules: [] };
    const g2: StyleGraph = { variables: [{ name: 'accent', value: 'blue' }], rules: [] };
    const merged = mergeStyleGraphs(g1, g2);
    expect(merged.variables).toHaveLength(1);
    expect(merged.variables[0].value).toBe('blue');
  });

  it('keeps labeled and unlabeled separate during merge', () => {
    const g1: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'self', properties: { padding: '16px' } }],
    };
    const g2: StyleGraph = {
      variables: [],
      rules: [{ blockType: 'core/card', target: 'self', label: 'hero', properties: { backgroundColor: 'yellow' } }],
    };
    const merged = mergeStyleGraphs(g1, g2);
    expect(merged.rules).toHaveLength(2);
  });
});

// ===== cssProperty =====

describe('cssProperty', () => {
  it('converts camelCase to kebab-case', () => {
    expect(cssProperty('fontSize')).toBe('font-size');
    expect(cssProperty('backgroundColor')).toBe('background-color');
    expect(cssProperty('borderTopLeftRadius')).toBe('border-top-left-radius');
  });

  it('passes through kebab-case', () => {
    expect(cssProperty('font-size')).toBe('font-size');
  });

  it('resolves aliases', () => {
    expect(cssProperty('bg')).toBe('background');
    expect(cssProperty('fg')).toBe('color');
    expect(cssProperty('rounded')).toBe('border-radius');
  });
});

// ===== resolveValue =====

describe('resolveValue', () => {
  it('resolves $variable to var(--mkly-*)', () => {
    const result = resolveValue('$accent');
    expect(result).toContain('var(--mkly-accent)');
  });

  it('resolves multiple variables in one value', () => {
    const result = resolveValue('0 2px 4px $shadow');
    expect(result).toContain('var(--mkly-shadow)');
  });

  it('passes through plain values', () => {
    expect(resolveValue('16px')).toBe('16px');
    expect(resolveValue('#ff0000')).toBe('#ff0000');
  });

  it('escapes script closing tags', () => {
    const result = resolveValue('</script>');
    expect(result).not.toContain('</script>');
  });
});

// ===== resolveForEmail =====

describe('resolveForEmail', () => {
  it('resolves $variable from variables map', () => {
    const result = resolveForEmail('$accent', { accent: '#e2725b' });
    expect(result).toBe('#e2725b');
  });

  it('resolves var(--mkly-accent) from variables map', () => {
    const result = resolveForEmail('var(--mkly-accent)', { accent: '#e2725b' });
    expect(result).toBe('#e2725b');
  });

  it('uses fallback value if variable not found', () => {
    const result = resolveForEmail('var(--mkly-unknown, #fff)', {});
    expect(result).toBe('#fff');
  });

  it('passes through plain values', () => {
    expect(resolveForEmail('16px', {})).toBe('16px');
  });

  it('resolves nested var() fallbacks', () => {
    const result = resolveForEmail('var(--mkly-size, var(--mkly-default, 16px))', {});
    expect(result).toBe('16px');
  });

  it('resolves nested var() when inner variable exists', () => {
    const result = resolveForEmail('var(--mkly-size, var(--mkly-default, 16px))', { default: '20px' });
    expect(result).toBe('20px');
  });

  it('resolves nested var() when outer variable exists', () => {
    const result = resolveForEmail('var(--mkly-size, var(--mkly-default, 16px))', { size: '24px' });
    expect(result).toBe('24px');
  });
});

// ===== getEmailStyleMap =====

describe('getEmailStyleMap', () => {
  it('returns resolved properties for a matching rule', () => {
    const graph: StyleGraph = {
      variables: [{ name: 'accent', value: '#e2725b' }],
      rules: [{ blockType: 'core/heading', target: 'self', properties: { color: '$accent', fontSize: '24px' } }],
    };
    const result = getEmailStyleMap(graph, 'core/heading', 'self', { accent: '#e2725b' });
    expect(result['color']).toBe('#e2725b');
    expect(result['font-size']).toBe('24px');
  });

  it('returns empty map for non-matching rule', () => {
    const result = getEmailStyleMap(emptyStyleGraph(), 'core/heading', 'self', {});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles labeled rules', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [
        { blockType: 'core/card', target: 'self', properties: { padding: '16px' } },
        { blockType: 'core/card', target: 'self', label: 'hero', properties: { padding: '32px' } },
      ],
    };
    expect(getEmailStyleMap(graph, 'core/card', 'self', {})['padding']).toBe('16px');
    expect(getEmailStyleMap(graph, 'core/card', 'self', {}, 'hero')['padding']).toBe('32px');
  });
});

// ===== Legacy Brace Syntax =====

describe('parseStyleGraph: legacy brace syntax', () => {
  it('auto-detects and parses brace syntax', () => {
    const source = 'core/heading {\n  color: red\n  font-size: 24px\n}';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('core/heading');
    expect(graph.rules[0].properties['color']).toBe('red');
  });

  it('parses labeled brace syntax', () => {
    const source = 'core/card:hero {\n  padding: 16px\n}';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].label).toBe('hero');
  });
});

// ===== Edge Cases: Complex Pseudo-Selectors =====

describe('parseStyleGraph: complex pseudo-selectors', () => {
  it('parses ::before pseudo-element', () => {
    const source = 'core/card\n  ::before\n    content: ""';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('self::before');
  });

  it('parses ::after pseudo-element', () => {
    const source = 'core/card\n  ::after\n    content: ""';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('self::after');
  });

  it('parses :focus-within pseudo', () => {
    const source = 'core/card\n  :focus-within\n    outline: 2px solid blue';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('self:focus-within');
  });

  it('parses sub-element with ::before', () => {
    const source = 'core/card\n  .img::before\n    content: ""';
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].target).toBe('img::before');
  });

  it('round-trips ::before through serialize and parse', () => {
    const source = 'core/card\n  ::before\n    content: ""';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].target).toBe('self::before');
  });

  it('round-trips .img::before through serialize and parse', () => {
    const source = 'core/card\n  .img::before\n    content: ""';
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(reparsed.rules[0].target).toBe('img::before');
  });
});

// ===== Edge Cases: Key Normalization =====

describe('parseStyleGraph: property key normalization', () => {
  it('normalizes camelCase to kebab-case', () => {
    const graph = parseStyleGraph('core/heading\n  fontSize: 24px');
    expect(graph.rules[0].properties).toHaveProperty('font-size');
    expect(graph.rules[0].properties['font-size']).toBe('24px');
  });

  it('preserves kebab-case keys', () => {
    const graph = parseStyleGraph('core/heading\n  font-size: 24px');
    expect(graph.rules[0].properties).toHaveProperty('font-size');
  });

  it('mergeRule stores key as-is (no normalization)', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'fontSize', '24px');
    // mergeRule does NOT normalize keys
    expect(graph.rules[0].properties).toHaveProperty('fontSize');
    expect(graph.rules[0].properties).not.toHaveProperty('font-size');
  });

  it('getStyleValue uses exact key match', () => {
    const graph = mergeRule(emptyStyleGraph(), 'core/heading', 'self', 'fontSize', '24px');
    // Works with the same key
    expect(getStyleValue(graph, 'core/heading', 'self', 'fontSize')).toBe('24px');
    // Does NOT work with normalized key
    expect(getStyleValue(graph, 'core/heading', 'self', 'font-size')).toBeUndefined();
  });

  it('parse→merge→parse may lose properties due to key format mismatch', () => {
    // This documents the current behavior (not necessarily ideal)
    const source = 'core/heading\n  fontSize: 24px';
    const parsed = parseStyleGraph(source); // stores as 'font-size'
    const merged = mergeRule(parsed, 'core/heading', 'self', 'fontSize', '32px');
    // Now the rule has BOTH 'font-size' (from parse) AND 'fontSize' (from merge)
    expect(merged.rules[0].properties['font-size']).toBe('24px');
    expect(merged.rules[0].properties['fontSize']).toBe('32px');
  });
});

// ===== Edge Cases: Multiple Rules With Same Block =====

describe('parseStyleGraph: complex rule grouping', () => {
  it('handles self + multiple sub-elements under one block', () => {
    const source = [
      'core/card',
      '  padding: 16px',
      '  .img',
      '    object-fit: cover',
      '  .body',
      '    padding: 8px',
      '  .link',
      '    color: blue',
    ].join('\n');
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(4);
    expect(graph.rules.find(r => r.target === 'self')).toBeDefined();
    expect(graph.rules.find(r => r.target === 'img')).toBeDefined();
    expect(graph.rules.find(r => r.target === 'body')).toBeDefined();
    expect(graph.rules.find(r => r.target === 'link')).toBeDefined();
  });

  it('round-trips multiple sub-elements through serialize', () => {
    const source = [
      'core/card',
      '  padding: 16px',
      '  .img',
      '    object-fit: cover',
      '  .body',
      '    padding: 8px',
    ].join('\n');
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(3);
  });

  it('handles labeled block with self + sub-element + pseudo', () => {
    const source = [
      'core/card:hero',
      '  background-color: yellow',
      '  .img',
      '    border-radius: 8px',
      '  :hover',
      '    opacity: 0.9',
    ].join('\n');
    const graph = parseStyleGraph(source);
    expect(graph.rules).toHaveLength(3);
    // All rules should have the label
    for (const rule of graph.rules) {
      expect(rule.label).toBe('hero');
    }
    expect(graph.rules.find(r => r.target === 'self')).toBeDefined();
    expect(graph.rules.find(r => r.target === 'img')).toBeDefined();
    expect(graph.rules.find(r => r.target === 'self:hover')).toBeDefined();
  });

  it('serializes labeled block with sub-elements under one selector', () => {
    const source = [
      'core/card:hero',
      '  background-color: yellow',
      '  .img',
      '    border-radius: 8px',
    ].join('\n');
    const graph = parseStyleGraph(source);
    const serialized = serializeStyleGraph(graph);
    // Should only have one "core/card:hero" selector
    const occurrences = serialized.split('core/card:hero').length - 1;
    expect(occurrences).toBe(1);
  });

  it('compiles labeled block with sub-elements correctly', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [
        { blockType: 'core/card', target: 'self', label: 'hero', properties: { background: 'yellow' } },
        { blockType: 'core/card', target: 'img', label: 'hero', properties: { 'border-radius': '8px' } },
      ],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.mkly-core-card--hero');
    expect(css).toContain('.mkly-core-card--hero__img');
  });
});

// ===== Edge Cases: Raw CSS Selectors =====

describe('parseStyleGraph: raw CSS selectors', () => {
  it('parses .custom-class selector', () => {
    const graph = parseStyleGraph('.my-class\n  color: red');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('__raw');
    expect(graph.rules[0].target).toBe('.my-class');
  });

  it('parses #id selector', () => {
    const graph = parseStyleGraph('#my-id\n  display: none');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].blockType).toBe('__raw');
    expect(graph.rules[0].target).toBe('#my-id');
  });

  it('compiles raw selector as-is', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: '__raw', target: '.my-class', properties: { color: 'red' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).toContain('.my-class');
    expect(css).toContain('color: red;');
  });

  it('does NOT propagate inherited properties for raw selectors', () => {
    const graph: StyleGraph = {
      variables: [],
      rules: [{ blockType: '__raw', target: '.my-class', properties: { color: 'red' } }],
    };
    const css = compileStyleGraphToCSS(graph);
    expect(css).not.toContain(':is(');
  });
});

// ===== Edge Cases: Mixed Indentation =====

describe('parseStyleGraph: mixed indentation', () => {
  it('handles tab-indented properties', () => {
    const graph = parseStyleGraph('core/heading\n\tcolor: red\n\tfont-size: 16px');
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].properties).toEqual({ color: 'red', 'font-size': '16px' });
  });

  it('handles tab-indented sub-element properties in space-indented block', () => {
    const graph = parseStyleGraph('core/card\n  padding: 8px\n  .img\n\tobject-fit: cover');
    expect(graph.rules).toHaveLength(2);
    const selfRule = graph.rules.find(r => r.target === 'self');
    const imgRule = graph.rules.find(r => r.target === 'img');
    expect(selfRule?.properties).toEqual({ padding: '8px' });
    expect(imgRule?.properties).toEqual({ 'object-fit': 'cover' });
  });

  it('handles 4-space indentation', () => {
    const graph = parseStyleGraph('core/card\n    padding: 8px\n    .img\n        object-fit: cover');
    expect(graph.rules).toHaveLength(2);
    expect(graph.rules[0].target).toBe('self');
    expect(graph.rules[1].target).toBe('img');
  });

  it('resets to self after tab-indented sub-element section', () => {
    const graph = parseStyleGraph('core/card\n\t.img\n\t\tobject-fit: cover\n\tpadding: 8px');
    expect(graph.rules).toHaveLength(2);
    const imgRule = graph.rules.find(r => r.target === 'img');
    const selfRule = graph.rules.find(r => r.target === 'self');
    expect(imgRule?.properties).toEqual({ 'object-fit': 'cover' });
    expect(selfRule?.properties).toEqual({ padding: '8px' });
  });

  it('serializes tab-indented input as 2-space (canonical form)', () => {
    const graph = parseStyleGraph('core/heading\n\tcolor: red');
    const serialized = serializeStyleGraph(graph);
    expect(serialized).toContain('  color: red');
    expect(serialized).not.toContain('\t');
  });
});

// ===== Stress Tests =====

describe('style graph: stress tests', () => {
  it('handles 20+ rules without corruption', () => {
    let graph = emptyStyleGraph();
    for (let i = 0; i < 20; i++) {
      graph = mergeRule(graph, `core/block${i}`, 'self', 'padding', `${i}px`);
    }
    expect(graph.rules).toHaveLength(20);
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(20);
  });

  it('handles rapid add/remove cycles', () => {
    let graph = emptyStyleGraph();
    // Add 10 properties
    for (let i = 0; i < 10; i++) {
      graph = mergeRule(graph, 'core/heading', 'self', `prop${i}`, `val${i}`);
    }
    expect(graph.rules).toHaveLength(1);
    expect(Object.keys(graph.rules[0].properties)).toHaveLength(10);

    // Remove first 5
    for (let i = 0; i < 5; i++) {
      graph = removeRule(graph, 'core/heading', 'self', `prop${i}`);
    }
    expect(graph.rules).toHaveLength(1);
    expect(Object.keys(graph.rules[0].properties)).toHaveLength(5);

    // Round-trip
    const serialized = serializeStyleGraph(graph);
    const reparsed = parseStyleGraph(serialized);
    expect(reparsed.rules).toHaveLength(1);
    expect(Object.keys(reparsed.rules[0].properties)).toHaveLength(5);
  });

  it('merges 5 style graphs without losing rules', () => {
    const graphs: StyleGraph[] = [];
    for (let i = 0; i < 5; i++) {
      graphs.push({
        variables: [{ name: `var${i}`, value: `val${i}` }],
        rules: [{ blockType: `core/block${i}`, target: 'self', properties: { color: `color${i}` } }],
      });
    }
    const merged = mergeStyleGraphs(...graphs);
    expect(merged.variables).toHaveLength(5);
    expect(merged.rules).toHaveLength(5);
  });
});
