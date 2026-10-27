import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
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
      className={`rounded-[8px] border transition-all duration-150 ${
        template.enabled
          ? 'bg-[#FFFFFF] dark:bg-[#1E1D1B] border-[#E7E5E0] dark:border-[#2D2C28]'
          : 'bg-[#FAFAF8] dark:bg-[#151413] border-[#E7E5E0] dark:border-[#2D2C28] opacity-50'
      }`}
    >
      {/* Card Header */}
      <div className="p-2 flex items-center justify-between gap-1.5">
        {/* Drag handle to drop onto canvas */}
        <div
          draggable
          onDragStart={handleDragStart}
          title="Drag into container canvas"
          className="cursor-grab active:cursor-grabbing p-1 text-[#9E9B93] dark:text-[#6B6860] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] rounded-[4px]"
        >
          <GripVertical size={13} strokeWidth={1.5} />
        </div>

        {/* Color badge & shape info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="color"
            value={template.color}
            onChange={(e) => updateTemplate(template.id, { color: e.target.value })}
            className="w-3.5 h-3.5 rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
            title="Change color"
          />
          <div className="truncate flex-1">
            <div className="text-[12px] font-medium text-[#1C1B19] dark:text-[#EDEBE8] leading-tight capitalize">
              {template.name || template.type}
            </div>
            <div className="text-[11px] font-mono text-[#6B6860] dark:text-[#9E9B93] tabular-nums leading-tight">
              {template.type === 'square' && `${template.params.size || 50}×${template.params.size || 50} ${unit}`}
              {template.type === 'rectangle' &&
                `${template.params.width || 80}×${template.params.height || 40} ${unit}`}
              {template.type === 'circle' && `r ${template.params.radius || 25} ${unit}`}
              {template.type === 'triangle' &&
                `b ${template.params.base || 60}, h ${template.params.height || 50} ${unit}`}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleAddDirectly}
            title="Place shape into center of container"
            className="p-1 rounded-[4px] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] transition-colors"
          >
            <Plus size={13} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Hide parameters' : 'Edit parameters'}
            className="p-1 rounded-[4px] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] transition-colors"
          >
            {isExpanded ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => duplicateTemplate(template.id)}
            title="Duplicate template"
            className="p-1 rounded-[4px] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] transition-colors"
          >
            <Copy size={12} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => deleteTemplate(template.id)}
            title="Delete template"
            className="p-1 rounded-[4px] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#C2453A] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] transition-colors"
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
          <input
            type="checkbox"
            checked={template.enabled}
            onChange={(e) => updateTemplate(template.id, { enabled: e.target.checked })}
            className="ml-1 w-3 h-3 accent-[#1F6F5C] dark:accent-[#2B8570] rounded cursor-pointer"
            title="Enable/disable shape in fill operations"
          />
        </div>
      </div>

      {/* Expanded Parameters */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-[#E7E5E0] dark:border-[#2D2C28] space-y-2 mt-0.5">
          {template.type === 'square' && (
            <div>
              <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                Size
              </label>
              <div className="relative flex items-center">
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
                  className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                />
                <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                  {unit}
                </span>
              </div>
            </div>
          )}

          {template.type === 'rectangle' && (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                  Width
                </label>
                <div className="relative flex items-center">
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
                    className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                  />
                  <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                    {unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                  Height
                </label>
                <div className="relative flex items-center">
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
                    className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                  />
                  <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                    {unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {template.type === 'circle' && (
            <div>
              <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                Radius
              </label>
              <div className="relative flex items-center">
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
                  className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                />
                <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                  {unit}
                </span>
              </div>
            </div>
          )}

          {template.type === 'triangle' && (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                  Base
                </label>
                <div className="relative flex items-center">
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
                    className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                  />
                  <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                    {unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                  Height
                </label>
                <div className="relative flex items-center">
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
                    className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2 pr-6 py-0.5 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
                  />
                  <span className="absolute right-2 text-[10px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none">
                    {unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Random Fill Weight Slider */}
          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
              <span>Pick weight</span>
              <span className="font-mono tabular-nums text-[#1C1B19] dark:text-[#EDEBE8]">{template.weight ?? 1}×</span>
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
              className="w-full accent-[#1F6F5C] dark:accent-[#2B8570] h-1 bg-[#E7E5E0] dark:bg-[#2D2C28] rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
