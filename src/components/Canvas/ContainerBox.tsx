import React from 'react';
import type { Container } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';

interface Props {
  container: Container;
  onResizeStart: (handle: string, e: React.PointerEvent) => void;
}

export const ContainerBox: React.FC<Props> = ({ container, onResizeStart }) => {
  const { unit, gridSnap, gridSize, theme } = usePackingStore();
  const { width, height } = container;

  const handleSize = 8; // Small 8px squares per prompt
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

  const isDark = theme === 'dark';
  const containerBg = isDark ? '#1C1B19' : '#FFFFFF';
  const containerBorder = isDark ? '#3E3C38' : '#33312E';
  const annotationColor = isDark ? '#7E7A72' : '#8A8780';
  const handleBorder = isDark ? '#4D4A45' : '#2D2C28';

  return (
    <g id="container-group">
      <defs>
        {/* Soft shadow for container box */}
        <filter id="container-shadow" x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity={isDark ? "0.3" : "0.06"} />
        </filter>

        {/* Diagonal hatch pattern for invalid / collision state */}
        <pattern id="invalid-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#C2453A" strokeWidth="2.5" strokeOpacity="0.35" />
        </pattern>

        {/* Grid pattern when enabled */}
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
              stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"}
              strokeWidth="1"
            />
          </pattern>
        )}
      </defs>

      {/* Main Container Rect with 1.5px crisp dark border */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={containerBg}
        stroke={containerBorder}
        strokeWidth={1.5}
        filter="url(#container-shadow)"
      />

      {/* Grid Pattern */}
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

      {/* Engineering Drawing Dimension Annotation (top edge) */}
      <g className="pointer-events-none select-none">
        {/* Extension ticks at corners */}
        <line x1={0} y1={-4} x2={0} y2={-16} stroke={annotationColor} strokeWidth={1} strokeOpacity={0.6} />
        <line x1={width} y1={-4} x2={width} y2={-16} stroke={annotationColor} strokeWidth={1} strokeOpacity={0.6} />
        {/* Horizontal dimension line with gaps for text */}
        <line x1={0} y1={-10} x2={width / 2 - 40} stroke={annotationColor} strokeWidth={1} strokeOpacity={0.4} />
        <line x1={width / 2 + 40} y1={-10} x2={width} stroke={annotationColor} strokeWidth={1} strokeOpacity={0.4} />

        <text
          x={width / 2}
          y={-7}
          textAnchor="middle"
          fill={annotationColor}
          fontSize={11}
          fontFamily="var(--font-mono)"
          fontWeight={500}
          className="tabular-nums"
        >
          {width} × {height} {unit}
        </text>
      </g>

      {/* 8 Resize Handles (small 8px white squares with 1px dark border) */}
      {handles.map((h) => (
        <rect
          key={h.id}
          x={h.x}
          y={h.y}
          width={handleSize}
          height={handleSize}
          fill={isDark ? '#2D2C28' : '#FFFFFF'}
          stroke={handleBorder}
          strokeWidth={1}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => onResizeStart(h.id, e)}
          className="transition-colors duration-100 hover:fill-[#1F6F5C] hover:stroke-[#1F6F5C]"
        />
      ))}
    </g>
  );
};
