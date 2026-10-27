import { describe, expect, it } from 'vitest';
import type { Container, PlacedShape, ShapeTemplate } from '../src/core/types';
import { validateLayout } from '../src/core/validate';

describe('validateLayout', () => {
  const container: Container = { width: 200, height: 200 };

  const templates: Record<string, ShapeTemplate> = {
    sq: {
      id: 'sq',
      type: 'square',
      params: { size: 50 },
      color: '#ff0000',
      enabled: true,
    },
    circ: {
      id: 'circ',
      type: 'circle',
      params: { radius: 25 },
      color: '#0000ff',
      enabled: true,
    },
  };

  it('reports valid for valid non-overlapping layout', () => {
    const placed: PlacedShape[] = [
      { id: 's1', templateId: 'sq', x: 0, y: 0, rotation: 0 },
      { id: 's2', templateId: 'sq', x: 50, y: 0, rotation: 0 },
      { id: 'c1', templateId: 'circ', x: 100, y: 0, rotation: 0 },
    ];
    const result = validateLayout(container, templates, placed);
    expect(result.isValid).toBe(true);
    expect(result.overlaps).toHaveLength(0);
    expect(result.overflows).toHaveLength(0);
  });

  it('reports collision between overlapping shapes', () => {
    const placed: PlacedShape[] = [
      { id: 's1', templateId: 'sq', x: 0, y: 0, rotation: 0 },
      { id: 's2', templateId: 'sq', x: 20, y: 20, rotation: 0 }, // overlaps s1
    ];
    const result = validateLayout(container, templates, placed);
    expect(result.isValid).toBe(false);
    expect(result.overlaps).toEqual([['s1', 's2']]);
  });

  it('reports overflow for shapes partially or fully out of bounds', () => {
    const placed: PlacedShape[] = [
      { id: 's1', templateId: 'sq', x: 180, y: 0, rotation: 0 }, // 180 + 50 = 230 > 200
    ];
    const result = validateLayout(container, templates, placed);
    expect(result.isValid).toBe(false);
    expect(result.overflows).toContain('s1');
  });
});
