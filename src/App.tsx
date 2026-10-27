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
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${
        theme === 'dark' ? 'dark bg-[#151413] text-[#EDEBE8]' : 'bg-[#FAFAF8] text-[#1C1B19]'
      }`}
    >
      {/* Top Header */}
      <Header />

      {/* Main 3-Zone Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar: Container & Templates */}
        <aside
          className={`w-[270px] h-full border-r border-[#E7E5E0] dark:border-[#2D2C28] bg-[#FFFFFF] dark:bg-[#1E1D1B] flex flex-col shrink-0 z-10 transition-transform duration-150 md:translate-x-0 ${
            mobileDrawer === 'sidebar'
              ? 'translate-x-0 absolute inset-y-0 left-0 shadow-lg'
              : '-translate-x-full md:relative'
          }`}
        >
          <ContainerEditor />
          <TemplateList />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 h-full relative flex flex-col min-w-0">
          <PackingCanvas />

          {/* Mobile responsive drawer toggles (< 900px) */}
          <div className="md:hidden absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'sidebar' ? null : 'sidebar')}
              className="px-2.5 py-1 rounded-[6px] bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] text-[#1C1B19] dark:text-[#EDEBE8] shadow-xs text-[12px] flex items-center gap-1"
            >
              <Layers size={13} strokeWidth={1.5} /> Shapes
            </button>
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'results' ? null : 'results')}
              className="px-2.5 py-1 rounded-[6px] bg-[#FFFFFF] dark:bg-[#1E1D1B] border border-[#E7E5E0] dark:border-[#2D2C28] text-[#1C1B19] dark:text-[#EDEBE8] shadow-xs text-[12px] flex items-center gap-1"
            >
              <BarChart2 size={13} strokeWidth={1.5} /> Results
            </button>
          </div>
        </main>

        {/* Right Panel: Results */}
        <div
          className={`h-full z-10 transition-transform duration-150 lg:translate-x-0 ${
            mobileDrawer === 'results'
              ? 'translate-x-0 absolute inset-y-0 right-0 shadow-lg'
              : 'translate-x-full lg:relative'
          }`}
        >
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
