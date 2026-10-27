import {
  Grid,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Tag,
  SquareDashed,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { isInsideContainer } from '../../core/collision';
import { getGeometry, getTemplateDimensions } from '../../core/geometry';
import { SpatialGrid } from '../../core/spatialGrid';
import type { PlacedShape } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';
import { ContainerBox } from './ContainerBox';
import { ShapeView } from './ShapeView';

interface DragState {
  type: 'shape' | 'resize' | 'pan';
  shapeId?: string;
  initialShape?: PlacedShape;
  handleId?: string;
  startClientX: number;
  startClientY: number;
  startContainerW: number;
  startContainerH: number;
  startX: number;
  startY: number;
  currentValid: boolean;
  tempX?: number;
  tempY?: number;
}

export const PackingCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    container,
    setContainer,
    templates,
    placedShapes,
    selectedIds,
    setSelectedIds,
    toggleSelectShape,
    addPlacedShape,
    updatePlacedShape,
    removePlacedShapes,
    nudgeSelected,
    undo,
    redo,
    zoom,
    setZoom,
    pan,
    setPan,
    gridSnap,
    gridSize,
    toggleGridSnap,
    overlays,
    toggleOverlay,
    getValidation,
  } = usePackingStore();

  const [dragState, setDragState] = useState<DragState | null>(null);

  // Template lookup map
  const templateMap = new Map();
  for (const t of templates) templateMap.set(t.id, t);

  // Validation results
  const validation = getValidation();
  const invalidShapesSet = new Set([
    ...validation.overflows,
    ...validation.overlaps.flatMap(([a, b]) => [a, b]),
  ]);

  // Center/Fit Container to screen
  const zoomToFit = React.useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const scaleX = (clientWidth - padding) / container.width;
    const scaleY = (clientHeight - padding) / container.height;
    const fitZoom = Math.min(Math.max(0.1, Math.min(scaleX, scaleY)), 2.5);

    const fitPan = {
      x: (clientWidth - container.width * fitZoom) / 2,
      y: (clientHeight - container.height * fitZoom) / 2,
    };

    setZoom(fitZoom);
    setPan(fitPan);
  }, [container.width, container.height, setZoom, setPan]);

  // Initial fit on mount
  useEffect(() => {
    zoomToFit();
  }, [zoomToFit]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          removePlacedShapes(selectedIds);
        }
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // Nudge with arrow keys
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelected(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelected(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelected(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelected(0, step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, removePlacedShapes, undo, redo, nudgeSelected]);

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPan = {
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      };

      setZoom(newZoom);
      setPan(newPan);
    }
  };

  // Handle Drag & Drop of Shape Templates onto the Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (!data.templateId) return;

      const template = templateMap.get(data.templateId);
      if (!template) return;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dims = getTemplateDimensions(template);
      const canvasX = (e.clientX - rect.left - pan.x) / zoom - dims.width / 2;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom - dims.height / 2;

      let finalX = Math.round(canvasX);
      let finalY = Math.round(canvasY);

      if (gridSnap) {
        finalX = Math.round(finalX / gridSize) * gridSize;
        finalY = Math.round(finalY / gridSize) * gridSize;
      }

      addPlacedShape({
        templateId: template.id,
        x: Math.max(0, Math.min(container.width - dims.width, finalX)),
        y: Math.max(0, Math.min(container.height - dims.height, finalY)),
        rotation: 0,
      });
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Shape Drag Start
  const handleShapePointerDown = (shape: PlacedShape, e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return; // only left click

    toggleSelectShape(shape.id, e.shiftKey);

    setDragState({
      type: 'shape',
      shapeId: shape.id,
      initialShape: { ...shape },
      startClientX: e.clientX,
      startClientY: e.clientY,
      startContainerW: container.width,
      startContainerH: container.height,
      startX: shape.x,
      startY: shape.y,
      currentValid: true,
      tempX: shape.x,
      tempY: shape.y,
    });
  };

  // Container Resize Start
  const handleResizeStart = (handleId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setDragState({
      type: 'resize',
      handleId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startContainerW: container.width,
      startContainerH: container.height,
      startX: 0,
      startY: 0,
      currentValid: true,
    });
  };

  // Background Pointer Down for Pan or Deselect
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).id === 'container-group') {
      setSelectedIds([]);
    }

    // Middle click or Alt/Space key triggers Pan
    if (e.button === 1 || e.altKey || e.button === 0) {
      setDragState({
        type: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startContainerW: container.width,
        startContainerH: container.height,
        startX: pan.x,
        startY: pan.y,
        currentValid: true,
      });
    }
  };

  // Pointer Move (Drag update)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const deltaX = (e.clientX - dragState.startClientX) / zoom;
    const deltaY = (e.clientY - dragState.startClientY) / zoom;

    if (dragState.type === 'shape' && dragState.shapeId && dragState.initialShape) {
      let nextX = dragState.startX + deltaX;
      let nextY = dragState.startY + deltaY;

      if (gridSnap) {
        nextX = Math.round(nextX / gridSize) * gridSize;
        nextY = Math.round(nextY / gridSize) * gridSize;
      }

      const activeShape = placedShapes.find((s) => s.id === dragState.shapeId);
      const template = activeShape ? templateMap.get(activeShape.templateId) : null;

      let isValid = true;
      if (template) {
        const candidate: PlacedShape = {
          ...activeShape!,
          x: nextX,
          y: nextY,
        };
        const geo = getGeometry(template, candidate);

        // Check container bounds
        if (!isInsideContainer(geo, container)) {
          isValid = false;
        } else {
          // Check collision against all other shapes via spatial grid
          const grid = new SpatialGrid(64);
          for (const s of placedShapes) {
            if (s.id !== dragState.shapeId) {
              const t = templateMap.get(s.templateId);
              if (t) grid.insert(s, t);
            }
          }
          if (grid.hasCollision(candidate, template)) {
            isValid = false;
          }
        }
      }

      setDragState({
        ...dragState,
        tempX: nextX,
        tempY: nextY,
        currentValid: isValid,
      });

      // Update shape position visually
      updatePlacedShape(dragState.shapeId, { x: nextX, y: nextY });
    } else if (dragState.type === 'resize' && dragState.handleId) {
      const h = dragState.handleId;
      let newW = dragState.startContainerW;
      let newH = dragState.startContainerH;

      if (h.includes('e')) newW = Math.max(50, Math.round(dragState.startContainerW + deltaX));
      if (h.includes('s')) newH = Math.max(50, Math.round(dragState.startContainerH + deltaY));
      if (h.includes('w')) newW = Math.max(50, Math.round(dragState.startContainerW - deltaX));
      if (h.includes('n')) newH = Math.max(50, Math.round(dragState.startContainerH - deltaY));

      if (gridSnap) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
      }

      setContainer({ width: newW, height: newH });
    } else if (dragState.type === 'pan') {
      const panDeltaX = e.clientX - dragState.startClientX;
      const panDeltaY = e.clientY - dragState.startClientY;
      setPan({
        x: dragState.startX + panDeltaX,
        y: dragState.startY + panDeltaY,
      });
    }
  };

  // Pointer Up (Drop / End Drag)
  const handlePointerUp = () => {
    if (!dragState) return;

    if (dragState.type === 'shape' && dragState.shapeId && dragState.initialShape) {
      // If drop position is invalid, snap back to initial position!
      if (!dragState.currentValid) {
        updatePlacedShape(dragState.shapeId, {
          x: dragState.initialShape.x,
          y: dragState.initialShape.y,
        });
      }
    }

    setDragState(null);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 h-full relative overflow-hidden bg-slate-950 select-none cursor-default"
    >
      {/* SVG Interactive Canvas */}
      <svg
        id="packing-canvas-svg"
        ref={svgRef}
        onPointerDown={handleBgPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full block"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Container Box */}
          <ContainerBox container={container} onResizeStart={handleResizeStart} />

          {/* Placed Shapes */}
          {placedShapes.map((shape) => {
            const template = templateMap.get(shape.templateId);
            if (!template) return null;

            const isSelected = selectedIds.includes(shape.id);
            const isDraggingThis = dragState?.shapeId === shape.id;
            const isInvalid = isDraggingThis
              ? !dragState.currentValid
              : invalidShapesSet.has(shape.id);

            return (
              <ShapeView
                key={shape.id}
                shape={shape}
                template={template}
                isSelected={isSelected}
                isInvalid={isInvalid}
                onPointerDown={(e) => handleShapePointerDown(shape, e)}
              />
            );
          })}
        </g>
      </svg>

      {/* Floating Toolbar: Zoom, Snap, Overlays */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur rounded-lg p-1 text-slate-300 shadow-xl z-10">
        <button
          onClick={() => setZoom(zoom * 1.2)}
          title="Zoom in"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Plus size={15} />
        </button>
        <span className="text-xs font-mono font-medium px-1.5 min-w-[48px] text-center text-slate-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom / 1.2)}
          title="Zoom out"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={zoomToFit}
          title="Fit container to screen"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 40, y: 40 });
          }}
          title="Reset zoom to 100%"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
        >
          <RotateCcw size={15} />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        {/* Snap to grid toggle */}
        <button
          onClick={toggleGridSnap}
          title={gridSnap ? 'Disable Grid Snap' : 'Enable Grid Snap (10px)'}
          className={`p-1.5 rounded transition-colors ${
            gridSnap
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Grid size={15} />
        </button>

        {/* Bounding box overlay toggle */}
        <button
          onClick={() => toggleOverlay('boundingBoxes')}
          title="Toggle Bounding Boxes Overlay"
          className={`p-1.5 rounded transition-colors ${
            overlays.boundingBoxes
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <SquareDashed size={15} />
        </button>

        {/* IDs overlay toggle */}
        <button
          onClick={() => toggleOverlay('ids')}
          title="Toggle Shape IDs Overlay"
          className={`p-1.5 rounded transition-colors ${
            overlays.ids
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Tag size={15} />
        </button>
      </div>

      {/* Helper Legend / Hint */}
      <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-700/60 backdrop-blur rounded px-2.5 py-1 text-[11px] text-slate-400 pointer-events-none">
        Drag shape to move • Red = collision / out of bounds • Del = remove • Wheel = zoom
      </div>
    </div>
  );
};
