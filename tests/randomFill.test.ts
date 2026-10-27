import { describe, expect, it } from 'vitest';
import { randomFill } from '../src/core/randomFill';
import type { Container, ShapeTemplate } from '../src/core/types';
import { validateLayout } from '../src/core/validate';

describe('Random Fill Algorithm', () => {
  const container: Container = { width: 400, height: 300 };

  const templates: ShapeTemplate[] = [
    { id: 'sq', type: 'square', params: { size: 40 }, color: '#ff0000', enabled: true },
    { id: 'rect', type: 'rectangle', params: { width: 60, height: 30 }, color: '#00ff00', enabled: true },
    { id: 'circ', type: 'circle', params: { radius: 20 }, color: '#0000ff', enabled: true },
    { id: 'tri', type: 'triangle', params: { base: 50, height: 40 }, color: '#ffff00', enabled: true },
  ];

  const templateMap: Record<string, ShapeTemplate> = {};
  for (const t of templates) templateMap[t.id] = t;

  it('produces 100% valid non-overlapping, in-bounds layouts', () => {
    const placed = randomFill(container, templates, [], { seed: 99999, failureThreshold: 200 });
    expect(placed.length).toBeGreaterThan(0);

    const validation = validateLayout(container, templateMap, placed);
    expect(validation.isValid).toBe(true);
    expect(validation.overlaps).toHaveLength(0);
    expect(validation.overflows).toHaveLength(0);
  });

  it('is completely deterministic with the same seed', () => {
    const run1 = randomFill(container, templates, [], { seed: 424242, failureThreshold: 100 });
    const run2 = randomFill(container, templates, [], { seed: 424242, failureThreshold: 100 });

    expect(run1.length).toBe(run2.length);
    for (let i = 0; i < run1.length; i++) {
      expect(run1[i].templateId).toBe(run2[i].templateId);
      expect(run1[i].x).toBeCloseTo(run2[i].x, 5);
      expect(run1[i].y).toBeCloseTo(run2[i].y, 5);
      expect(run1[i].rotation).toBe(run2[i].rotation);
    }
  });

  it('produces different layouts with different seeds', () => {
    const run1 = randomFill(container, templates, [], { seed: 111, failureThreshold: 50 });
    const run2 = randomFill(container, templates, [], { seed: 222, failureThreshold: 50 });

    const diff = run1[0].x !== run2[0].x || run1[0].y !== run2[0].y || run1[0].templateId !== run2[0].templateId;
    expect(diff).toBe(true);
  });
});
