import { describe, expect, it } from 'vitest';
import { checkCollision } from '../src/core/collision';
import { getGeometry } from '../src/core/geometry';
import type { PlacedShape, ShapeTemplate } from '../src/core/types';

describe('Collision Detection (Core)', () => {
  const squareTemplate: ShapeTemplate = {
    id: 'sq',
    type: 'square',
    params: { size: 50 },
    color: '#ff0000',
    enabled: true,
  };

  const rectTemplate: ShapeTemplate = {
    id: 'rect',
    type: 'rectangle',
    params: { width: 80, height: 40 },
    color: '#00ff00',
    enabled: true,
  };

  const circleTemplate: ShapeTemplate = {
    id: 'circ',
    type: 'circle',
    params: { radius: 25 },
    color: '#0000ff',
    enabled: true,
  };

  const triangleTemplate: ShapeTemplate = {
    id: 'tri',
    type: 'triangle',
    params: { base: 60, height: 50 },
    color: '#ffff00',
    enabled: true,
  };

  describe('Rect vs Rect', () => {
    it('detects overlapping rectangles', () => {
      const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'sq', x: 25, y: 25, rotation: 0 };
      const geo1 = getGeometry(squareTemplate, p1);
      const geo2 = getGeometry(squareTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(true);
    });

    it('allows touching rectangles (zero gap on edge)', () => {
      const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'sq', x: 50, y: 0, rotation: 0 };
      const geo1 = getGeometry(squareTemplate, p1);
      const geo2 = getGeometry(squareTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });

    it('returns false for clearly separated rectangles', () => {
      const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'sq', x: 100, y: 100, rotation: 0 };
      const geo1 = getGeometry(squareTemplate, p1);
      const geo2 = getGeometry(squareTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });
  });

  describe('Circle vs Circle', () => {
    it('detects overlapping circles', () => {
      const p1: PlacedShape = { id: '1', templateId: 'circ', x: 0, y: 0, rotation: 0 }; // r=25, center (25, 25)
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 30, y: 0, rotation: 0 }; // center (55, 25), dist = 30 < 50
      const geo1 = getGeometry(circleTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(true);
    });

    it('allows touching circles (dist == r1 + r2)', () => {
      const p1: PlacedShape = { id: '1', templateId: 'circ', x: 0, y: 0, rotation: 0 }; // center (25, 25)
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 50, y: 0, rotation: 0 }; // center (75, 25), dist = 50 == 25+25
      const geo1 = getGeometry(circleTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });

    it('returns false for separated circles', () => {
      const p1: PlacedShape = { id: '1', templateId: 'circ', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 60, y: 0, rotation: 0 };
      const geo1 = getGeometry(circleTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });
  });

  describe('Circle vs Rect', () => {
    it('detects circle overlapping rectangle', () => {
      const p1: PlacedShape = { id: '1', templateId: 'rect', x: 0, y: 0, rotation: 0 }; // 80x40
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 60, y: 10, rotation: 0 }; // r=25, center (85, 35)
      const geo1 = getGeometry(rectTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(true);
      expect(checkCollision(geo2, geo1)).toBe(true);
    });

    it('allows circle touching rectangle edge', () => {
      const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 }; // 50x50, right edge at x=50
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 50, y: 0, rotation: 0 }; // r=25, center at (75, 25). Closest point on square is (50, 25). dist = 25 == radius!
      const geo1 = getGeometry(squareTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
      expect(checkCollision(geo2, geo1)).toBe(false);
    });

    it('returns false for separated circle and rectangle', () => {
      const p1: PlacedShape = { id: '1', templateId: 'sq', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 100, y: 0, rotation: 0 };
      const geo1 = getGeometry(squareTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });
  });

  describe('Triangle vs Polygon / SAT', () => {
    it('detects triangle overlapping square', () => {
      const p1: PlacedShape = { id: '1', templateId: 'tri', x: 10, y: 10, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'sq', x: 20, y: 20, rotation: 0 };
      const geo1 = getGeometry(triangleTemplate, p1);
      const geo2 = getGeometry(squareTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(true);
    });

    it('allows two interlocking triangles touching without overlap', () => {
      // Upright triangle: base 60, height 50. Vertices: (0, 50), (60, 50), (30, 0)
      // Rotated 180 triangle: apex down at (30, 50), base at y=0 from (0,0) to (60,0).
      // If placed side-by-side shifted, they can touch along the slanted edge.
      const p1: PlacedShape = { id: '1', templateId: 'tri', x: 0, y: 0, rotation: 0 };
      const p2: PlacedShape = { id: '2', templateId: 'tri', x: 60, y: 0, rotation: 0 };
      const geo1 = getGeometry(triangleTemplate, p1);
      const geo2 = getGeometry(triangleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(false);
    });

    it('detects circle vs triangle collision', () => {
      const p1: PlacedShape = { id: '1', templateId: 'tri', x: 0, y: 0, rotation: 0 };
      // Triangle vertices: (0, 50), (60, 50), (30, 0)
      // Circle at center (30, 30), r=15 is inside the triangle
      const p2: PlacedShape = { id: '2', templateId: 'circ', x: 15, y: 15, rotation: 0 };
      const geo1 = getGeometry(triangleTemplate, p1);
      const geo2 = getGeometry(circleTemplate, p2);
      expect(checkCollision(geo1, geo2)).toBe(true);
      expect(checkCollision(geo2, geo1)).toBe(true);
    });
  });
});
