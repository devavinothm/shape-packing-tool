import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import type { ShapeType } from '../../core/types';
import { usePackingStore } from '../../state/usePackingStore';
import { TemplateCard } from './TemplateCard';

export const TemplateList: React.FC = () => {
  const { templates, addTemplate } = usePackingStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAdd = (type: ShapeType) => {
    addTemplate(type);
    setShowAddMenu(false);
  };

  const enabledCount = templates.filter((t) => t.enabled).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-semibold text-[#1C1B19] dark:text-[#EDEBE8] m-0">
            Shape templates
          </h3>
          <span className="text-[11px] font-mono text-[#6B6860] dark:text-[#9E9B93] tabular-nums">
            ({enabledCount}/{templates.length})
          </span>
        </div>

        {/* Add Template */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] hover:border-[#1F6F5C] dark:hover:border-[#2B8570] text-[#1C1B19] dark:text-[#EDEBE8] text-[12px] font-medium px-2 py-0.5 rounded-[4px] transition-colors"
          >
            <Plus size={13} strokeWidth={1.5} />
            <span>Add</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] shadow-lg py-1 z-30">
              <button
                onClick={() => handleAdd('square')}
                className="w-full px-3 py-1.5 text-[12px] text-left text-[#1C1B19] dark:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-[2px] bg-[#D98C6A]" />
                <span>Square</span>
              </button>
              <button
                onClick={() => handleAdd('rectangle')}
                className="w-full px-3 py-1.5 text-[12px] text-left text-[#1C1B19] dark:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] flex items-center gap-2"
              >
                <div className="w-3.5 h-2.5 rounded-[2px] bg-[#8FB39A]" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => handleAdd('circle')}
                className="w-full px-3 py-1.5 text-[12px] text-left text-[#1C1B19] dark:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-[#7C9CBF]" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => handleAdd('triangle')}
                className="w-full px-3 py-1.5 text-[12px] text-left text-[#1C1B19] dark:text-[#EDEBE8] hover:bg-[#F3F2EE] dark:hover:bg-[#282724] flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-[#E0B65A] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
                <span>Triangle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Templates list */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 space-y-2">
        {templates.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} />
        ))}
      </div>
    </div>
  );
};
