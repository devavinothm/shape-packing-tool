import { isInsideContainer } from './collision';
import { getGeometry, getTemplateArea, getTemplateDimensions } from './geometry';
import { createMulberry32, hashSeed, randomRange, weightedPick } from './random';
import { SpatialGrid } from './spatialGrid';
import type { Container, PlacedShape, ShapeTemplate } from './types';

export interface RandomFillOptions {
  seed?: number | string;
  maxAttempts?: number; // default 50000
  failureThreshold?: number; // default 300
  keepExisting?: boolean; // default false
  fillGaps?: boolean; // default true
  gapGridStep?: number; // default 5
}

export function randomFill(
  container: Container,
  templates: ShapeTemplate[],
  existingShapes: PlacedShape[] = [],
  options: RandomFillOptions = {}
): PlacedShape[] {
  const enabledTemplates = templates.filter((t) => t.enabled);
  if (enabledTemplates.length === 0) {
    return options.keepExisting ? [...existingShapes] : [];
  }

  const {
    seed = 123456,
    maxAttempts = 50000,
    failureThreshold = 300,
    keepExisting = false,
    fillGaps = true,
    gapGridStep = 5,
  } = options;

  const rng = createMulberry32(hashSeed(seed));

  // Determine spatial grid cell size based on largest template
  let maxDim = 32;
  for (const t of enabledTemplates) {
    const { width, height } = getTemplateDimensions(t);
    maxDim = Math.max(maxDim, width, height);
  }

  const spatialGrid = new SpatialGrid(Math.max(32, Math.min(256, maxDim)));
  const placed: PlacedShape[] = [];

  const templateMap = new Map<string, ShapeTemplate>();
  for (const t of templates) {
    templateMap.set(t.id, t);
  }

  // Insert existing shapes if keeping them
  if (keepExisting && existingShapes.length > 0) {
    for (const shape of existingShapes) {
      const t = templateMap.get(shape.templateId);
      if (t) {
        spatialGrid.insert(shape, t);
        placed.push(shape);
      }
    }
  }

  const weights = enabledTemplates.map((t) => t.weight ?? 1);

  let consecutiveFailures = 0;
  let attempts = 0;
  let shapeCounter = placed.length + 1;

  while (consecutiveFailures < failureThreshold && attempts < maxAttempts) {
    attempts++;
    const template = weightedPick(enabledTemplates, weights, rng);
    const { width, height } = getTemplateDimensions(template);

    if (width > container.width || height > container.height) {
      consecutiveFailures++;
      continue;
    }

    const maxX = container.width - width;
    const maxY = container.height - height;
    const x = randomRange(rng, 0, maxX);
    const y = randomRange(rng, 0, maxY);

    const candidate: PlacedShape = {
      id: `rf-${shapeCounter}`,
      templateId: template.id,
      x,
      y,
      rotation: 0,
    };

    const geo = getGeometry(template, candidate);

    if (isInsideContainer(geo, container) && !spatialGrid.hasCollision(candidate, template)) {
      spatialGrid.insert(candidate, template);
      placed.push(candidate);
      shapeCounter++;
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
    }
  }

  // Gap-fill pass with smallest template if requested
  if (fillGaps && enabledTemplates.length > 0) {
    // Find smallest enabled template by area
    let smallestTemplate = enabledTemplates[0];
    let minArea = getTemplateArea(smallestTemplate);
    for (const t of enabledTemplates) {
      const area = getTemplateArea(t);
      if (area < minArea) {
        minArea = area;
        smallestTemplate = t;
      }
    }

    const { width: sW, height: sH } = getTemplateDimensions(smallestTemplate);
    if (sW <= container.width && sH <= container.height) {
      const step = Math.max(2, gapGridStep);
      for (let y = 0; y <= container.height - sH; y += step) {
        for (let x = 0; x <= container.width - sW; x += step) {
          const candidate: PlacedShape = {
            id: `gap-${shapeCounter}`,
            templateId: smallestTemplate.id,
            x,
            y,
            rotation: 0,
          };
          const geo = getGeometry(smallestTemplate, candidate);
          if (isInsideContainer(geo, container) && !spatialGrid.hasCollision(candidate, smallestTemplate)) {
            spatialGrid.insert(candidate, smallestTemplate);
            placed.push(candidate);
            shapeCounter++;
          }
        }
      }
    }
  }

  return placed;
}
