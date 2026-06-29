import { useProjectStore } from '../../store/projectStore';
import { STITCHES } from '../../data/stitches';
import { contrastColor } from '../../utils/colorUtils';

export function StitchPanel() {
  const { activeStitch, setActiveStitch, activeColorId, project } = useProjectStore();
  const activeColor = project?.palette.find(c => c.id === activeColorId);

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-warm-line">
        <span className="text-xs font-semibold text-warm-faint uppercase tracking-widest">Stitch Type</span>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {STITCHES.map(stitch => (
          <button
            key={stitch.type}
            title={stitch.description}
            onClick={() => setActiveStitch(stitch.type)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
              activeStitch === stitch.type
                ? 'bg-thread text-white'
                : 'hover:bg-warm-surface text-warm-stone hover:text-ink'
            }`}
          >
            <span
              className="w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0"
              style={
                activeColor
                  ? { backgroundColor: activeColor.hex, color: contrastColor(activeColor.hex) }
                  : { backgroundColor: '#ddd', color: '#6B5F58' }
              }
            >
              {stitch.symbol}
            </span>
            <span className="text-xs font-medium">{stitch.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
