import { describe, expect, it } from 'vitest';
import { computeSingleShapeMax } from '../src/core/singleShapeMax';
import type { Container, ShapeTemplate } from '../src/core/types';
import { validateLayout } from '../src/core/validate';

describe('Single Shape Max Strategies', () => {
  it('returns exactly 100 for 10x10 squares in 100x100 box', () => {
    const container: Container = { width: 100, height: 100 };
    const template: ShapeTemplate = {
      id: 'sq10',
      type: 'square',
      params: { size: 10 },
      color: '#ff0000',
      enabled: true,
    };

    const result = computeSingleShapeMax(container, template);
    expect(result.count).toBe(100);
    expect(result.shapes).toHaveLength(100);

    const validation = validateLayout(container, { [template.id]: template }, result.shapes);
    expect(validation.isValid).toBe(true);
  });

  it('yields at least 100 circles for radius 5 in 100x100 box and hexagonal >= square', () => {
    const container: Container = { width: 100, height: 100 };
    const template: ShapeTemplate = {
      id: 'circ5',
      type: 'circle',
      params: { radius: 5 },
      color: '#0000ff',
      enabled: true,
    };

    const result = computeSingleShapeMax(container, template);
    // Square grid gives (100/10) * (100/10) = 100. Hexagonal packing gives >= 100 (often ~105-110).
    expect(result.count).toBeGreaterThanOrEqual(100);

    const validation = validateLayout(container, { [template.id]: template }, result.shapes);
    expect(validation.isValid).toBe(true);
  });

  it('packs triangles with interlocking alternating rows exceeding baseline upright grid', () => {
    const container: Container = { width: 300, height: 200 };
    const template: ShapeTemplate = {
      id: 'tri',
      type: 'triangle',
      params: { base: 60, height: 50 },
      color: '#00ff00',
      enabled: true,
    };

    const result = computeSingleShapeMax(container, template);
    // Baseline upright grid: floor(300/60) * floor(200/50) = 5 * 4 = 20
    // Interlocking rows: 9 per row * 4 rows = 36!
    expect(result.count).toBeGreaterThan(20);

    const validation = validateLayout(container, { [template.id]: template }, result.shapes);
    expect(validation.isValid).toBe(true);
    expect(validation.overlaps).toHaveLength(0);
    expect(validation.overflows).toHaveLength(0);
  });
});
