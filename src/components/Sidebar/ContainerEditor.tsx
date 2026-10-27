import { AlertTriangle, Lock, Unlock, Box } from 'lucide-react';
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
    <div className="p-4 border-b border-slate-700/60 bg-slate-800/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 m-0">
            Container Box
          </h2>
        </div>
        <button
          onClick={toggleAspectLock}
          title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          className={`p-1 rounded text-xs transition-colors ${
            aspectLocked
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
              : 'text-slate-400 hover:bg-slate-700'
          }`}
        >
          {aspectLocked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Width ({unit})
          </label>
          <input
            type="number"
            min={10}
            max={5000}
            value={container.width}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Height ({unit})
          </label>
          <input
            type="number"
            min={10}
            max={5000}
            value={container.height}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Preset dimension pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          [800, 600],
          [1000, 700],
          [600, 400],
          [500, 500],
        ].map(([w, h]) => (
          <button
            key={`${w}x${h}`}
            onClick={() => setPreset(w, h)}
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
              container.width === w && container.height === h
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {w}×{h}
          </button>
        ))}
      </div>

      {/* Shrink Warning Modal / Banner */}
      {pendingResize && (
        <div className="mt-3 p-3 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-200 text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
            <AlertTriangle size={15} />
            <span>Container Shrink Alert</span>
          </div>
          <p className="mb-2 leading-relaxed text-amber-200/90">
            Resizing to {pendingResize.width}×{pendingResize.height} leaves{' '}
            <strong>{shrinkWarningShapes.length}</strong> placed shape(s) outside bounds.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => confirmPendingResize(true)}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-medium py-1 px-2 rounded transition-colors"
            >
              Remove Outside
            </button>
            <button
              onClick={cancelPendingResize}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
