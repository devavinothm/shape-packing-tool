import {
  Grid,
  HelpCircle,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  SquareDashed,
  Tag,
  X,
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
    toastMessage,
  } = usePackingStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          removePlacedShapes(selectedIds);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

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
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
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

  // Drag & drop shape onto canvas
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

  // Shape Pointer Down
  const handleShapePointerDown = (shape: PlacedShape, e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;

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

  // Background pointer down for Pan or Deselect
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).id === 'container-group') {
      setSelectedIds([]);
    }

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

  // Pointer Move
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

        if (!isInsideContainer(geo, container)) {
          isValid = false;
        } else {
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

  // Pointer Up
  const handlePointerUp = () => {
    if (!dragState) return;

    if (dragState.type === 'shape' && dragState.shapeId && dragState.initialShape) {
      if (!dragState.currentValid) {
        updatePlacedShape(dragState.shapeId, {
          x: dragState.initialShape.x,
          y: dragState.initialShape.y,
        });
      }
    }

    setDragState(null);
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const cmdKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 h-full relative overflow-hidden canvas-dot-grid select-none cursor-default"
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

      {/* Friendly empty state per Section 5 */}
      {placedShapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="bg-[#FFFFFF]/90 dark:bg-[#1E1D1B]/90 border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[8px] px-4 py-2.5 shadow-sm text-center">
            <p className="text-[13px] text-[#6B6860] dark:text-[#9E9B93] m-0">
              Nothing here yet. Try <span className="text-[#1C1B19] dark:text-[#EDEBE8] font-medium">Random fill</span> or drag a shape in.
            </p>
          </div>
        </div>
      )}

      {/* Help popover toggle (?) per Section 5 */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={() => setShowHelp(!showHelp)}
          title="Canvas shortcuts & help"
          className="p-1.5 rounded-[6px] bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] shadow-xs transition-colors"
        >
          <HelpCircle size={15} strokeWidth={1.5} />
        </button>

        {showHelp && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[8px] p-3 shadow-lg text-[12px] text-[#6B6860] dark:text-[#9E9B93] space-y-2 z-30">
            <div className="flex items-center justify-between text-[#1C1B19] dark:text-[#EDEBE8] font-medium border-b border-[#E7E5E0] dark:border-[#2D2C28] pb-1.5">
              <span>Shortcuts & tips</span>
              <button onClick={() => setShowHelp(false)} className="text-[#9E9B93] hover:text-[#1C1B19]">
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-1 leading-snug">
              <div className="flex justify-between">
                <span>Move shape</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Drag</span>
              </div>
              <div className="flex justify-between">
                <span>Nudge position</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Arrow keys</span>
              </div>
              <div className="flex justify-between">
                <span>Nudge 10 units</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Shift + Arrows</span>
              </div>
              <div className="flex justify-between">
                <span>Remove selected</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Delete</span>
              </div>
              <div className="flex justify-between">
                <span>Undo / Redo</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">{cmdKey}Z / {cmdKey}⇧Z</span>
              </div>
              <div className="flex justify-between">
                <span>Zoom canvas</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Scroll wheel</span>
              </div>
              <div className="flex justify-between">
                <span>Pan canvas</span>
                <span className="font-mono text-[#1C1B19] dark:text-[#EDEBE8]">Drag background</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar: Zoom, Snap, Overlays */}
      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] p-0.5 text-[#6B6860] dark:text-[#9E9B93] shadow-xs z-10">
        <button
          onClick={() => setZoom(zoom * 1.15)}
          title="Zoom in"
          className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
        <span className="text-[11px] font-mono tabular-nums px-1.5 min-w-[42px] text-center text-[#1C1B19] dark:text-[#EDEBE8]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom / 1.15)}
          title="Zoom out"
          className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          <Minus size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={zoomToFit}
          title="Fit container to screen"
          className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          <Maximize2 size={13} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 40, y: 40 });
          }}
          title="Reset zoom (100%)"
          className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          <RotateCcw size={13} strokeWidth={1.5} />
        </button>

        <div className="w-px h-3.5 bg-[#E7E5E0] dark:bg-[#2D2C28] mx-0.5" />

        {/* Snap to grid toggle */}
        <button
          onClick={toggleGridSnap}
          title={gridSnap ? 'Grid snap on' : 'Grid snap off'}
          className={`p-1.5 rounded-[4px] transition-colors ${
            gridSnap
              ? 'text-[#1F6F5C] dark:text-[#2B8570] bg-[#EBF3F0] dark:bg-[#1A2E28]'
              : 'hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
          }`}
        >
          <Grid size={14} strokeWidth={1.5} />
        </button>

        {/* Bounding box overlay toggle */}
        <button
          onClick={() => toggleOverlay('boundingBoxes')}
          title="Toggle bounding box outlines"
          className={`p-1.5 rounded-[4px] transition-colors ${
            overlays.boundingBoxes
              ? 'text-[#1F6F5C] dark:text-[#2B8570] bg-[#EBF3F0] dark:bg-[#1A2E28]'
              : 'hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
          }`}
        >
          <SquareDashed size={14} strokeWidth={1.5} />
        </button>

        {/* IDs overlay toggle */}
        <button
          onClick={() => toggleOverlay('ids')}
          title="Toggle shape ID labels"
          className={`p-1.5 rounded-[4px] transition-colors ${
            overlays.ids
              ? 'text-[#1F6F5C] dark:text-[#2B8570] bg-[#EBF3F0] dark:bg-[#1A2E28]'
              : 'hover:bg-[#FAFAF8] dark:hover:bg-[#282724] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
          }`}
        >
          <Tag size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Subtle Toast Notification per Section 7 */}
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1C1B19] dark:bg-[#EDEBE8] text-[#FAFAF8] dark:text-[#1C1B19] text-[12px] font-medium py-1.5 px-3.5 rounded-[6px] shadow-lg animate-toast z-30 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
