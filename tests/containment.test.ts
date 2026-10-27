import { describe, expect, it } from 'vitest';
import { isInsideContainer } from '../src/core/collision';
import { getGeometry } from '../src/core/geometry';
import type { Container, PlacedShape, ShapeTemplate } from '../src/core/types';

describe('Containment Tests (Core)', () => {
  const container: Container = { width: 400, height: 300 };

  const squareTemplate: ShapeTemplate = {
    id: 'sq',
    type: 'square',
    params: { size: 50 },
    color: '#ff0000',
    enabled: true,
  };

  const circleTemplate: ShapeTemplate = {
    id: 'circ',
    type: 'circle',
    params: { radius: 25 },
    color: '#0000ff',
    enabled: true,
  };

  it('validates shape completely inside container', () => {
    const p: PlacedShape = { id: '1', templateId: 'sq', x: 50, y: 50, rotation: 0 };
    const geo = getGeometry(squareTemplate, p);
    expect(isInsideContainer(geo, container)).toBe(true);
  });

  it('validates shape exactly touching container edge (0 and boundary)', () => {
    // Exactly at top-left corner (0, 0)
    const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 };
    const geo1 = getGeometry(squareTemplate, p1);
    expect(isInsideContainer(geo1, container)).toBe(true);

    // Exactly touching bottom-right boundary (400 - 50 = 350, 300 - 50 = 250)
    const p2: PlacedShape = { id: '2', templateId: 'sq', x: 350, y: 250, rotation: 0 };
    const geo2 = getGeometry(squareTemplate, p2);
    expect(isInsideContainer(geo2, container)).toBe(true);
  });

  it('rejects shape exceeding boundary by 0.01', () => {
    // 0.01 past left edge
    const p1: PlacedShape = { id: '1', templateId: 'sq', x: -0.01, y: 0, rotation: 0 };
    const geo1 = getGeometry(squareTemplate, p1);
    expect(isInsideContainer(geo1, container)).toBe(false);

    // 0.01 past right edge
    const p2: PlacedShape = { id: '2', templateId: 'sq', x: 350.01, y: 0, rotation: 0 };
    const geo2 = getGeometry(squareTemplate, p2);
    expect(isInsideContainer(geo2, container)).toBe(false);
  });

  it('handles circle containment on boundaries', () => {
    // Circle of radius 25 at x=0, y=0 touches (0, 25) and (25, 0)
    const p1: PlacedShape = { id: '1', templateId: 'circ', x: 0, y: 0, rotation: 0 };
    const geo1 = getGeometry(circleTemplate, p1);
    expect(isInsideContainer(geo1, container)).toBe(true);

    // Circle exceeding right boundary by 0.05
    const p2: PlacedShape = { id: '2', templateId: 'circ', x: 350.05, y: 0, rotation: 0 };
    const geo2 = getGeometry(circleTemplate, p2);
    expect(isInsideContainer(geo2, container)).toBe(false);
  });
});
