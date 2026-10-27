import {
  Download,
  FolderOpen,
  Image,
  Moon,
  Redo2,
  RotateCcw,
  Sun,
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
      } catch (err) {
        alert('Failed to parse layout file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    exportLayoutToJSON(container, templates, placedShapes);
  };

  const handleExportSVG = () => {
    const svg = document.getElementById('packing-canvas-svg') as SVGSVGElement | null;
    if (!svg) {
      alert('Canvas SVG not found');
      return;
    }
    exportCanvasToSVG(svg, `shape-packing-${container.width}x${container.height}.svg`);
  };

  const handleExportPNG = () => {
    const svg = document.getElementById('packing-canvas-svg') as SVGSVGElement | null;
    if (!svg) {
      alert('Canvas SVG not found');
      return;
    }
    exportCanvasToPNG(svg, container.width, container.height);
  };

  // Preset demo layouts
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

  return (
    <header className="h-14 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between select-none z-20 shrink-0 text-slate-200">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
          SP
        </div>
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight leading-none m-0">
            Shape Packing Tool
          </h1>
          <span className="text-xs text-slate-400">2D Container Fill Calculator</span>
        </div>
      </div>

      {/* Center Actions: Undo / Redo / History */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
        <button
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (Ctrl/Cmd+Z)"
          className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition-colors"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition-colors"
        >
          <Redo2 size={16} />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          onClick={clearPlacedShapes}
          disabled={placedShapes.length === 0}
          title="Clear placed shapes"
          className="px-2 py-1 text-xs rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40"
        >
          Clear Shapes
        </button>
        <button
          onClick={resetToDefaults}
          title="Reset to default container and shapes"
          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Right Controls: Presets, Units, Import/Export, Theme */}
      <div className="flex items-center gap-2">
        {/* Presets dropdown */}
        <select
          aria-label="Preset Layouts"
          onChange={(e) => {
            if (e.target.value) {
              loadPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="" disabled>
            ⚡ Demo Presets
          </option>
          <option value="hex-circles">Hexagonal Circle Array</option>
          <option value="tri-tiles">Interlocking Triangles</option>
          <option value="mixed-box">Mixed Shapes (Smart Fill)</option>
        </select>

        {/* Units Dropdown */}
        <div className="flex items-center text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded px-2 py-1">
          <span className="mr-1.5 font-medium">Unit:</span>
          <select
            value={unit}
            aria-label="Measurement Unit"
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="px" className="bg-slate-800 text-slate-200">px</option>
            <option value="mm" className="bg-slate-800 text-slate-200">mm</option>
            <option value="cm" className="bg-slate-800 text-slate-200">cm</option>
            <option value="in" className="bg-slate-800 text-slate-200">in</option>
          </select>
        </div>

        {/* Export / Import */}
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded p-0.5">
          <button
            onClick={handleImportClick}
            title="Import layout from JSON"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Upload size={15} />
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
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Download size={15} />
          </button>

          <button
            onClick={handleExportSVG}
            title="Export as SVG"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <FolderOpen size={15} />
          </button>

          <button
            onClick={handleExportPNG}
            title="Export as PNG"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Image size={15} />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
