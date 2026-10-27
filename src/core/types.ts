export type ShapeType = 'square' | 'rectangle' | 'circle' | 'triangle';

export interface Container {
  width: number;
  height: number;
}

export interface ShapeTemplate {
  id: string;
  type: ShapeType;
  params: Record<string, number>;
  color: string;
  enabled: boolean;
  weight?: number;
  name?: string;
}

export interface PlacedShape {
  id: string;
  templateId: string;
  x: number;
  y: number;
  rotation: number; // in degrees, default 0
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleDefinition {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export interface PolygonDefinition {
  type: 'polygon';
  vertices: Point[]; // counter-clockwise or clockwise convex polygon vertices
}

export type ConcreteGeometry = CircleDefinition | PolygonDefinition;

export interface ValidationResult {
  isValid: boolean;
  overlaps: [string, string][];
  overflows: string[];
}

export interface ComputeStats {
  totalCount: number;
  countPerTemplate: Record<string, number>;
  containerArea: number;
  usedArea: number;
  utilization: number;
  algorithm: string;
  computeTimeMs: number;
  seed?: number | string;
}
