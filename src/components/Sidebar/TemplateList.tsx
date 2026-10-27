import { Circle, Plus, Shapes, Square, Triangle } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shapes size={16} className="text-purple-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 m-0">
            Shape Templates
          </h2>
          <span className="text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
            {enabledCount}/{templates.length}
          </span>
        </div>

        {/* Add Template dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2.5 py-1 rounded transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-30">
              <button
                onClick={() => handleAdd('square')}
                className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Square size={14} className="text-blue-400" />
                <span>Square</span>
              </button>
              <button
                onClick={() => handleAdd('rectangle')}
                className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <div className="w-3.5 h-2.5 border border-emerald-400 rounded-xs" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => handleAdd('circle')}
                className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Circle size={14} className="text-purple-400" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => handleAdd('triangle')}
                className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Triangle size={14} className="text-amber-400" />
                <span>Triangle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Templates list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {templates.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} />
        ))}
      </div>
    </div>
  );
};
