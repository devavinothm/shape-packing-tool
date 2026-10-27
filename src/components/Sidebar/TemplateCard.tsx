import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { getTemplateDimensions } from '../../core/geometry';
import type { ShapeTemplate } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';

interface Props {
  template: ShapeTemplate;
}

export const TemplateCard: React.FC<Props> = ({ template }) => {
  const { updateTemplate, duplicateTemplate, deleteTemplate, addPlacedShape, container, unit } =
    usePackingStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const dims = getTemplateDimensions(template);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ templateId: template.id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddDirectly = () => {
    addPlacedShape({
      templateId: template.id,
      x: Math.max(0, Math.floor((container.width - dims.width) / 2)),
      y: Math.max(0, Math.floor((container.height - dims.height) / 2)),
      rotation: 0,
    });
  };

  return (
    <div
      className={`rounded-lg border transition-all ${
        template.enabled
          ? 'bg-slate-800/80 border-slate-700/80 shadow-sm'
          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
      }`}
    >
      {/* Top Header */}
      <div className="p-2.5 flex items-center justify-between gap-2">
        {/* Drag handle to drop onto canvas */}
        <div
          draggable
          onDragStart={handleDragStart}
          title="Drag into container canvas to place instance"
          className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded"
        >
          <GripVertical size={14} />
        </div>

        {/* Color picker & shape name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="color"
            value={template.color}
            onChange={(e) => updateTemplate(template.id, { color: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            title="Change shape color"
          />
          <div className="truncate">
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {template.name || template.type}
            </span>
            <div className="text-[10px] text-slate-400">
              {template.type === 'square' && `size: ${template.params.size || 50} ${unit}`}
              {template.type === 'rectangle' &&
                `${template.params.width || 80} × ${template.params.height || 40} ${unit}`}
              {template.type === 'circle' && `r: ${template.params.radius || 25} ${unit}`}
              {template.type === 'triangle' &&
                `b: ${template.params.base || 60}, h: ${template.params.height || 50} ${unit}`}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddDirectly}
            title="Place shape into center of container"
            className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => duplicateTemplate(template.id)}
            title="Duplicate template"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => deleteTemplate(template.id)}
            title="Delete template"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 size={13} />
          </button>
          <input
            type="checkbox"
            checked={template.enabled}
            onChange={(e) => updateTemplate(template.id, { enabled: e.target.checked })}
            className="ml-1 w-3.5 h-3.5 accent-indigo-500 rounded cursor-pointer"
            title="Enable/disable template in auto-fill"
          />
        </div>
      </div>

      {/* Mini SVG Preview & Toggle details */}
      <div className="px-3 pb-2.5">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between text-[11px] text-slate-400 cursor-pointer hover:text-slate-300 select-none"
        >
          <span>{isExpanded ? 'Hide parameters' : 'Edit parameters'}</span>
          <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-2.5">
            {/* Dynamic Parameter inputs */}
            {template.type === 'square' && (
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Size ({unit})</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(container.width, container.height)}
                  value={template.params.size || 50}
                  onChange={(e) =>
                    updateTemplate(template.id, {
                      params: { ...template.params, size: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            )}

            {template.type === 'rectangle' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Width ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={container.width}
                    value={template.params.width || 80}
                    onChange={(e) =>
                      updateTemplate(template.id, {
                        params: { ...template.params, width: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Height ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={container.height}
                    value={template.params.height || 40}
                    onChange={(e) =>
                      updateTemplate(template.id, {
                        params: { ...template.params, height: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {template.type === 'circle' && (
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Radius ({unit})</label>
                <input
                  type="number"
                  min={1}
                  max={Math.min(container.width, container.height) / 2}
                  value={template.params.radius || 25}
                  onChange={(e) =>
                    updateTemplate(template.id, {
                      params: { ...template.params, radius: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            )}

            {template.type === 'triangle' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Base ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={container.width}
                    value={template.params.base || 60}
                    onChange={(e) =>
                      updateTemplate(template.id, {
                        params: { ...template.params, base: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Height ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={container.height}
                    value={template.params.height || 50}
                    onChange={(e) =>
                      updateTemplate(template.id, {
                        params: { ...template.params, height: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Random Fill Weight Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Pick Probability Weight</span>
                <span className="font-mono text-slate-300">{template.weight ?? 1}x</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={template.weight ?? 1}
                onChange={(e) =>
                  updateTemplate(template.id, { weight: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
