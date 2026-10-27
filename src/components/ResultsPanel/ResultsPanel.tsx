import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dices,
  Play,
  RotateCw,
  Sparkles,
  StopCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { usePackingStore } from '../../state/usePackingStore';

export const ResultsPanel: React.FC = () => {
  const {
    container,
    templates,
    placedShapes,
    calcMode,
    setCalcMode,
    selectedTemplateId,
    setSelectedTemplateId,
    rfSettings,
    setRfSettings,
    rerollSeed,
    runRandomFill,
    runSmartFill,
    runSingleMax,
    cancelCompute,
    isComputing,
    computeProgress,
    stats,
    winningStrategy,
    unit,
    getValidation,
    getLiveStats,
  } = usePackingStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const liveStats = getLiveStats();
  const validation = getValidation();
  const enabledTemplates = templates.filter((t) => t.enabled);

  const handleRandomFillClick = () => {
    if (placedShapes.length > 0 && !rfSettings.keepExisting) {
      if (!confirm('This will replace current placed shapes. Continue?')) {
        return;
      }
    }
    runRandomFill();
  };

  const handleSmartFillClick = () => {
    if (placedShapes.length > 0 && !rfSettings.keepExisting) {
      if (!confirm('This will replace current placed shapes. Continue?')) {
        return;
      }
    }
    runSmartFill();
  };

  return (
    <aside className="w-80 h-full border-l border-slate-700/60 bg-slate-900/90 backdrop-blur flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Panel Title */}
      <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 m-0">
            Calculation & Results
          </h2>
        </div>
        {validation.isValid ? (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <CheckCircle2 size={12} /> Valid Layout
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
            <AlertCircle size={12} /> Invalid
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Mode Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
            Calculation Mode
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setCalcMode('mixed')}
              className={`py-1 rounded font-medium transition-colors ${
                calcMode === 'mixed'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mixed Fill
            </button>
            <button
              onClick={() => setCalcMode('single')}
              className={`py-1 rounded font-medium transition-colors ${
                calcMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Max
            </button>
            <button
              onClick={() => setCalcMode('current')}
              className={`py-1 rounded font-medium transition-colors ${
                calcMode === 'current'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Count
            </button>
          </div>
        </div>

        {/* Action Buttons based on Mode */}
        {calcMode === 'single' && (
          <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Select Shape Template
              </label>
              <select
                aria-label="Select Shape Template for Single Max"
                value={selectedTemplateId || templates[0]?.id}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.type} ({t.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={runSingleMax}
              disabled={isComputing || templates.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Play size={14} />
              <span>Compute Single Shape Max</span>
            </button>
          </div>
        )}

        {calcMode === 'mixed' && (
          <div className="space-y-2">
            {/* Random Fill Button */}
            <button
              onClick={handleRandomFillClick}
              disabled={isComputing || enabledTemplates.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
            >
              <Dices size={16} />
              <span>Random Fill (One-Click)</span>
            </button>

            {/* Smart Fill Button */}
            <button
              onClick={handleSmartFillClick}
              disabled={isComputing || enabledTemplates.length === 0}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:opacity-50 text-slate-200 font-medium text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>Smart Fill (Heuristic)</span>
            </button>
          </div>
        )}

        {/* Progress Bar / Cancel */}
        {isComputing && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-lg">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw size={13} className="animate-spin text-indigo-400" />
                Computing Packing...
              </span>
              <button
                onClick={cancelCompute}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <StopCircle size={13} /> Cancel
              </button>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-150"
                style={{ width: `${computeProgress || 30}%` }}
              />
            </div>
          </div>
        )}

        {/* Collapsible Advanced Random Fill Settings */}
        {calcMode === 'mixed' && (
          <div className="border border-slate-700/50 rounded-lg bg-slate-800/30 overflow-hidden text-xs">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3 py-2 flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            >
              <span>Advanced Fill Settings</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div className="p-3 pt-1 border-t border-slate-700/40 space-y-2.5">
                {/* Seed & Reroll */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Seed</span>
                    <button
                      onClick={rerollSeed}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                    >
                      <RotateCw size={11} /> Re-roll
                    </button>
                  </div>
                  <input
                    type="number"
                    value={rfSettings.seed}
                    onChange={(e) => setRfSettings({ seed: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>

                {/* Max attempts */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    value={rfSettings.maxAttempts}
                    onChange={(e) => setRfSettings({ maxAttempts: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>

                {/* Failure threshold */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Failure Threshold (Stop limit)
                  </label>
                  <input
                    type="number"
                    value={rfSettings.failureThreshold}
                    onChange={(e) => setRfSettings({ failureThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>

                {/* Keep existing */}
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rfSettings.keepExisting}
                    onChange={(e) => setRfSettings({ keepExisting: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Keep existing shapes</span>
                </label>

                {/* Fill gaps only */}
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rfSettings.fillGaps}
                    onChange={(e) => setRfSettings({ fillGaps: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Fine-grid gap fill pass</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Live / Computed Results Cards */}
        <div className="space-y-3 pt-1">
          {/* Total Shape Count Card */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Total Placed Count
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white font-mono">
                {liveStats.totalCount}
              </span>
              <span className="text-xs text-slate-400">shapes</span>
            </div>
          </div>

          {/* Area Utilization Card */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2">
            <div className="flex justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span>Area Utilization</span>
              <span className="text-slate-200 font-mono font-bold">
                {liveStats.utilization.toFixed(1)}%
              </span>
            </div>
            {/* Progress meter */}
            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  liveStats.utilization > 80
                    ? 'bg-emerald-500'
                    : liveStats.utilization > 50
                    ? 'bg-indigo-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, liveStats.utilization)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Used: {Math.round(liveStats.usedArea)} {unit}²</span>
              <span>Total: {container.width * container.height} {unit}²</span>
            </div>
          </div>

          {/* Count Per Shape Type */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Count Per Template
            </div>
            <div className="space-y-1.5">
              {templates.map((tpl) => {
                const count = liveStats.countPerTemplate[tpl.id] || 0;
                return (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/80 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tpl.color }}
                      />
                      <span className="text-slate-300 truncate">{tpl.name || tpl.type}</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winning Strategy / Algorithm Metadata */}
          <div className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-lg text-xs space-y-1 text-slate-400">
            <div>
              <span className="text-slate-500">Algorithm: </span>
              <span className="text-slate-300 font-medium">
                {winningStrategy || liveStats.algorithm}
              </span>
            </div>
            {stats && (
              <>
                <div>
                  <span className="text-slate-500">Compute Time: </span>
                  <span className="text-slate-300 font-mono">{stats.computeTimeMs} ms</span>
                </div>
                {stats.seed !== undefined && (
                  <div>
                    <span className="text-slate-500">Seed: </span>
                    <span className="text-slate-300 font-mono">{stats.seed}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Diagnostic Warnings */}
          {!validation.isValid && (
            <div className="p-3 bg-rose-950/40 border border-rose-600/50 rounded-lg text-xs text-rose-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-300">
                <AlertCircle size={14} /> Layout Diagnostics
              </div>
              {validation.overflows.length > 0 && (
                <p>
                  <strong>{validation.overflows.length}</strong> shape(s) crossing container edges.
                </p>
              )}
              {validation.overlaps.length > 0 && (
                <p>
                  <strong>{validation.overlaps.length}</strong> overlapping shape pair(s).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
