import { AlertCircle, Lock, Unlock } from 'lucide-react';
import React, { useState } from 'react';
import { usePackingStore } from '../../state/usePackingStore';

export const ContainerEditor: React.FC = () => {
  const {
    container,
    setContainer,
    pendingResize,
    shrinkWarningShapes,
    confirmPendingResize,
    cancelPendingResize,
    unit,
  } = usePackingStore();

  const [aspectLocked, setAspectLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(container.width / container.height);

  const handleWidthChange = (val: number) => {
    const width = Math.max(10, Math.min(5000, val));
    if (aspectLocked) {
      const height = Math.round(width / aspectRatio);
      setContainer({ width, height });
    } else {
      setContainer({ width });
      setAspectRatio(width / container.height);
    }
  };

  const handleHeightChange = (val: number) => {
    const height = Math.max(10, Math.min(5000, val));
    if (aspectLocked) {
      const width = Math.round(height * aspectRatio);
      setContainer({ width, height });
    } else {
      setContainer({ height });
      setAspectRatio(container.width / height);
    }
  };

  const toggleAspectLock = () => {
    if (!aspectLocked) {
      setAspectRatio(container.width / container.height);
    }
    setAspectLocked(!aspectLocked);
  };

  const setPreset = (w: number, h: number) => {
    setContainer({ width: w, height: h });
    setAspectRatio(w / h);
  };

  return (
    <div className="p-3.5 border-b border-[#E7E5E0] dark:border-[#2D2C28] bg-transparent">
      {/* Title & Lock */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[13px] font-semibold text-[#1C1B19] dark:text-[#EDEBE8] m-0">
          Container
        </h3>
        <button
          onClick={toggleAspectLock}
          title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          className={`p-1 rounded-[4px] text-[12px] transition-colors ${
            aspectLocked
              ? 'text-[#1F6F5C] dark:text-[#2B8570] bg-[#EBF3F0] dark:bg-[#1A2E28]'
              : 'text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
          }`}
        >
          {aspectLocked ? <Lock size={13} strokeWidth={1.5} /> : <Unlock size={13} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Width and Height Inputs with inline unit suffix */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div>
          <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1">
            Width
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min={10}
              max={5000}
              value={container.width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2.5 pr-7 py-1 text-[13px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
            />
            <span className="absolute right-2 text-[11px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none select-none">
              {unit}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1">
            Height
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min={10}
              max={5000}
              value={container.height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] pl-2.5 pr-7 py-1 text-[13px] text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
            />
            <span className="absolute right-2 text-[11px] text-[#9E9B93] dark:text-[#6B6860] pointer-events-none select-none">
              {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Preset dimension pills */}
      <div className="flex flex-wrap gap-1">
        {[
          [800, 600],
          [1000, 700],
          [600, 400],
          [500, 500],
        ].map(([w, h]) => {
          const isActive = container.width === w && container.height === h;
          return (
            <button
              key={`${w}x${h}`}
              onClick={() => setPreset(w, h)}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-[4px] border transition-colors ${
                isActive
                  ? 'bg-[#EBF3F0] dark:bg-[#1A2E28] border-[#1F6F5C] dark:border-[#2B8570] text-[#1F6F5C] dark:text-[#2B8570] font-medium'
                  : 'bg-[#FFFFFF] dark:bg-[#1E1D1B] border-[#E7E5E0] dark:border-[#2D2C28] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
              }`}
            >
              {w}×{h}
            </button>
          );
        })}
      </div>

      {/* Shrink Warning Alert */}
      {pendingResize && (
        <div className="mt-2.5 p-2.5 bg-[#FAF4F3] dark:bg-[#251A18] border border-[#E5BCB8] dark:border-[#4D2723] rounded-[6px] text-[12px] text-[#8C2C24] dark:text-[#E88E87]">
          <div className="flex items-center gap-1.5 font-medium text-[#C2453A] mb-1">
            <AlertCircle size={14} strokeWidth={1.5} />
            <span>Resize warning</span>
          </div>
          <p className="mb-2 leading-snug">
            {shrinkWarningShapes.length} shape{shrinkWarningShapes.length === 1 ? '' : 's'} will be
            outside the {pendingResize.width}×{pendingResize.height} boundary.
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => confirmPendingResize(true)}
              className="flex-1 bg-[#C2453A] hover:bg-[#A8372D] text-white font-medium py-1 px-2 rounded-[4px] text-[11px] transition-colors"
            >
              Remove outside
            </button>
            <button
              onClick={cancelPendingResize}
              className="flex-1 bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] py-1 px-2 rounded-[4px] text-[11px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
