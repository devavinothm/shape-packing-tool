import React from 'react';
import { getBoundingBox, getGeometry, getTemplateDimensions } from '../../core/geometry';
import type { PlacedShape, ShapeTemplate } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';

interface Props {
  shape: PlacedShape;
  template: ShapeTemplate;
  isSelected: boolean;
  isInvalid: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

// Slightly darken a hex color for the 1px outline
function getOutlineColor(hex: string): string {
  // Simple darkening of hex
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const num = parseInt(c, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * 0.8));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * 0.8));
  const b = Math.max(0, Math.floor((num & 0xff) * 0.8));
  return `rgb(${r}, ${g}, ${b})`;
}

export const ShapeView: React.FC<Props> = ({
  shape,
  template,
  isSelected,
  isInvalid,
  onPointerDown,
}) => {
  const { overlays, theme } = usePackingStore();
  const geo = getGeometry(template, shape);
  const box = getBoundingBox(template, shape);
  const dims = getTemplateDimensions(template);

  const baseFill = template.color;
  const outlineColor = getOutlineColor(baseFill);
  const isDark = theme === 'dark';

  // Fill and stroke selection
  const fillColor = isInvalid ? '#C2453A' : baseFill;
  const strokeColor = isInvalid
    ? '#8C2C24'
    : isSelected
    ? (isDark ? '#FFFFFF' : '#1C1B19')
    : outlineColor;
  const strokeWidth = isSelected ? 1.5 : 1;

  // Selected handle coordinates on bounding box
  const handleSize = 4;
  const halfH = handleSize / 2;
  const handles = isSelected
    ? [
        { x: box.x - halfH, y: box.y - halfH },
        { x: box.x + box.width - halfH, y: box.y - halfH },
        { x: box.x + box.width - halfH, y: box.y + box.height - halfH },
        { x: box.x - halfH, y: box.y + box.height - halfH },
      ]
    : [];

  return (
    <g
      id={`placed-${shape.id}`}
      onPointerDown={onPointerDown}
      className="cursor-move select-none transition-transform duration-100"
    >
      {/* Base Shape */}
      {geo.type === 'circle' ? (
        <>
          <circle
            cx={geo.cx}
            cy={geo.cy}
            r={geo.r}
            fill={fillColor}
            fillOpacity={isInvalid ? 0.35 : 0.85}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Diagonal hatch pattern overlay when invalid */}
          {isInvalid && (
            <circle
              cx={geo.cx}
              cy={geo.cy}
              r={geo.r}
              fill="url(#invalid-hatch)"
              pointerEvents="none"
            />
          )}
        </>
      ) : (
        <>
          <polygon
            points={geo.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
            fill={fillColor}
            fillOpacity={isInvalid ? 0.35 : 0.85}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Diagonal hatch pattern overlay when invalid */}
          {isInvalid && (
            <polygon
              points={geo.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
              fill="url(#invalid-hatch)"
              pointerEvents="none"
            />
          )}
        </>
      )}

      {/* Selected handles (small 4px neutral squares) */}
      {isSelected &&
        handles.map((h, i) => (
          <rect
            key={i}
            x={h.x}
            y={h.y}
            width={handleSize}
            height={handleSize}
            fill={isDark ? '#EDEBE8' : '#1C1B19'}
            pointerEvents="none"
          />
        ))}

      {/* Optional Overlay: Bounding Box */}
      {overlays.boundingBoxes && (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill="none"
          stroke={isDark ? '#6B6860' : '#9E9B93'}
          strokeWidth={1}
          strokeDasharray="2 2"
          pointerEvents="none"
        />
      )}

      {/* Optional Overlay: ID text label */}
      {overlays.ids && (
        <text
          x={shape.x + dims.width / 2}
          y={shape.y + dims.height / 2 + 3.5}
          textAnchor="middle"
          fill={isDark ? '#FFFFFF' : '#1C1B19'}
          fontSize={10}
          fontFamily="var(--font-mono)"
          fontWeight={500}
          pointerEvents="none"
          className="tabular-nums"
        >
          {shape.id.replace(/^(rf|sf|max|gap|shape)-/, '')}
        </text>
      )}
    </g>
  );
};
