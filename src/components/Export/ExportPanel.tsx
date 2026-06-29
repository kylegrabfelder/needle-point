import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { exportChartPDF, exportCanvasPreviewPDF, exportPNG } from '../../utils/pdfExport';

export function ExportPanel() {
  const { project } = useProjectStore();
  const [busy, setBusy] = useState<string | null>(null);

  if (!project) return null;

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Export</div>

      <button
        disabled={!!busy}
        onClick={() => run('chart', () => exportChartPDF(project))}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs py-1.5 rounded font-medium"
      >
        {busy === 'chart' ? 'Generating…' : 'PDF — Chart with Legend'}
      </button>

      <button
        disabled={!!busy}
        onClick={() => run('preview', () => exportCanvasPreviewPDF(project))}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs py-1.5 rounded font-medium"
      >
        {busy === 'preview' ? 'Generating…' : 'PDF — Canvas Preview'}
      </button>

      <button
        disabled={!!busy}
        onClick={() => { exportPNG(project); }}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs py-1.5 rounded font-medium"
      >
        PNG — Chart with Grid
      </button>

      <div className="text-xs text-gray-400">
        Chart PDF: colored grid + legend (print and count). Canvas Preview: no grid (transfer/paint reference). PNG: image file for digital use.
      </div>

      {project.palette.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <div className="text-xs font-medium text-gray-600 mb-1">Thread count</div>
          <div className="space-y-0.5">
            {(() => {
              const counts = new Map<string, number>();
              for (const row of project.cells) {
                for (const cell of row) {
                  if (cell.colorId) counts.set(cell.colorId, (counts.get(cell.colorId) ?? 0) + 1);
                }
              }
              return project.palette.map(c => {
                const n = counts.get(c.id) ?? 0;
                if (!n) return null;
                const skeins = Math.ceil(n / 200);
                return (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-200" style={{ backgroundColor: c.hex }} />
                    <span className="text-gray-500">{c.brand.toUpperCase()} {c.threadNumber}</span>
                    <span className="text-gray-400 ml-auto">{n} stitches ≈ {skeins} skein{skeins !== 1 ? 's' : ''}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
