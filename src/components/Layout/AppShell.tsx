import { useState, useEffect } from 'react';
import { GridEditor } from '../Editor/GridEditor';
import { Toolbar } from '../Editor/Toolbar';
import { ColorPalettePanel } from '../Panels/ColorPalettePanel';
import { StitchPanel } from '../Panels/StitchPanel';
import { ProjectPanel } from '../Panels/ProjectPanel';
import { ExportPanel } from '../Export/ExportPanel';
import { HomeScreen } from '../Home/HomeScreen';
import { useProjectStore } from '../../store/projectStore';
import type { Tool } from '../../types';

type PanelId = 'project' | 'colors' | 'stitches' | 'export';

const TOOL_KEYS: Record<string, Tool> = {
  p: 'pencil',
  e: 'eraser',
  f: 'fill',
  l: 'line',
  i: 'eyedropper',
  h: 'hand',
};

export function AppShell() {
  const [activePanel, setActivePanel] = useState<PanelId>('colors');
  const { project, setActiveTool } = useProjectStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const tool = TOOL_KEYS[e.key.toLowerCase()];
      if (tool) setActiveTool(tool);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool]);

  const tabs: { id: PanelId; label: string }[] = [
    { id: 'project', label: 'Project' },
    { id: 'colors', label: 'Colors' },
    { id: 'stitches', label: 'Stitches' },
    { id: 'export', label: 'Export' },
  ];

  const header = (
    <header className="bg-ink text-white px-5 py-3 flex items-center gap-2.5 flex-shrink-0">
      <span className="font-serif text-thread text-xl leading-none select-none">×</span>
      <span className="font-serif text-base tracking-tight text-white/95">Needle Point</span>
      {project && (
        <>
          <span className="text-white/25 text-sm ml-0.5">·</span>
          <span className="text-white/55 text-sm truncate max-w-48">{project.title}</span>
        </>
      )}
    </header>
  );

  if (!project) {
    return (
      <div className="flex flex-col h-screen bg-linen">
        {header}
        <HomeScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-linen">
      {header}
      <Toolbar />

      <div className="flex flex-1 min-h-0">
        <div className="w-64 flex-shrink-0 bg-white border-r border-warm-line flex flex-col">
          <div className="flex p-1 gap-px bg-warm-surface border-b border-warm-line">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                  activePanel === tab.id
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-warm-stone hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'project' && <ProjectPanel />}
            {activePanel === 'colors' && <ColorPalettePanel />}
            {activePanel === 'stitches' && <StitchPanel />}
            {activePanel === 'export' && <ExportPanel />}
          </div>
        </div>

        <GridEditor />
      </div>
    </div>
  );
}
