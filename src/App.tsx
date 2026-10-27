import { BarChart2, Layers } from 'lucide-react';
import React, { useState } from 'react';
import { PackingCanvas } from './components/Canvas/PackingCanvas';
import { Header } from './components/Header';
import { ResultsPanel } from './components/ResultsPanel/ResultsPanel';
import { ContainerEditor } from './components/Sidebar/ContainerEditor';
import { TemplateList } from './components/Sidebar/TemplateList';
import { usePackingStore } from './state/usePackingStore';

export const App: React.FC = () => {
  const { theme } = usePackingStore();
  const [mobileDrawer, setMobileDrawer] = useState<'sidebar' | 'results' | null>(null);

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Top Header */}
      <Header />

      {/* Main 3-Zone Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar: Container & Templates */}
        <aside
          className={`w-72 h-full border-r border-slate-700/60 bg-slate-900/90 backdrop-blur flex flex-col shrink-0 z-10 transition-transform duration-200 md:translate-x-0 ${
            mobileDrawer === 'sidebar' ? 'translate-x-0 absolute inset-y-0 left-0 shadow-2xl' : '-translate-x-full md:relative'
          }`}
        >
          <ContainerEditor />
          <TemplateList />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 h-full relative flex flex-col min-w-0">
          <PackingCanvas />

          {/* Mobile responsive toggle drawer buttons (< 900px) */}
          <div className="md:hidden absolute top-4 right-4 flex items-center gap-2 z-20">
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'sidebar' ? null : 'sidebar')}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 shadow-lg text-xs flex items-center gap-1"
            >
              <Layers size={14} /> Shapes
            </button>
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'results' ? null : 'results')}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 shadow-lg text-xs flex items-center gap-1"
            >
              <BarChart2 size={14} /> Results
            </button>
          </div>
        </main>

        {/* Right Panel: Results & Calculation */}
        <div
          className={`h-full z-10 transition-transform duration-200 lg:translate-x-0 ${
            mobileDrawer === 'results' ? 'translate-x-0 absolute inset-y-0 right-0 shadow-2xl' : 'translate-x-full lg:relative'
          }`}
        >
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
