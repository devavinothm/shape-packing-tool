import { getTemplateArea } from '../core/geometry';
import { randomFill } from '../core/randomFill';
import { computeSingleShapeMax } from '../core/singleShapeMax';
import { smartFill } from '../core/smartFill';
import type {
  ComputeStats,
  Container,
  PlacedShape,
  ShapeTemplate,
} from '../core/types';

export interface WorkerRequest {
  id: string;
  type: 'RANDOM_FILL' | 'SMART_FILL' | 'SINGLE_SHAPE_MAX';
  container: Container;
  templates?: ShapeTemplate[];
  template?: ShapeTemplate;
  existingShapes?: PlacedShape[];
  options?: Record<string, unknown>;
}

export interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'PROGRESS' | 'ERROR';
  shapes?: PlacedShape[];
  stats?: ComputeStats;
  strategyName?: string;
  error?: string;
  progress?: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const startTime = performance.now();

  try {
    if (req.type === 'RANDOM_FILL') {
      const container = req.container;
      const templates = req.templates || [];
      const existing = req.existingShapes || [];
      const options = req.options || {};

      const placed = randomFill(container, templates, existing, options);
      const elapsed = performance.now() - startTime;

      const stats = buildStats(container, templates, placed, 'Random Fill (Mulberry32)', elapsed, options.seed as string | number);
      self.postMessage({
        id: req.id,
        type: 'SUCCESS',
        shapes: placed,
        stats,
      } satisfies WorkerResponse);
    } else if (req.type === 'SMART_FILL') {
      const container = req.container;
      const templates = req.templates || [];
      const existing = req.existingShapes || [];
      const options = req.options || {};

      const placed = smartFill(container, templates, existing, options);
      const elapsed = performance.now() - startTime;

      const stats = buildStats(container, templates, placed, 'Smart Fill (Bottom-Left Skyline)', elapsed, options.seed as string | number);
      self.postMessage({
        id: req.id,
        type: 'SUCCESS',
        shapes: placed,
        stats,
      } satisfies WorkerResponse);
    } else if (req.type === 'SINGLE_SHAPE_MAX') {
      const container = req.container;
      const template = req.template;
      if (!template) {
        throw new Error('Template is required for SINGLE_SHAPE_MAX');
      }

      const res = computeSingleShapeMax(container, template);
      const elapsed = performance.now() - startTime;

      const stats = buildStats(container, [template], res.shapes, `Single Max: ${res.strategyName}`, elapsed);
      self.postMessage({
        id: req.id,
        type: 'SUCCESS',
        shapes: res.shapes,
        strategyName: res.strategyName,
        stats,
      } satisfies WorkerResponse);
    }
  } catch (err) {
    self.postMessage({
      id: req.id,
      type: 'ERROR',
      error: (err as Error).message,
    } satisfies WorkerResponse);
  }
};

function buildStats(
  container: Container,
  templates: ShapeTemplate[],
  placed: PlacedShape[],
  algorithm: string,
  elapsed: number,
  seed?: string | number
): ComputeStats {
  const templateMap = new Map<string, ShapeTemplate>();
  for (const t of templates) templateMap.set(t.id, t);

  const countPerTemplate: Record<string, number> = {};
  let usedArea = 0;

  for (const s of placed) {
    countPerTemplate[s.templateId] = (countPerTemplate[s.templateId] || 0) + 1;
    const t = templateMap.get(s.templateId);
    if (t) {
      usedArea += getTemplateArea(t);
    }
  }

  const containerArea = container.width * container.height;
  const utilization = containerArea > 0 ? (usedArea / containerArea) * 100 : 0;

  return {
    totalCount: placed.length,
    countPerTemplate,
    containerArea,
    usedArea,
    utilization,
    algorithm,
    computeTimeMs: Math.round(elapsed * 10) / 10,
    seed,
  };
}
