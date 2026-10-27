import type {
  BoundingBox,
  ConcreteGeometry,
  PlacedShape,
  Point,
  ShapeTemplate,
} from './types';

/**
 * Returns the width and height of the bounding box of a shape template.
 */
export function getTemplateDimensions(template: ShapeTemplate): { width: number; height: number } {
  switch (template.type) {
    case 'square': {
      const size = template.params.size ?? 50;
      return { width: size, height: size };
    }
    case 'rectangle': {
      const width = template.params.width ?? 80;
      const height = template.params.height ?? 40;
      return { width, height };
    }
    case 'circle': {
      const radius = template.params.radius ?? 25;
      return { width: radius * 2, height: radius * 2 };
    }
    case 'triangle': {
      const base = template.params.base ?? 60;
      const height = template.params.height ?? 50;
      return { width: base, height };
    }
    default:
      return { width: 50, height: 50 };
  }
}

/**
 * Returns the exact mathematical area of a shape template.
 */
export function getTemplateArea(template: ShapeTemplate): number {
  switch (template.type) {
    case 'square': {
      const size = template.params.size ?? 50;
      return size * size;
    }
    case 'rectangle': {
      const width = template.params.width ?? 80;
      const height = template.params.height ?? 40;
      return width * height;
    }
    case 'circle': {
      const radius = template.params.radius ?? 25;
      return Math.PI * radius * radius;
    }
    case 'triangle': {
      const base = template.params.base ?? 60;
      const height = template.params.height ?? 50;
      return 0.5 * base * height;
    }
    default:
      return 0;
  }
}

/**
 * Returns the axis-aligned bounding box (AABB) of a placed shape instance.
 */
export function getBoundingBox(template: ShapeTemplate, placed: PlacedShape): BoundingBox {
  const { width, height } = getTemplateDimensions(template);
  return {
    x: placed.x,
    y: placed.y,
    width,
    height,
  };
}

/**
 * Rotates a point around a given center point by an angle in degrees.
 */
function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  if (angleDeg === 0) return p;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

/**
 * Returns the concrete mathematical representation of the placed shape (circle or convex polygon).
 */
export function getGeometry(template: ShapeTemplate, placed: PlacedShape): ConcreteGeometry {
  const { x, y, rotation = 0 } = placed;
  const { width, height } = getTemplateDimensions(template);

  if (template.type === 'circle') {
    const r = (template.params.radius ?? 25);
    return {
      type: 'circle',
      cx: x + r,
      cy: y + r,
      r,
    };
  }

  let vertices: Point[] = [];

  if (template.type === 'square' || template.type === 'rectangle') {
    vertices = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  } else if (template.type === 'triangle') {
    // Isosceles triangle: relative coordinates (0, h), (b, h), (b/2, 0)
    // Vertices in order: bottom-left, bottom-right, top-apex
    vertices = [
      { x, y: y + height },
      { x: x + width, y: y + height },
      { x: x + width / 2, y },
    ];
  }

  if (rotation !== 0) {
    const center: Point = { x: x + width / 2, y: y + height / 2 };
    vertices = vertices.map((v) => rotatePoint(v, center, rotation));
  }

  return {
    type: 'polygon',
    vertices,
  };
}
