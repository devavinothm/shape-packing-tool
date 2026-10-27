import type {
  BoundingBox,
  CircleDefinition,
  ConcreteGeometry,
  Container,
  Point,
  PolygonDefinition,
} from './types';

export const EPSILON = 1e-6;

/**
 * Checks whether an axis-aligned bounding box overlaps another, with epsilon tolerance.
 * Touching edges are allowed (not considered an overlap).
 */
export function aabbOverlap(a: BoundingBox, b: BoundingBox, eps = EPSILON): boolean {
  if (a.x + a.width <= b.x + eps) return false;
  if (b.x + b.width <= a.x + eps) return false;
  if (a.y + a.height <= b.y + eps) return false;
  if (b.y + b.height <= a.y + eps) return false;
  return true;
}

/**
 * Checks whether a geometry is completely contained inside the container.
 * Touching the boundaries is allowed.
 */
export function isInsideContainer(
  geo: ConcreteGeometry,
  container: Container,
  eps = EPSILON
): boolean {
  if (geo.type === 'circle') {
    return (
      geo.cx >= geo.r - eps &&
      geo.cx <= container.width - geo.r + eps &&
      geo.cy >= geo.r - eps &&
      geo.cy <= container.height - geo.r + eps
    );
  }

  // Polygon
  for (const v of geo.vertices) {
    if (
      v.x < -eps ||
      v.x > container.width + eps ||
      v.y < -eps ||
      v.y > container.height + eps
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Circle vs Circle collision.
 * Touching is allowed.
 */
function circleVsCircle(c1: CircleDefinition, c2: CircleDefinition, eps = EPSILON): boolean {
  const dx = c1.cx - c2.cx;
  const dy = c1.cy - c2.cy;
  const distSq = dx * dx + dy * dy;
  const minValidDist = c1.r + c2.r - eps;
  return distSq < minValidDist * minValidDist;
}

/**
 * Computes closest point on a line segment [p1, p2] to point p.
 */
function closestPointOnSegment(p: Point, p1: Point, p2: Point): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return p1;

  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lenSq));
  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
  };
}

/**
 * Tests if point p is strictly inside a convex polygon (cross products have the same sign).
 */
function isPointInConvexPolygon(p: Point, poly: PolygonDefinition, eps = EPSILON): boolean {
  const verts = poly.vertices;
  const n = verts.length;
  if (n < 3) return false;

  let positive = false;
  let negative = false;

  for (let i = 0; i < n; i++) {
    const p1 = verts[i];
    const p2 = verts[(i + 1) % n];

    // Cross product of edge (p2 - p1) with vector (p - p1)
    const cross = (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);

    if (cross > eps) positive = true;
    if (cross < -eps) negative = true;

    if (positive && negative) return false;
  }

  return true;
}

/**
 * Circle vs Convex Polygon collision.
 * Touching is allowed.
 */
function circleVsPolygon(
  circle: CircleDefinition,
  poly: PolygonDefinition,
  eps = EPSILON
): boolean {
  const cp: Point = { x: circle.cx, y: circle.cy };

  // 1. If center of circle is inside polygon, they overlap
  if (isPointInConvexPolygon(cp, poly, eps)) {
    return true;
  }

  // 2. Check distance from circle center to each polygon edge
  const verts = poly.vertices;
  const n = verts.length;
  const rLimit = circle.r - eps;
  const rLimitSq = rLimit * rLimit;

  for (let i = 0; i < n; i++) {
    const p1 = verts[i];
    const p2 = verts[(i + 1) % n];
    const closest = closestPointOnSegment(cp, p1, p2);
    const dx = cp.x - closest.x;
    const dy = cp.y - closest.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < rLimitSq) {
      return true;
    }
  }

  return false;
}

/**
 * Separating Axis Theorem (SAT) for two convex polygons.
 * Touching edges is allowed (separated).
 */
function polygonVsPolygon(
  polyA: PolygonDefinition,
  polyB: PolygonDefinition,
  eps = EPSILON
): boolean {
  const polygons = [polyA, polyB];

  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    const verts = poly.vertices;
    const n = verts.length;

    for (let j = 0; j < n; j++) {
      const p1 = verts[j];
      const p2 = verts[(j + 1) % n];

      // Normal to edge (p2 - p1)
      const edgeX = p2.x - p1.x;
      const edgeY = p2.y - p1.y;
      const normalX = -edgeY;
      const normalY = edgeX;

      // Normalize normal vector
      const len = Math.hypot(normalX, normalY);
      if (len === 0) continue;
      const axisX = normalX / len;
      const axisY = normalY / len;

      // Project polyA onto axis
      let minA = Infinity;
      let maxA = -Infinity;
      for (const v of polyA.vertices) {
        const proj = v.x * axisX + v.y * axisY;
        if (proj < minA) minA = proj;
        if (proj > maxA) maxA = proj;
      }

      // Project polyB onto axis
      let minB = Infinity;
      let maxB = -Infinity;
      for (const v of polyB.vertices) {
        const proj = v.x * axisX + v.y * axisY;
        if (proj < minB) minB = proj;
        if (proj > maxB) maxB = proj;
      }

      // If separated by a gap (or touching with epsilon), we found a separating axis
      if (maxA <= minB + eps || maxB <= minA + eps) {
        return false;
      }
    }
  }

  // No separating axis found -> polygons overlap
  return true;
}

/**
 * Universal collision detection between any two concrete geometries.
 * Returns true if they overlap; false if they do not overlap (touching is permitted).
 */
export function checkCollision(
  geoA: ConcreteGeometry,
  geoB: ConcreteGeometry,
  eps = EPSILON
): boolean {
  if (geoA.type === 'circle' && geoB.type === 'circle') {
    return circleVsCircle(geoA, geoB, eps);
  }

  if (geoA.type === 'circle' && geoB.type === 'polygon') {
    return circleVsPolygon(geoA, geoB, eps);
  }

  if (geoA.type === 'polygon' && geoB.type === 'circle') {
    return circleVsPolygon(geoB, geoA, eps);
  }

  if (geoA.type === 'polygon' && geoB.type === 'polygon') {
    return polygonVsPolygon(geoA, geoB, eps);
  }

  return false;
}
