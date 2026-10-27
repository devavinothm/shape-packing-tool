import React from 'react';
import type { Container } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';

interface Props {
  container: Container;
  onResizeStart: (handle: string, e: React.PointerEvent) => void;
}

export const ContainerBox: React.FC<Props> = ({ container, onResizeStart }) => {
  const { unit, gridSnap, gridSize } = usePackingStore();
  const { width, height } = container;

  const handleSize = 10;
  const half = handleSize / 2;

  // 8 resize handle coordinates
  const handles = [
    { id: 'nw', x: -half, y: -half, cursor: 'nwse-resize' },
    { id: 'n', x: width / 2 - half, y: -half, cursor: 'ns-resize' },
    { id: 'ne', x: width - half, y: -half, cursor: 'nesw-resize' },
    { id: 'e', x: width - half, y: height / 2 - half, cursor: 'ew-resize' },
    { id: 'se', x: width - half, y: height - half, cursor: 'nwse-resize' },
    { id: 's', x: width / 2 - half, y: height - half, cursor: 'ns-resize' },
    { id: 'sw', x: -half, y: height - half, cursor: 'nesw-resize' },
    { id: 'w', x: -half, y: height / 2 - half, cursor: 'ew-resize' },
  ];

  return (
    <g id="container-group">
      {/* Container Background & Grid */}
      <defs>
        {gridSnap && (
          <pattern
            id="canvas-grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>
        )}
      </defs>

      {/* Main Container Rect */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#0f172a"
        stroke="#4f46e5"
        strokeWidth={2}
        className="shadow-2xl"
      />

      {gridSnap && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#canvas-grid)"
          pointerEvents="none"
        />
      )}

      {/* Dimension Label Tag */}
      <g transform={`translate(${width / 2}, -12)`} className="pointer-events-none select-none">
        <text
          textAnchor="middle"
          fill="#a5b4fc"
          fontSize={12}
          fontWeight="600"
          className="font-mono tracking-wide"
        >
          {width} × {height} {unit}
        </text>
      </g>

      {/* 8 Resize Handles */}
      {handles.map((h) => (
        <rect
          key={h.id}
          x={h.x}
          y={h.y}
          width={handleSize}
          height={handleSize}
          rx={2}
          fill="#ffffff"
          stroke="#4f46e5"
          strokeWidth={2}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => onResizeStart(h.id, e)}
          className="transition-transform hover:scale-125"
        />
      ))}
    </g>
  );
};
