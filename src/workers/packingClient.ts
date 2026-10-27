import { getTemplateArea } from '../core/geometry';
import { randomFill } from '../core/randomFill';
import { computeSingleShapeMax } from '../core/singleShapeMax';
import { smartFill } from '../core/smartFill';
import type { ComputeStats, Container, PlacedShape, ShapeTemplate } from '../core/types';
import type { WorkerRequest, WorkerResponse } from './packing.worker';

let workerInstance: Worker | null = null;
let pendingResolvers = new Map<
  string,
  {
    resolve: (val: { shapes: PlacedShape[]; stats: ComputeStats; strategyName?: string }) => void;
    reject: (err: Error) => void;
  }
>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./packing.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, shapes, stats, strategyName, error } = event.data;
        const callbacks = pendingResolvers.get(id);
        if (!callbacks) return;

        if (type === 'SUCCESS' && shapes && stats) {
          callbacks.resolve({ shapes, stats, strategyName });
          pendingResolvers.delete(id);
        } else if (type === 'ERROR') {
          callbacks.reject(new Error(error || 'Worker execution failed'));
          pendingResolvers.delete(id);
        }
      };
      workerInstance.onerror = (err) => {
        console.error('Packing worker error:', err);
      };
    } catch (e) {
      console.warn('Could not initialize Web Worker, falling back to main thread', e);
      workerInstance = null;
    }
  }
  return workerInstance;
}

export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    pendingResolvers.forEach(({ reject }) => reject(new Error('Operation cancelled')));
    pendingResolvers.clear();
  }
}

export async function runPackingTask(
  request: Omit<WorkerRequest, 'id'>
): Promise<{ shapes: PlacedShape[]; stats: ComputeStats; strategyName?: string }> {
  const worker = getWorker();
  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  if (worker) {
    return new Promise((resolve, reject) => {
      pendingResolvers.set(id, { resolve, reject });
      worker.postMessage({ ...request, id } satisfies WorkerRequest);
    });
  }

  // Fallback to main thread execution
  const startTime = performance.now();
  if (request.type === 'RANDOM_FILL') {
    const placed = randomFill(
      request.container,
      request.templates || [],
      request.existingShapes || [],
      request.options || {}
    );
    const elapsed = performance.now() - startTime;
    return {
      shapes: placed,
      stats: computeStats(
        request.container,
        request.templates || [],
        placed,
        'Random Fill (Mulberry32)',
        elapsed,
        request.options?.seed as string | number
      ),
    };
  }

  if (request.type === 'SMART_FILL') {
    const placed = smartFill(
      request.container,
      request.templates || [],
      request.existingShapes || [],
      request.options || {}
    );
    const elapsed = performance.now() - startTime;
    return {
      shapes: placed,
      stats: computeStats(
        request.container,
        request.templates || [],
        placed,
        'Smart Fill (Bottom-Left Skyline)',
        elapsed,
        request.options?.seed as string | number
      ),
    };
  }

  if (request.type === 'SINGLE_SHAPE_MAX') {
    if (!request.template) throw new Error('Template is required for SINGLE_SHAPE_MAX');
    const res = computeSingleShapeMax(request.container, request.template);
    const elapsed = performance.now() - startTime;
    return {
      shapes: res.shapes,
      strategyName: res.strategyName,
      stats: computeStats(
        request.container,
        [request.template],
        res.shapes,
        `Single Max: ${res.strategyName}`,
        elapsed
      ),
    };
  }

  throw new Error(`Unsupported task type: ${request.type}`);
}

function computeStats(
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
    if (t) usedArea += getTemplateArea(t);
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
