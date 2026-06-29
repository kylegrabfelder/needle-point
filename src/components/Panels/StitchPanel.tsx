import { useProjectStore } from '../../store/projectStore';
import { STITCHES } from '../../data/stitches';
import { contrastColor } from '../../utils/colorUtils';

export function StitchPanel() {
  const { activeStitch, setActiveStitch, activeColorId, project } = useProjectStore();
  const activeColor = project?.palette.find(c => c.id === activeColorId);

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stitch Type</span>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {STITCHES.map(stitch => (
          <button
            key={stitch.type}
            title={stitch.description}
            onClick={() => setActiveStitch(stitch.type)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
              activeStitch === stitch.type
                ? 'bg-purple-600 text-white'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span
              className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
              style={
                activeColor
                  ? { backgroundColor: activeColor.hex, color: contrastColor(activeColor.hex) }
                  : { backgroundColor: '#ddd', color: '#555' }
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
