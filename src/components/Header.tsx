import {
  Download,
  FileCode,
  Image as ImageIcon,
  Moon,
  Redo2,
  RotateCcw,
  Sun,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import React, { useRef } from 'react';
import { usePackingStore, type UnitType } from '../state/usePackingStore';
import {
  exportCanvasToPNG,
  exportCanvasToSVG,
  exportLayoutToJSON,
  parseLayoutJSON,
} from '../utils/exportImport';

export const Header: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    container,
    templates,
    placedShapes,
    past,
    future,
    undo,
    redo,
    unit,
    setUnit,
    theme,
    setTheme,
    resetToDefaults,
    clearPlacedShapes,
    showToast,
  } = usePackingStore();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseLayoutJSON(text);
        usePackingStore.setState({
          container: parsed.container,
          templates: parsed.templates,
          placedShapes: parsed.placedShapes,
          selectedIds: [],
        });
        showToast('Layout imported successfully');
      } catch (err) {
        alert('Failed to parse layout file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    exportLayoutToJSON(container, templates, placedShapes);
    showToast('Exported layout to JSON');
  };

  const handleExportSVG = () => {
    const svg = document.getElementById('packing-canvas-svg') as SVGSVGElement | null;
    if (!svg) return;
    exportCanvasToSVG(svg, `shape-packing-${container.width}x${container.height}.svg`);
    showToast('Exported canvas to SVG');
  };

  const handleExportPNG = () => {
    const svg = document.getElementById('packing-canvas-svg') as SVGSVGElement | null;
    if (!svg) return;
    exportCanvasToPNG(svg, container.width, container.height);
    showToast('Exported canvas to PNG');
  };

  const loadPreset = (presetName: string) => {
    if (presetName === 'hex-circles') {
      usePackingStore.setState({
        container: { width: 600, height: 400 },
        selectedTemplateId: 'tpl-circ',
      });
      usePackingStore.getState().runSingleMax();
    } else if (presetName === 'tri-tiles') {
      usePackingStore.setState({
        container: { width: 700, height: 450 },
        selectedTemplateId: 'tpl-tri',
      });
      usePackingStore.getState().runSingleMax();
    } else if (presetName === 'mixed-box') {
      usePackingStore.setState({
        container: { width: 800, height: 600 },
      });
      usePackingStore.getState().runSmartFill();
    }
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const cmdKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <header className="h-12 border-b border-[#E7E5E0] dark:border-[#2D2C28] bg-[#FFFFFF] dark:bg-[#1E1D1B] px-4 flex items-center justify-between select-none z-20 shrink-0 text-[#1C1B19] dark:text-[#EDEBE8] transition-colors">
      {/* Brand & Monogram Glyph */}
      <div className="flex items-center gap-2.5">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0 text-[#1F6F5C] dark:text-[#2B8570]"
        >
          <rect x="1" y="1" width="18" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6.5" y="6.5" width="7" height="7" rx="1.5" fill="currentColor" />
        </svg>
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#1C1B19] dark:text-[#EDEBE8]">
          Shape Packing Tool
        </span>
      </div>

      {/* Center Actions: Undo / Redo / History */}
      <div className="flex items-center gap-0.5 border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] p-0.5 bg-[#FAFAF8] dark:bg-[#181716]">
        <button
          onClick={undo}
          disabled={past.length === 0}
          title={`Undo (${cmdKey}Z)`}
          className="p-1.5 rounded-[4px] hover:bg-[#FFFFFF] dark:hover:bg-[#21201D] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 size={15} strokeWidth={1.5} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title={`Redo (${cmdKey}Shift+Z)`}
          className="p-1.5 rounded-[4px] hover:bg-[#FFFFFF] dark:hover:bg-[#21201D] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 size={15} strokeWidth={1.5} />
        </button>
        <div className="w-px h-3.5 bg-[#E7E5E0] dark:bg-[#2D2C28] mx-0.5" />
        <button
          onClick={clearPlacedShapes}
          disabled={placedShapes.length === 0}
          title="Clear shapes from canvas"
          className="px-2 py-1 text-[12px] rounded-[4px] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#C2453A] hover:bg-[#FFFFFF] dark:hover:bg-[#21201D] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6B6860] transition-colors"
        >
          <Trash2 size={13} strokeWidth={1.5} className="inline mr-1" />
          Clear
        </button>
        <button
          onClick={resetToDefaults}
          title="Reset to defaults"
          className="p-1.5 rounded-[4px] hover:bg-[#FFFFFF] dark:hover:bg-[#21201D] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          <RotateCcw size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Right Controls: Examples, Units, Export/Import, Theme */}
      <div className="flex items-center gap-2">
        {/* Examples dropdown per Section 5 copy */}
        <select
          aria-label="Examples"
          onChange={(e) => {
            if (e.target.value) {
              loadPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="text-[12px] bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] text-[#1C1B19] dark:text-[#EDEBE8] rounded-[6px] px-2.5 py-1 focus:outline-none focus:border-[#1F6F5C] dark:focus:border-[#2B8570] cursor-pointer"
        >
          <option value="" disabled>
            Examples
          </option>
          <option value="hex-circles">Circles (hexagonal)</option>
          <option value="tri-tiles">Triangles (interlocking)</option>
          <option value="mixed-box">Mixed shapes (best fit)</option>
        </select>

        {/* Units Selector */}
        <div className="flex items-center text-[12px] bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] px-2 py-1">
          <span className="text-[#6B6860] dark:text-[#9E9B93] mr-1.5">Unit</span>
          <select
            value={unit}
            aria-label="Measurement Unit"
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="bg-transparent text-[#1C1B19] dark:text-[#EDEBE8] font-mono focus:outline-none cursor-pointer"
          >
            <option value="px">px</option>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="in">in</option>
          </select>
        </div>

        {/* Export / Import group */}
        <div className="flex items-center border border-[#E7E5E0] dark:border-[#2D2C28] rounded-[6px] p-0.5 bg-[#FFFFFF] dark:bg-[#1E1D1B]">
          <button
            onClick={handleImportClick}
            title="Import layout (JSON)"
            className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
          >
            <Upload size={14} strokeWidth={1.5} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleExportJSON}
            title="Export layout as JSON"
            className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
          >
            <Download size={14} strokeWidth={1.5} />
          </button>

          <button
            onClick={handleExportSVG}
            title="Export vector (SVG)"
            className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
          >
            <FileCode size={14} strokeWidth={1.5} />
          </button>

          <button
            onClick={handleExportPNG}
            title="Export image (PNG)"
            className="p-1.5 rounded-[4px] hover:bg-[#FAFAF8] dark:hover:bg-[#282724] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
          >
            <ImageIcon size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-1.5 rounded-[6px] border border-[#E7E5E0] dark:border-[#2D2C28] bg-[#FFFFFF] dark:bg-[#1E1D1B] text-[#6B6860] dark:text-[#9E9B93] hover:text-[#1C1B19] dark:hover:text-[#EDEBE8] transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
};
