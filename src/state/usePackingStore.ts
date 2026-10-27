import { create } from 'zustand';
import { getTemplateArea } from '../core/geometry';
import type {
  ComputeStats,
  Container,
  PlacedShape,
  ShapeTemplate,
  ValidationResult,
} from '../core/types';
import { validateLayout } from '../core/validate';
import { runPackingTask, terminateWorker } from '../workers/packingClient';

export type CalculationMode = 'single' | 'mixed' | 'current';
export type UnitType = 'px' | 'mm' | 'cm' | 'in';

export interface RandomFillSettings {
  seed: number;
  maxAttempts: number;
  failureThreshold: number;
  keepExisting: boolean;
  fillGaps: boolean;
}

export interface Overlays {
  boundingBoxes: boolean;
  ids: boolean;
  heatmap: boolean;
}

interface HistorySnapshot {
  container: Container;
  templates: ShapeTemplate[];
  placedShapes: PlacedShape[];
}

export interface PackingState {
  // Container
  container: Container;
  pendingResize: Container | null;
  shrinkWarningShapes: string[];

  // Templates
  templates: ShapeTemplate[];

  // Placed shapes
  placedShapes: PlacedShape[];
  selectedIds: string[];

  // Modes & UI settings
  calcMode: CalculationMode;
  selectedTemplateId: string | null;
  unit: UnitType;
  theme: 'light' | 'dark';
  gridSnap: boolean;
  gridSize: number;
  overlays: Overlays;
  zoom: number;
  pan: { x: number; y: number };

  // Random fill settings
  rfSettings: RandomFillSettings;

  // Compute status
  isComputing: boolean;
  computeProgress: number;
  stats: ComputeStats | null;
  winningStrategy: string | null;

  // History (Undo / Redo)
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  setContainer: (dims: Partial<Container>) => void;
  confirmPendingResize: (removeOutside: boolean) => void;
  cancelPendingResize: () => void;

  addTemplate: (type: ShapeTemplate['type']) => void;
  updateTemplate: (id: string, updates: Partial<ShapeTemplate>) => void;
  duplicateTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  addPlacedShape: (shape: Omit<PlacedShape, 'id'> & { id?: string }) => void;
  updatePlacedShape: (id: string, updates: Partial<PlacedShape>) => void;
  removePlacedShapes: (ids: string[]) => void;
  clearPlacedShapes: () => void;
  resetToDefaults: () => void;

  setSelectedIds: (ids: string[]) => void;
  toggleSelectShape: (id: string, multiSelect?: boolean) => void;
  nudgeSelected: (dx: number, dy: number) => void;

  setCalcMode: (mode: CalculationMode) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setUnit: (unit: UnitType) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleGridSnap: () => void;
  setGridSize: (size: number) => void;
  toggleOverlay: (key: keyof Overlays) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;

  setRfSettings: (updates: Partial<RandomFillSettings>) => void;
  rerollSeed: () => void;

  // Calculation runners
  runRandomFill: () => Promise<void>;
  runSmartFill: () => Promise<void>;
  runSingleMax: () => Promise<void>;
  cancelCompute: () => void;

  // History
  undo: () => void;
  redo: () => void;

  // Layout validation getter
  getValidation: () => ValidationResult;
  getLiveStats: () => ComputeStats;
}

const DEFAULT_TEMPLATES: ShapeTemplate[] = [
  {
    id: 'tpl-sq',
    name: 'Square',
    type: 'square',
    params: { size: 60 },
    color: '#3b82f6',
    enabled: true,
    weight: 1,
  },
  {
    id: 'tpl-rect',
    name: 'Rectangle',
    type: 'rectangle',
    params: { width: 100, height: 50 },
    color: '#10b981',
    enabled: true,
    weight: 1,
  },
  {
    id: 'tpl-circ',
    name: 'Circle',
    type: 'circle',
    params: { radius: 30 },
    color: '#8b5cf6',
    enabled: true,
    weight: 1,
  },
  {
    id: 'tpl-tri',
    name: 'Triangle',
    type: 'triangle',
    params: { base: 70, height: 60 },
    color: '#f59e0b',
    enabled: true,
    weight: 1,
  },
];

const DEFAULT_CONTAINER: Container = {
  width: 800,
  height: 600,
};

function pushSnapshot(state: PackingState): { past: HistorySnapshot[]; future: HistorySnapshot[] } {
  const current: HistorySnapshot = {
    container: { ...state.container },
    templates: state.templates.map((t) => ({ ...t, params: { ...t.params } })),
    placedShapes: state.placedShapes.map((p) => ({ ...p })),
  };
  const newPast = [...state.past, current];
  if (newPast.length > 100) newPast.shift();
  return { past: newPast, future: [] };
}

export const usePackingStore = create<PackingState>((set, get) => ({
  container: { ...DEFAULT_CONTAINER },
  pendingResize: null,
  shrinkWarningShapes: [],

  templates: DEFAULT_TEMPLATES.map((t) => ({ ...t, params: { ...t.params } })),
  placedShapes: [],
  selectedIds: [],

  calcMode: 'mixed',
  selectedTemplateId: 'tpl-sq',
  unit: 'px',
  theme: 'dark',
  gridSnap: false,
  gridSize: 10,
  overlays: {
    boundingBoxes: false,
    ids: false,
    heatmap: false,
  },
  zoom: 1,
  pan: { x: 0, y: 0 },

  rfSettings: {
    seed: 12345,
    maxAttempts: 50000,
    failureThreshold: 300,
    keepExisting: false,
    fillGaps: true,
  },

  isComputing: false,
  computeProgress: 0,
  stats: null,
  winningStrategy: null,

  past: [],
  future: [],

  setContainer: (dims) => {
    const current = get().container;
    const newDims: Container = {
      width: Math.max(10, Math.min(5000, dims.width ?? current.width)),
      height: Math.max(10, Math.min(5000, dims.height ?? current.height)),
    };

    // Check if placed shapes would be out of bounds
    const state = get();
    const templateMap = new Map<string, ShapeTemplate>();
    for (const t of state.templates) templateMap.set(t.id, t);
    const validation = validateLayout(newDims, templateMap, state.placedShapes);

    if (validation.overflows.length > 0) {
      set({
        pendingResize: newDims,
        shrinkWarningShapes: validation.overflows,
      });
      return;
    }

    set({
      ...pushSnapshot(state),
      container: newDims,
      pendingResize: null,
      shrinkWarningShapes: [],
    });
  },

  confirmPendingResize: (removeOutside) => {
    const state = get();
    if (!state.pendingResize) return;

    let updatedShapes = state.placedShapes;
    if (removeOutside) {
      const templateMap = new Map<string, ShapeTemplate>();
      for (const t of state.templates) templateMap.set(t.id, t);
      const validation = validateLayout(state.pendingResize, templateMap, state.placedShapes);
      const overflowsSet = new Set(validation.overflows);
      updatedShapes = state.placedShapes.filter((s) => !overflowsSet.has(s.id));
    }

    set({
      ...pushSnapshot(state),
      container: state.pendingResize,
      placedShapes: updatedShapes,
      pendingResize: null,
      shrinkWarningShapes: [],
    });
  },

  cancelPendingResize: () => {
    set({ pendingResize: null, shrinkWarningShapes: [] });
  },

  addTemplate: (type) => {
    const state = get();
    const id = `tpl-${Date.now()}`;
    let params: Record<string, number> = {};
    let color = '#3b82f6';
    let name = 'Shape';

    if (type === 'square') {
      params = { size: 50 };
      color = '#3b82f6';
      name = 'Square';
    } else if (type === 'rectangle') {
      params = { width: 80, height: 40 };
      color = '#10b981';
      name = 'Rectangle';
    } else if (type === 'circle') {
      params = { radius: 25 };
      color = '#8b5cf6';
      name = 'Circle';
    } else if (type === 'triangle') {
      params = { base: 60, height: 50 };
      color = '#f59e0b';
      name = 'Triangle';
    }

    const newTemplate: ShapeTemplate = {
      id,
      name,
      type,
      params,
      color,
      enabled: true,
      weight: 1,
    };

    set({
      ...pushSnapshot(state),
      templates: [...state.templates, newTemplate],
    });
  },

  updateTemplate: (id, updates) => {
    const state = get();
    set({
      ...pushSnapshot(state),
      templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  },

  duplicateTemplate: (id) => {
    const state = get();
    const source = state.templates.find((t) => t.id === id);
    if (!source) return;

    const copy: ShapeTemplate = {
      ...source,
      id: `tpl-${Date.now()}`,
      name: `${source.name || source.type} (Copy)`,
      params: { ...source.params },
    };

    set({
      ...pushSnapshot(state),
      templates: [...state.templates, copy],
    });
  },

  deleteTemplate: (id) => {
    const state = get();
    set({
      ...pushSnapshot(state),
      templates: state.templates.filter((t) => t.id !== id),
      placedShapes: state.placedShapes.filter((s) => s.templateId !== id),
      selectedIds: state.selectedIds.filter((selId) => {
        const shape = state.placedShapes.find((s) => s.id === selId);
        return shape && shape.templateId !== id;
      }),
    });
  },

  addPlacedShape: (shapeData) => {
    const state = get();
    const newShape: PlacedShape = {
      id: shapeData.id || `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      templateId: shapeData.templateId,
      x: shapeData.x,
      y: shapeData.y,
      rotation: shapeData.rotation || 0,
    };

    set({
      ...pushSnapshot(state),
      placedShapes: [...state.placedShapes, newShape],
      selectedIds: [newShape.id],
    });
  },

  updatePlacedShape: (id, updates) => {
    const state = get();
    set({
      placedShapes: state.placedShapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  },

  removePlacedShapes: (ids) => {
    const state = get();
    const idSet = new Set(ids);
    set({
      ...pushSnapshot(state),
      placedShapes: state.placedShapes.filter((s) => !idSet.has(s.id)),
      selectedIds: state.selectedIds.filter((selId) => !idSet.has(selId)),
    });
  },

  clearPlacedShapes: () => {
    const state = get();
    if (state.placedShapes.length === 0) return;
    set({
      ...pushSnapshot(state),
      placedShapes: [],
      selectedIds: [],
      stats: null,
      winningStrategy: null,
    });
  },

  resetToDefaults: () => {
    const state = get();
    set({
      ...pushSnapshot(state),
      container: { ...DEFAULT_CONTAINER },
      templates: DEFAULT_TEMPLATES.map((t) => ({ ...t, params: { ...t.params } })),
      placedShapes: [],
      selectedIds: [],
      stats: null,
      winningStrategy: null,
      rfSettings: {
        seed: 12345,
        maxAttempts: 50000,
        failureThreshold: 300,
        keepExisting: false,
        fillGaps: true,
      },
    });
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelectShape: (id, multiSelect = false) => {
    const state = get();
    if (multiSelect) {
      const exists = state.selectedIds.includes(id);
      set({
        selectedIds: exists
          ? state.selectedIds.filter((sId) => sId !== id)
          : [...state.selectedIds, id],
      });
    } else {
      set({ selectedIds: [id] });
    }
  },

  nudgeSelected: (dx, dy) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    const selectedSet = new Set(state.selectedIds);

    set({
      ...pushSnapshot(state),
      placedShapes: state.placedShapes.map((s) =>
        selectedSet.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
      ),
    });
  },

  setCalcMode: (calcMode) => set({ calcMode }),
  setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
  setUnit: (unit) => set({ unit }),
  setTheme: (theme) => set({ theme }),
  toggleGridSnap: () => set((s) => ({ gridSnap: !s.gridSnap })),
  setGridSize: (gridSize) => set({ gridSize: Math.max(1, gridSize) }),
  toggleOverlay: (key) =>
    set((s) => ({ overlays: { ...s.overlays, [key]: !s.overlays[key] } })),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setPan: (pan) => set({ pan }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  setRfSettings: (updates) =>
    set((s) => ({ rfSettings: { ...s.rfSettings, ...updates } })),

  rerollSeed: () =>
    set((s) => ({
      rfSettings: {
        ...s.rfSettings,
        seed: Math.floor(Math.random() * 900000) + 100000,
      },
    })),

  // Web Worker Calculation actions
  runRandomFill: async () => {
    const state = get();
    set({ isComputing: true, computeProgress: 0 });

    try {
      const result = await runPackingTask({
        type: 'RANDOM_FILL',
        container: state.container,
        templates: state.templates,
        existingShapes: state.placedShapes,
        options: state.rfSettings as unknown as Record<string, unknown>,
      });

      // Animate progressive batch placement
      const allShapes = result.shapes;
      const batchSize = Math.max(20, Math.floor(allShapes.length / 15));

      if (batchSize >= allShapes.length) {
        set({
          ...pushSnapshot(state),
          placedShapes: allShapes,
          stats: result.stats,
          isComputing: false,
          computeProgress: 100,
        });
      } else {
        // Stream in progressive chunks
        let index = 0;
        const streamNextBatch = () => {
          index = Math.min(allShapes.length, index + batchSize);
          const currentBatch = allShapes.slice(0, index);
          const progress = Math.round((index / allShapes.length) * 100);

          if (index >= allShapes.length) {
            set({
              ...pushSnapshot(state),
              placedShapes: allShapes,
              stats: result.stats,
              isComputing: false,
              computeProgress: 100,
            });
          } else {
            set({
              placedShapes: currentBatch,
              computeProgress: progress,
            });
            requestAnimationFrame(streamNextBatch);
          }
        };
        requestAnimationFrame(streamNextBatch);
      }
    } catch (err) {
      console.error(err);
      set({ isComputing: false });
    }
  },

  runSmartFill: async () => {
    const state = get();
    set({ isComputing: true, computeProgress: 0 });

    try {
      const result = await runPackingTask({
        type: 'SMART_FILL',
        container: state.container,
        templates: state.templates,
        existingShapes: state.placedShapes,
        options: {
          seed: state.rfSettings.seed,
          timeLimitMs: 2000,
          keepExisting: state.rfSettings.keepExisting,
          fillGaps: state.rfSettings.fillGaps,
        },
      });

      set({
        ...pushSnapshot(state),
        placedShapes: result.shapes,
        stats: result.stats,
        isComputing: false,
        computeProgress: 100,
      });
    } catch (err) {
      console.error(err);
      set({ isComputing: false });
    }
  },

  runSingleMax: async () => {
    const state = get();
    const templateId = state.selectedTemplateId || state.templates[0]?.id;
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) return;

    set({ isComputing: true });
    try {
      const result = await runPackingTask({
        type: 'SINGLE_SHAPE_MAX',
        container: state.container,
        template,
      });

      set({
        ...pushSnapshot(state),
        placedShapes: result.shapes,
        stats: result.stats,
        winningStrategy: result.strategyName || null,
        isComputing: false,
      });
    } catch (err) {
      console.error(err);
      set({ isComputing: false });
    }
  },

  cancelCompute: () => {
    terminateWorker();
    set({ isComputing: false });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    const currentSnapshot: HistorySnapshot = {
      container: { ...state.container },
      templates: state.templates.map((t) => ({ ...t, params: { ...t.params } })),
      placedShapes: state.placedShapes.map((p) => ({ ...p })),
    };

    set({
      container: previous.container,
      templates: previous.templates,
      placedShapes: previous.placedShapes,
      past: newPast,
      future: [currentSnapshot, ...state.future],
      selectedIds: [],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    const currentSnapshot: HistorySnapshot = {
      container: { ...state.container },
      templates: state.templates.map((t) => ({ ...t, params: { ...t.params } })),
      placedShapes: state.placedShapes.map((p) => ({ ...p })),
    };

    set({
      container: next.container,
      templates: next.templates,
      placedShapes: next.placedShapes,
      past: [...state.past, currentSnapshot],
      future: newFuture,
      selectedIds: [],
    });
  },

  getValidation: () => {
    const state = get();
    const templateMap = new Map<string, ShapeTemplate>();
    for (const t of state.templates) templateMap.set(t.id, t);
    return validateLayout(state.container, templateMap, state.placedShapes);
  },

  getLiveStats: () => {
    const state = get();
    const templateMap = new Map<string, ShapeTemplate>();
    for (const t of state.templates) templateMap.set(t.id, t);

    const countPerTemplate: Record<string, number> = {};
    let usedArea = 0;

    for (const s of state.placedShapes) {
      countPerTemplate[s.templateId] = (countPerTemplate[s.templateId] || 0) + 1;
      const t = templateMap.get(s.templateId);
      if (t) {
        usedArea += getTemplateArea(t);
      }
    }

    const containerArea = state.container.width * state.container.height;
    const utilization = containerArea > 0 ? (usedArea / containerArea) * 100 : 0;

    return {
      totalCount: state.placedShapes.length,
      countPerTemplate,
      containerArea,
      usedArea,
      utilization,
      algorithm: state.stats?.algorithm || 'Current Placement',
      computeTimeMs: state.stats?.computeTimeMs || 0,
      seed: state.stats?.seed ?? state.rfSettings.seed,
    };
  },
}));
