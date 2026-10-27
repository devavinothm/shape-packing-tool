import { isInsideContainer } from './collision';
import { getGeometry, getTemplateDimensions } from './geometry';
import type { Container, PlacedShape, ShapeTemplate } from './types';
import { validateLayout } from './validate';

export interface StrategyResult {
  strategyName: string;
  shapes: PlacedShape[];
  count: number;
}

/**
 * Computes single-shape maximum fit by testing all applicable geometric strategies.
 */
export function computeSingleShapeMax(
  container: Container,
  template: ShapeTemplate
): StrategyResult {
  const { width: W, height: H } = container;

  switch (template.type) {
    case 'square':
      return computeSquareMax(container, template);
    case 'rectangle':
      return computeRectangleMax(container, template);
    case 'circle':
      return computeCircleMax(container, template);
    case 'triangle':
      return computeTriangleMax(container, template);
    default:
      return { strategyName: 'None', shapes: [], count: 0 };
  }
}

// -------------------------------------------------------------
// SQUARES
// -------------------------------------------------------------
function computeSquareMax(container: Container, template: ShapeTemplate): StrategyResult {
  const s = template.params.size ?? 50;
  if (s <= 0 || s > container.width || s > container.height) {
    return { strategyName: 'Size Exceeds Container', shapes: [], count: 0 };
  }

  const cols = Math.floor(container.width / s);
  const rows = Math.floor(container.height / s);
  const shapes: PlacedShape[] = [];

  let idCounter = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      shapes.push({
        id: `max-sq-${idCounter++}`,
        templateId: template.id,
        x: c * s,
        y: r * s,
        rotation: 0,
      });
    }
  }

  return {
    strategyName: 'Standard Grid',
    shapes,
    count: shapes.length,
  };
}

// -------------------------------------------------------------
// RECTANGLES
// -------------------------------------------------------------
function computeRectangleMax(container: Container, template: ShapeTemplate): StrategyResult {
  const w = template.params.width ?? 80;
  const h = template.params.height ?? 40;
  const { width: W, height: H } = container;

  if (w <= 0 || h <= 0) {
    return { strategyName: 'Invalid Dimensions', shapes: [], count: 0 };
  }

  const strategies: StrategyResult[] = [];

  // Strategy 1: Standard Orientation Grid
  {
    const cols = Math.floor(W / w);
    const rows = Math.floor(H / h);
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        shapes.push({
          id: `rect-std-${id++}`,
          templateId: template.id,
          x: c * w,
          y: r * h,
          rotation: 0,
        });
      }
    }
    strategies.push({ strategyName: 'Standard Grid', shapes, count: shapes.length });
  }

  // Strategy 2: Rotated 90° Grid
  {
    const cols = Math.floor(W / h);
    const rows = Math.floor(H / w);
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        shapes.push({
          id: `rect-rot-${id++}`,
          templateId: template.id,
          x: c * h,
          y: r * w,
          rotation: 90,
        });
      }
    }
    strategies.push({ strategyName: 'Rotated 90° Grid', shapes, count: shapes.length });
  }

  // Strategy 3: Mixed Shelf / Guillotine (Horizontal Residual)
  {
    const shapes: PlacedShape[] = [];
    let id = 1;
    const mainCols = Math.floor(W / w);
    const mainRows = Math.floor(H / h);
    const usedWidth = mainCols * w;

    // Main block
    for (let r = 0; r < mainRows; r++) {
      for (let c = 0; c < mainCols; c++) {
        shapes.push({
          id: `rect-mix1-m-${id++}`,
          templateId: template.id,
          x: c * w,
          y: r * h,
          rotation: 0,
        });
      }
    }

    // Right residual strip (fill with rotated rectangles if width >= h and height >= w)
    const rightRem = W - usedWidth;
    if (rightRem >= h) {
      const resCols = Math.floor(rightRem / h);
      const resRows = Math.floor(H / w);
      for (let r = 0; r < resRows; r++) {
        for (let c = 0; c < resCols; c++) {
          shapes.push({
            id: `rect-mix1-r-${id++}`,
            templateId: template.id,
            x: usedWidth + c * h,
            y: r * w,
            rotation: 90,
          });
        }
      }
    }
    strategies.push({ strategyName: 'Mixed Shelf (Right Strip)', shapes, count: shapes.length });
  }

  // Strategy 4: Mixed Shelf (Bottom Residual)
  {
    const shapes: PlacedShape[] = [];
    let id = 1;
    const mainCols = Math.floor(W / w);
    const mainRows = Math.floor(H / h);
    const usedHeight = mainRows * h;

    for (let r = 0; r < mainRows; r++) {
      for (let c = 0; c < mainCols; c++) {
        shapes.push({
          id: `rect-mix2-m-${id++}`,
          templateId: template.id,
          x: c * w,
          y: r * h,
          rotation: 0,
        });
      }
    }

    const botRem = H - usedHeight;
    if (botRem >= w) {
      const resCols = Math.floor(W / h);
      const resRows = Math.floor(botRem / w);
      for (let r = 0; r < resRows; r++) {
        for (let c = 0; c < resCols; c++) {
          shapes.push({
            id: `rect-mix2-b-${id++}`,
            templateId: template.id,
            x: c * h,
            y: usedHeight + r * w,
            rotation: 90,
          });
        }
      }
    }
    strategies.push({ strategyName: 'Mixed Shelf (Bottom Strip)', shapes, count: shapes.length });
  }

  // Validate all and pick highest count
  return pickWinningStrategy(container, template, strategies);
}

// -------------------------------------------------------------
// CIRCLES
// -------------------------------------------------------------
function computeCircleMax(container: Container, template: ShapeTemplate): StrategyResult {
  const r = template.params.radius ?? 25;
  const d = 2 * r;
  const { width: W, height: H } = container;

  if (r <= 0 || d > W || d > H) {
    return { strategyName: 'Radius Exceeds Container', shapes: [], count: 0 };
  }

  const strategies: StrategyResult[] = [];

  // 1. Square Grid
  {
    const cols = Math.floor(W / d);
    const rows = Math.floor(H / d);
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        shapes.push({
          id: `circ-sq-${id++}`,
          templateId: template.id,
          x: col * d,
          y: row * d,
          rotation: 0,
        });
      }
    }
    strategies.push({ strategyName: 'Square Grid', shapes, count: shapes.length });
  }

  // 2. Hexagonal Packing: Horizontal Rows (Phase 0 and Phase 1)
  const rowSpacing = r * Math.sqrt(3);
  const numRows = 1 + Math.floor((H - d) / rowSpacing);

  for (const phase of [0, 1]) {
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
      const y = rowIdx * rowSpacing;
      const isShifted = (rowIdx % 2) === phase;
      const startX = isShifted ? r : 0;
      const availableW = W - startX;
      const colsInRow = Math.floor(availableW / d);

      for (let colIdx = 0; colIdx < colsInRow; colIdx++) {
        const x = startX + colIdx * d;
        shapes.push({
          id: `circ-hex-h${phase}-${id++}`,
          templateId: template.id,
          x,
          y,
          rotation: 0,
        });
      }
    }
    strategies.push({
      strategyName: `Hexagonal Packing (Horizontal, Phase ${phase})`,
      shapes,
      count: shapes.length,
    });
  }

  // 3. Hexagonal Packing: Vertical Columns (Phase 0 and Phase 1)
  const colSpacing = r * Math.sqrt(3);
  const numCols = 1 + Math.floor((W - d) / colSpacing);

  for (const phase of [0, 1]) {
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      const x = colIdx * colSpacing;
      const isShifted = (colIdx % 2) === phase;
      const startY = isShifted ? r : 0;
      const availableH = H - startY;
      const rowsInCol = Math.floor(availableH / d);

      for (let rowIdx = 0; rowIdx < rowsInCol; rowIdx++) {
        const y = startY + rowIdx * d;
        shapes.push({
          id: `circ-hex-v${phase}-${id++}`,
          templateId: template.id,
          x,
          y,
          rotation: 0,
        });
      }
    }
    strategies.push({
      strategyName: `Hexagonal Packing (Vertical, Phase ${phase})`,
      shapes,
      count: shapes.length,
    });
  }

  return pickWinningStrategy(container, template, strategies);
}

// -------------------------------------------------------------
// TRIANGLES
// -------------------------------------------------------------
function computeTriangleMax(container: Container, template: ShapeTemplate): StrategyResult {
  const b = template.params.base ?? 60;
  const h = template.params.height ?? 50;
  const { width: W, height: H } = container;

  if (b <= 0 || h <= 0 || b > W || h > H) {
    return { strategyName: 'Triangle Exceeds Container', shapes: [], count: 0 };
  }

  const strategies: StrategyResult[] = [];

  // Strategy 1: Standard Upright Grid
  {
    const cols = Math.floor(W / b);
    const rows = Math.floor(H / h);
    const shapes: PlacedShape[] = [];
    let id = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        shapes.push({
          id: `tri-std-${id++}`,
          templateId: template.id,
          x: c * b,
          y: r * h,
          rotation: 0,
        });
      }
    }
    strategies.push({ strategyName: 'Upright Grid Baseline', shapes, count: shapes.length });
  }

  // Strategy 2: Interlocking Rows (Alternating Up/Down with 180° rotation)
  {
    const rows = Math.floor(H / h);
    const shapes: PlacedShape[] = [];
    let id = 1;

    for (let r = 0; r < rows; r++) {
      const y = r * h;
      let x = 0;
      let isUpright = true;

      while (x + b <= W + 1e-6) {
        shapes.push({
          id: `tri-interlock-${id++}`,
          templateId: template.id,
          x,
          y,
          rotation: isUpright ? 0 : 180,
        });

        // Each subsequent interlocking triangle is shifted by b/2
        x += b / 2;
        isUpright = !isUpright;
      }
    }

    strategies.push({
      strategyName: 'Interlocking Alternating Rows',
      shapes,
      count: shapes.length,
    });
  }

  return pickWinningStrategy(container, template, strategies);
}

// -------------------------------------------------------------
// HELPER: Validate and pick winning strategy
// -------------------------------------------------------------
function pickWinningStrategy(
  container: Container,
  template: ShapeTemplate,
  strategies: StrategyResult[]
): StrategyResult {
  let best: StrategyResult = { strategyName: 'None', shapes: [], count: 0 };
  const templatesMap: Record<string, ShapeTemplate> = { [template.id]: template };

  for (const strat of strategies) {
    // Filter shapes that strictly fit container
    const validShapes = strat.shapes.filter((s) => {
      const geo = getGeometry(template, s);
      return isInsideContainer(geo, container);
    });

    const validation = validateLayout(container, templatesMap, validShapes);
    if (validation.isValid && validShapes.length > best.count) {
      best = {
        strategyName: strat.strategyName,
        shapes: validShapes,
        count: validShapes.length,
      };
    }
  }

  return best;
}
