import { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import dmcColors from '../../data/dmc-colors.json';
import anchorColors from '../../data/anchor-colors.json';
import type { ThreadBrand } from '../../types';
import type { ThreadColor } from '../../types';
import { contrastColor } from '../../utils/colorUtils';

const ALL_COLORS: (ThreadColor & { brand: ThreadBrand })[] = [
  ...dmcColors.map(c => ({ ...c, brand: 'dmc' as ThreadBrand })),
  ...anchorColors.map(c => ({ ...c, brand: 'anchor' as ThreadBrand })),
];

export function ColorPalettePanel() {
  const { project, activeColorId, setActiveColorId, addColorToPalette, removeColorFromPalette } = useProjectStore();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<'all' | ThreadBrand>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_COLORS.filter(c => {
      if (brandFilter !== 'all' && c.brand !== brandFilter) return false;
      return c.number.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    }).slice(0, 200);
  }, [search, brandFilter]);

  if (!project) return null;

  const palette = project.palette;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colors</span>
        <button
          onClick={() => setShowPicker(v => !v)}
          className="text-xs px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-100">
        {palette.length === 0 && (
          <p className="text-xs text-gray-400 w-full text-center py-2">No colors yet — click Add</p>
        )}
        {palette.map(color => (
          <div
            key={color.id}
            title={`${color.brand.toUpperCase()} ${color.threadNumber} — ${color.name}\nSymbol: ${color.symbol}`}
            className={`relative w-8 h-8 rounded cursor-pointer flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
              activeColorId === color.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            }`}
            style={{ backgroundColor: color.hex, color: contrastColor(color.hex) }}
            onClick={() => setActiveColorId(color.id)}
            onContextMenu={e => { e.preventDefault(); removeColorFromPalette(color.id); }}
          >
            {color.symbol}
          </div>
        ))}
      </div>

      {activeColorId && (() => {
        const active = palette.find(c => c.id === activeColorId);
        if (!active) return null;
        return (
          <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: active.hex }} />
              <span className="font-medium">{active.brand.toUpperCase()} {active.threadNumber}</span>
            </div>
            <div className="text-gray-400 mt-0.5">{active.name}</div>
          </div>
        );
      })()}

      {showPicker && (
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-2 py-2 border-b border-gray-100 space-y-1.5">
            <input
              type="text"
              placeholder="Search by number or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <div className="flex gap-1">
              {(['all', 'dmc', 'anchor'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    brandFilter === b ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {b === 'all' ? 'All' : b.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(c => (
              <button
                key={c.id}
                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-50 text-left"
                onClick={() => {
                  const alreadyIn = palette.find(p => p.brand === c.brand && p.threadNumber === c.number);
                  if (alreadyIn) {
                    setActiveColorId(alreadyIn.id);
                  } else {
                    addColorToPalette({ brand: c.brand, threadNumber: c.number, name: c.name, hex: c.hex });
                  }
                  setShowPicker(false);
                  setSearch('');
                }}
              >
                <div className="w-5 h-5 rounded flex-shrink-0 border border-gray-200" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-medium text-gray-700 w-12 flex-shrink-0">{c.number}</span>
                <span className="text-xs text-gray-500 truncate">{c.name}</span>
                <span className="text-xs text-gray-300 ml-auto flex-shrink-0">{c.brand.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
