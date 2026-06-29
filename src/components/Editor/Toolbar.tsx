import { useProjectStore } from '../../store/projectStore';
import type { Tool } from '../../types';

const tools: { id: Tool; label: string; key: string; icon: string }[] = [
  { id: 'pencil',     label: 'Pencil',      key: 'P', icon: '✏️' },
  { id: 'eraser',     label: 'Eraser',      key: 'E', icon: '⬜' },
  { id: 'fill',       label: 'Fill',        key: 'F', icon: '🪣' },
  { id: 'line',       label: 'Line',        key: 'L', icon: '╱' },
  { id: 'eyedropper', label: 'Pick Color',  key: 'I', icon: '💉' },
  { id: 'hand',       label: 'Pan',         key: 'H', icon: '✋' },
];

export function Toolbar() {
  const { activeTool, setActiveTool, viewMode, setViewMode, project, activeColorId } = useProjectStore();
  const activeColor = project?.palette.find(c => c.id === activeColorId);

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
      <div className="flex gap-1 mr-2">
        {tools.map(t => (
          <button
            key={t.id}
            title={`${t.label} (${t.key})`}
            onClick={() => setActiveTool(t.id)}
            className={`px-2.5 py-1 rounded text-sm font-medium transition-colors min-w-[2.5rem] ${
              activeTool === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200 mx-1" />

      <div className="flex gap-1 mr-2">
        <button
          onClick={() => setViewMode('chart')}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
            viewMode === 'chart' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Chart
        </button>
        <button
          onClick={() => setViewMode('canvas')}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
            viewMode === 'canvas' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Preview
        </button>
      </div>

      {activeColor && (
        <>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: activeColor.hex }}
            />
            <span className="text-xs text-gray-600 font-medium">
              {activeColor.brand.toUpperCase()} {activeColor.threadNumber}
            </span>
          </div>
        </>
      )}

      {project && (
        <>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <span className="text-sm text-gray-500 font-medium truncate max-w-40">{project.title}</span>
        </>
      )}

      <div className="ml-auto text-xs text-gray-400 hidden md:block">
        Pencil/pen draws · Touch pans · Pinch zooms · Right-click picks color
      </div>
    </div>
  );
}
