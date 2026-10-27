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

export const ShapeView: React.FC<Props> = ({
  shape,
  template,
  isSelected,
  isInvalid,
  onPointerDown,
}) => {
  const { overlays } = usePackingStore();
  const geo = getGeometry(template, shape);
  const box = getBoundingBox(template, shape);
  const dims = getTemplateDimensions(template);

  const fillColor = isInvalid ? '#ef4444' : template.color;
  const strokeColor = isInvalid
    ? '#ffffff'
    : isSelected
    ? '#38bdf8'
    : 'rgba(255, 255, 255, 0.4)';
  const strokeWidth = isSelected ? 2.5 : isInvalid ? 2 : 1;

  return (
    <g
      id={`placed-${shape.id}`}
      onPointerDown={onPointerDown}
      className="cursor-move select-none"
    >
      {/* Concrete Shape Element */}
      {geo.type === 'circle' ? (
        <circle
          cx={geo.cx}
          cy={geo.cy}
          r={geo.r}
          fill={fillColor}
          fillOpacity={isInvalid ? 0.85 : 0.75}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={isSelected ? '4 2' : undefined}
          className="transition-opacity hover:opacity-100"
        />
      ) : (
        <polygon
          points={geo.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
          fill={fillColor}
          fillOpacity={isInvalid ? 0.85 : 0.75}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={isSelected ? '4 2' : undefined}
          className="transition-opacity hover:opacity-100"
        />
      )}

      {/* Optional Overlay: Bounding Box */}
      {overlays.boundingBoxes && (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="2 2"
          pointerEvents="none"
        />
      )}

      {/* Optional Overlay: ID text label */}
      {overlays.ids && (
        <text
          x={shape.x + dims.width / 2}
          y={shape.y + dims.height / 2 + 3}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={10}
          fontWeight="bold"
          pointerEvents="none"
          className="drop-shadow"
        >
          {shape.id.replace(/^(rf|sf|max|gap|shape)-/, '')}
        </text>
      )}
    </g>
  );
};
