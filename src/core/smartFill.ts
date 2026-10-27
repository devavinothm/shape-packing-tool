import { isInsideContainer } from './collision';
import { getGeometry, getTemplateArea, getTemplateDimensions } from './geometry';
import { createMulberry32, hashSeed } from './random';
import { SpatialGrid } from './spatialGrid';
import type { Container, PlacedShape, Point, ShapeTemplate } from './types';

export interface SmartFillOptions {
  seed?: number | string;
  timeLimitMs?: number; // default 1500ms
  keepExisting?: boolean; // default false
  fillGaps?: boolean; // default true
}

export function smartFill(
  container: Container,
  templates: ShapeTemplate[],
  existingShapes: PlacedShape[] = [],
  options: SmartFillOptions = {}
): PlacedShape[] {
  const enabledTemplates = templates.filter((t) => t.enabled);
  if (enabledTemplates.length === 0) {
    return options.keepExisting ? [...existingShapes] : [];
  }

  const {
    seed = 42,
    timeLimitMs = 1500,
    keepExisting = false,
    fillGaps = true,
  } = options;

  const rng = createMulberry32(hashSeed(seed));
  const startTime = Date.now();

  const templateMap = new Map<string, ShapeTemplate>();
  for (const t of templates) {
    templateMap.set(t.id, t);
  }

  // Calculate areas and sort descending
  const sortedTemplates = [...enabledTemplates].sort((a, b) => {
    return getTemplateArea(b) - getTemplateArea(a);
  });

  let bestLayout: PlacedShape[] = [];
  let bestCount = -1;
  let bestArea = -1;

  let iteration = 0;

  // Run iterations until time limit is reached (at least 1 iteration)
  while (iteration === 0 || Date.now() - startTime < timeLimitMs) {
    iteration++;

    // For iteration 0: strictly descending area
    // Subsequent iterations: shuffle order slightly using seeded RNG
    let iterationTemplates = [...sortedTemplates];
    if (iteration > 1) {
      for (let i = iterationTemplates.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [iterationTemplates[i], iterationTemplates[j]] = [iterationTemplates[j], iterationTemplates[i]];
      }
    }

    // Determine spatial grid cell size
    let maxDim = 32;
    for (const t of enabledTemplates) {
      const { width, height } = getTemplateDimensions(t);
      maxDim = Math.max(maxDim, width, height);
    }

    const spatialGrid = new SpatialGrid(Math.max(32, Math.min(256, maxDim)));
    const currentPlaced: PlacedShape[] = [];
    let shapeCounter = 1;

    // Insert existing shapes if keeping them
    if (keepExisting && existingShapes.length > 0) {
      for (const shape of existingShapes) {
        const t = templateMap.get(shape.templateId);
        if (t) {
          spatialGrid.insert(shape, t);
          currentPlaced.push(shape);
        }
      }
    }

    // Candidate positions: container corners and bottom-left / right edges of placed shapes
    const candidatePoints: Point[] = [{ x: 0, y: 0 }];

    const addPoint = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= container.width || y >= container.height) return;
      // Avoid exact duplicates
      for (const p of candidatePoints) {
        if (Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5) return;
      }
      candidatePoints.push({ x, y });
    };

    // Populate initial points from existing shapes
    for (const s of currentPlaced) {
      const t = templateMap.get(s.templateId);
      if (t) {
        const { width, height } = getTemplateDimensions(t);
        addPoint(s.x + width, s.y);
        addPoint(s.x, s.y + height);
        addPoint(s.x + width, s.y + height);
      }
    }

    // Greedy placement loop
    let addedAny = true;
    while (addedAny) {
      addedAny = false;

      // Sort candidate points Bottom-Left: first ascending Y, then ascending X
      candidatePoints.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 0.01) return a.y - b.y;
        return a.x - b.x;
      });

      // Try placing the highest-priority template that fits at the earliest candidate point
      pointLoop: for (let pIdx = 0; pIdx < candidatePoints.length; pIdx++) {
        const pt = candidatePoints[pIdx];

        for (const template of iterationTemplates) {
          const { width, height } = getTemplateDimensions(template);
          if (pt.x + width > container.width || pt.y + height > container.height) {
            continue;
          }

          const candidate: PlacedShape = {
            id: `sf-${iteration}-${shapeCounter}`,
            templateId: template.id,
            x: pt.x,
            y: pt.y,
            rotation: 0,
          };

          const geo = getGeometry(template, candidate);
          if (isInsideContainer(geo, container) && !spatialGrid.hasCollision(candidate, template)) {
            spatialGrid.insert(candidate, template);
            currentPlaced.push(candidate);
            shapeCounter++;
            addedAny = true;

            // Generate new candidate points from this placement
            addPoint(pt.x + width, pt.y);
            addPoint(pt.x, pt.y + height);
            addPoint(pt.x + width, pt.y + height);

            // Remove used candidate point
            candidatePoints.splice(pIdx, 1);
            break pointLoop;
          }
        }
      }
    }

    // Gap fill pass for this iteration with smallest template
    if (fillGaps) {
      const smallest = sortedTemplates[sortedTemplates.length - 1];
      const { width: sW, height: sH } = getTemplateDimensions(smallest);
      const step = Math.max(5, Math.floor(Math.min(sW, sH) / 2));

      for (let y = 0; y <= container.height - sH; y += step) {
        for (let x = 0; x <= container.width - sW; x += step) {
          const candidate: PlacedShape = {
            id: `sf-gap-${iteration}-${shapeCounter}`,
            templateId: smallest.id,
            x,
            y,
            rotation: 0,
          };
          const geo = getGeometry(smallest, candidate);
          if (isInsideContainer(geo, container) && !spatialGrid.hasCollision(candidate, smallest)) {
            spatialGrid.insert(candidate, smallest);
            currentPlaced.push(candidate);
            shapeCounter++;
          }
        }
      }
    }

    // Compute used area
    let currentArea = 0;
    for (const s of currentPlaced) {
      const t = templateMap.get(s.templateId);
      if (t) currentArea += getTemplateArea(t);
    }

    if (
      currentPlaced.length > bestCount ||
      (currentPlaced.length === bestCount && currentArea > bestArea)
    ) {
      bestCount = currentPlaced.length;
      bestArea = currentArea;
      bestLayout = currentPlaced;
    }
  }

  return bestLayout;
}
