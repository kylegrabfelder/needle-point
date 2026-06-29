import { useProjectStore } from '../../store/projectStore';
import type { Tool } from '../../types';

const tools: { id: Tool; label: string; key: string }[] = [
  { id: 'pencil',     label: 'Pencil',  key: 'P' },
  { id: 'eraser',     label: 'Erase',   key: 'E' },
  { id: 'fill',       label: 'Fill',    key: 'F' },
  { id: 'line',       label: 'Line',    key: 'L' },
  { id: 'eyedropper', label: 'Pick',    key: 'I' },
  { id: 'hand',       label: 'Pan',     key: 'H' },
];

export function Toolbar() {
  const { activeTool, setActiveTool, viewMode, setViewMode, project, activeColorId } = useProjectStore();
  const activeColor = project?.palette.find(c => c.id === activeColorId);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-warm-line flex-shrink-0 flex-wrap">

      {/* Drawing tools */}
      <div className="flex gap-px p-0.5 bg-warm-surface rounded-lg">
        {tools.map(t => (
          <button
            key={t.id}
            title={`${t.label} (${t.key})`}
            onClick={() => setActiveTool(t.id)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTool === t.id
                ? 'bg-studio text-white shadow-sm'
                : 'text-warm-stone hover:text-ink hover:bg-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-warm-line" />

      {/* View mode */}
      <div className="flex gap-px p-0.5 bg-warm-surface rounded-lg">
        <button
          onClick={() => setViewMode('chart')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'chart'
              ? 'bg-thread text-white shadow-sm'
              : 'text-warm-stone hover:text-ink hover:bg-white/80'
          }`}
        >
          Chart
        </button>
        <button
          onClick={() => setViewMode('canvas')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'canvas'
              ? 'bg-thread text-white shadow-sm'
              : 'text-warm-stone hover:text-ink hover:bg-white/80'
          }`}
        >
          Preview
        </button>
      </div>

      {activeColor && (
        <>
          <div className="w-px h-5 bg-warm-line" />
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: activeColor.hex,
                boxShadow: `0 0 0 1px rgba(0,0,0,0.12)`
              }}
            />
            <span className="text-xs text-warm-stone font-medium">
              {activeColor.brand.toUpperCase()} {activeColor.threadNumber}
            </span>
          </div>
        </>
      )}

      <div className="ml-auto text-xs text-warm-faint hidden md:block">
        Pen draws · Touch pans · Pinch zooms · Right-click picks
      </div>
    </div>
  );
}
