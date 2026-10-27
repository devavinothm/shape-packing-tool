import { aabbOverlap, checkCollision, EPSILON, isInsideContainer } from './collision';
import { getBoundingBox, getGeometry } from './geometry';
import type { Container, PlacedShape, ShapeTemplate, ValidationResult } from './types';

/**
 * Validates an entire layout of placed shapes against the container and each other.
 * Reports all overlaps and out-of-bounds overflow shapes.
 */
export function validateLayout(
  container: Container,
  templates: Map<string, ShapeTemplate> | Record<string, ShapeTemplate>,
  placedShapes: PlacedShape[],
  eps = EPSILON
): ValidationResult {
  const getTemplate = (id: string): ShapeTemplate | undefined => {
    if (templates instanceof Map) {
      return templates.get(id);
    }
    return templates[id];
  };

  const overflows: string[] = [];
  const overlaps: [string, string][] = [];

  // Pre-calculate boxes and geometries
  const shapeData = placedShapes.map((shape) => {
    const template = getTemplate(shape.templateId);
    if (!template) {
      return null;
    }
    const box = getBoundingBox(template, shape);
    const geo = getGeometry(template, shape);
    return { shape, template, box, geo };
  });

  // 1. Check container containment
  for (const item of shapeData) {
    if (!item) continue;
    if (!isInsideContainer(item.geo, container, eps)) {
      overflows.push(item.shape.id);
    }
  }

  // 2. Check pairwise collisions with AABB pre-filtering
  const n = shapeData.length;
  for (let i = 0; i < n; i++) {
    const a = shapeData[i];
    if (!a) continue;

    for (let j = i + 1; j < n; j++) {
      const b = shapeData[j];
      if (!b) continue;

      // AABB pre-check
      if (!aabbOverlap(a.box, b.box, eps)) {
        continue;
      }

      // Exact collision check
      if (checkCollision(a.geo, b.geo, eps)) {
        overlaps.push([a.shape.id, b.shape.id]);
      }
    }
  }

  return {
    isValid: overflows.length === 0 && overlaps.length === 0,
    overlaps,
    overflows,
  };
}
