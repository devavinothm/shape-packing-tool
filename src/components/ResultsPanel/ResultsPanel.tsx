import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCw,
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
    <aside className="w-72 h-full border-l border-[#E7E5E0] dark:border-[#2D2C28] bg-[#FFFFFF] dark:bg-[#1E1D1B] flex flex-col shrink-0 select-none overflow-y-auto transition-colors">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#E7E5E0] dark:border-[#2D2C28] flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[#1C1B19] dark:text-[#EDEBE8] m-0">
          Results
        </h3>
        {validation.isValid ? (
          <span className="flex items-center gap-1 text-[11px] text-[#6B6860] dark:text-[#9E9B93]">
            <Check size={13} strokeWidth={2} className="text-[#1F6F5C] dark:text-[#2B8570]" />
            <span>No overlaps</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-[#C2453A] font-medium">
            <AlertCircle size={13} strokeWidth={1.5} />
            <span>Overlap detected</span>
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {/* Mode Selector */}
        <div>
          <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1">
            Fill mode
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#FAFAF8] dark:bg-[#151413] p-0.5 rounded-[6px] border border-[#E7E5E0] dark:border-[#2D2C28] text-[12px]">
            <button
              onClick={() => setCalcMode('mixed')}
              className={`py-1 rounded-[4px] font-medium transition-colors ${
                calcMode === 'mixed'
                  ? 'bg-[#FFFFFF] dark:bg-[#282724] text-[#1C1B19] dark:text-[#EDEBE8] shadow-xs'
                  : 'text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
              }`}
            >
              Mixed
            </button>
            <button
              onClick={() => setCalcMode('single')}
              className={`py-1 rounded-[4px] font-medium transition-colors ${
                calcMode === 'single'
                  ? 'bg-[#FFFFFF] dark:bg-[#282724] text-[#1C1B19] dark:text-[#EDEBE8] shadow-xs'
                  : 'text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
              }`}
            >
              Single max
            </button>
            <button
              onClick={() => setCalcMode('current')}
              className={`py-1 rounded-[4px] font-medium transition-colors ${
                calcMode === 'current'
                  ? 'bg-[#FFFFFF] dark:bg-[#282724] text-[#1C1B19] dark:text-[#EDEBE8] shadow-xs'
                  : 'text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]'
              }`}
            >
              Live
            </button>
          </div>
        </div>

        {/* Action Buttons based on Mode */}
        {calcMode === 'single' && (
          <div className="space-y-2 p-2.5 bg-[#FAFAF8] dark:bg-[#181716] rounded-[6px] border border-[#E7E5E0] dark:border-[#2D2C28]">
            <div>
              <label className="block text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1">
                Template
              </label>
              <select
                aria-label="Select shape template"
                value={selectedTemplateId || templates[0]?.id}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] px-2 py-1 text-[12px] text-[#1C1B19] dark:text-[#EDEBE8] focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570]"
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
              className="w-full h-9 bg-[#1F6F5C] hover:bg-[#185849] dark:bg-[#2B8570] dark:hover:bg-[#226B5A] disabled:opacity-50 text-white font-medium text-[12px] rounded-[6px] flex items-center justify-center transition-colors"
            >
              Compute maximum fit
            </button>
          </div>
        )}

        {calcMode === 'mixed' && (
          <div className="space-y-2">
            {/* Primary Button: Random Fill (solid accent, 36px tall, no gradient) */}
            <button
              onClick={handleRandomFillClick}
              disabled={isComputing || enabledTemplates.length === 0}
              className="w-full h-9 bg-[#1F6F5C] hover:bg-[#185849] dark:bg-[#2B8570] dark:hover:bg-[#226B5A] disabled:opacity-50 text-white font-medium text-[13px] rounded-[6px] flex items-center justify-center transition-colors"
            >
              Random fill
            </button>

            {/* Secondary Button: Best Fit (hairline border, white background) */}
            <button
              onClick={handleSmartFillClick}
              disabled={isComputing || enabledTemplates.length === 0}
              title="Tries several layouts and keeps the best one"
              className="w-full h-9 bg-[#FFFFFF] dark:bg-[#1E1D1B] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] border border-[#E7E5E0] dark:border-[#2D2C28] disabled:opacity-50 text-[#1C1B19] dark:text-[#EDEBE8] font-medium text-[13px] rounded-[6px] flex items-center justify-center transition-colors"
            >
              Best fit
            </button>
          </div>
        )}

        {/* Progress Bar / Cancel */}
        {isComputing && (
          <div className="p-2.5 bg-[#FAFAF8] dark:bg-[#181716] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px]">
            <div className="flex items-center justify-between text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw size={12} strokeWidth={1.5} className="animate-spin text-[#1F6F5C] dark:text-[#2B8570]" />
                Computing...
              </span>
              <button
                onClick={cancelCompute}
                className="text-[#C2453A] hover:text-[#A8372D] flex items-center gap-0.5"
              >
                <StopCircle size={12} strokeWidth={1.5} /> Cancel
              </button>
            </div>
            <div className="w-full bg-[#E7E5E0] dark:bg-[#2D2C28] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#1F6F5C] dark:bg-[#2B8570] h-full transition-all duration-150"
                style={{ width: `${computeProgress || 30}%` }}
              />
            </div>
          </div>
        )}

        {/* Collapsible Fill Options */}
        {calcMode === 'mixed' && (
          <div className="border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] bg-[#FFFFFF] dark:bg-[#1E1D1B] overflow-hidden text-[12px]">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8]"
            >
              <span>Fill options</span>
              {showAdvanced ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
            </button>

            {showAdvanced && (
              <div className="p-2.5 pt-1 border-t border-[#E7E5E0] dark:border-[#2D2C28] space-y-2">
                {/* Seed & Reroll */}
                <div>
                  <div className="flex justify-between text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
                    <span>Seed</span>
                    <button
                      onClick={rerollSeed}
                      className="text-[#1F6F5C] dark:text-[#2B8570] hover:underline flex items-center gap-0.5"
                    >
                      <RotateCw size={10} strokeWidth={1.5} /> Re-roll
                    </button>
                  </div>
                  <input
                    type="number"
                    value={rfSettings.seed}
                    onChange={(e) => setRfSettings({ seed: Number(e.target.value) })}
                    className="w-full bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] px-2 py-0.5 text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums text-[12px] focus:outline-none focus:border-[#1F6F5C]"
                  />
                </div>

                {/* Keep existing */}
                <label className="flex items-center gap-2 cursor-pointer text-[#6B6860] dark:text-[#9E9B93] text-[11px]">
                  <input
                    type="checkbox"
                    checked={rfSettings.keepExisting}
                    onChange={(e) => setRfSettings({ keepExisting: e.target.checked })}
                    className="accent-[#1F6F5C] dark:accent-[#2B8570] rounded"
                  />
                  <span>Keep existing shapes</span>
                </label>

                {/* Fill gaps only */}
                <label className="flex items-center gap-2 cursor-pointer text-[#6B6860] dark:text-[#9E9B93] text-[11px]">
                  <input
                    type="checkbox"
                    checked={rfSettings.fillGaps}
                    onChange={(e) => setRfSettings({ fillGaps: e.target.checked })}
                    className="accent-[#1F6F5C] dark:accent-[#2B8570] rounded"
                  />
                  <span>Micro-grid gap fill pass</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Plain stats sections without boxed cards per Section 4 & 6 */}
        <div className="space-y-3.5 pt-1">
          {/* Shapes Placed */}
          <div>
            <div className="text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-0.5">
              Shapes placed
            </div>
            <div className="text-[28px] font-medium text-[#1C1B19] dark:text-[#EDEBE8] font-mono tabular-nums leading-none">
              {liveStats.totalCount}
            </div>
          </div>

          {/* Space Used */}
          <div>
            <div className="flex justify-between text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1">
              <span>Space used</span>
              <span className="font-mono tabular-nums text-[#1C1B19] dark:text-[#EDEBE8]">
                {liveStats.utilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-[#E7E5E0] dark:bg-[#2D2C28] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1F6F5C] dark:bg-[#2B8570] transition-all duration-200"
                style={{ width: `${Math.min(100, liveStats.utilization)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#9E9B93] dark:text-[#6B6860] font-mono tabular-nums mt-1">
              <span>{Math.round(liveStats.usedArea)} {unit}² used</span>
              <span>{container.width * container.height} {unit}² box</span>
            </div>
          </div>

          <div className="border-t border-[#E7E5E0] dark:border-[#2D2C28]" />

          {/* Breakdown per shape */}
          <div>
            <div className="text-[11px] text-[#6B6860] dark:text-[#9E9B93] mb-1.5">
              Breakdown
            </div>
            <div className="space-y-1">
              {templates.map((tpl) => {
                const count = liveStats.countPerTemplate[tpl.id] || 0;
                return (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between text-[12px] py-0.5"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: tpl.color }}
                      />
                      <span className="text-[#6B6860] dark:text-[#9E9B93] truncate">
                        {tpl.name || tpl.type}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[#1C1B19] dark:text-[#EDEBE8]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Algorithm Info: ONLY display if a calculation has actually run! */}
          {stats && (
            <div className="border-t border-[#E7E5E0] dark:border-[#2D2C28] pt-2 text-[11px] text-[#9E9B93] dark:text-[#6B6860] space-y-0.5">
              <div>
                <span>Method: </span>
                <span className="text-[#6B6860] dark:text-[#9E9B93]">
                  {winningStrategy || stats.algorithm}
                </span>
              </div>
              <div>
                <span>Time: </span>
                <span className="font-mono tabular-nums text-[#6B6860] dark:text-[#9E9B93]">
                  {stats.computeTimeMs} ms
                </span>
              </div>
              {stats.seed !== undefined && (
                <div>
                  <span>Seed: </span>
                  <span className="font-mono tabular-nums text-[#6B6860] dark:text-[#9E9B93]">
                    {stats.seed}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Diagnostics Alert if invalid */}
          {!validation.isValid && (
            <div className="p-2 bg-[#FAF4F3] dark:bg-[#251A18] border border-[#E5BCB8] dark:border-[#4D2723] rounded-[6px] text-[11px] text-[#8C2C24] dark:text-[#E88E87] space-y-0.5">
              <div className="font-medium text-[#C2453A] flex items-center gap-1">
                <AlertCircle size={12} strokeWidth={1.5} /> Issue detected
              </div>
              {validation.overflows.length > 0 && (
                <div>{validation.overflows.length} shape(s) outside border</div>
              )}
              {validation.overlaps.length > 0 && (
                <div>{validation.overlaps.length} overlapping pair(s)</div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
