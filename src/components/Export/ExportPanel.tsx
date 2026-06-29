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
    <div className="p-3 flex flex-col gap-3">
      <div className="text-xs font-semibold text-warm-faint uppercase tracking-widest">Export</div>

      <div className="flex flex-col gap-1.5">
        <button
          disabled={!!busy}
          onClick={() => run('chart', () => exportChartPDF(project))}
          className="w-full bg-studio hover:bg-studio-dark disabled:opacity-50 text-white text-xs py-2 rounded-lg font-medium transition-colors"
        >
          {busy === 'chart' ? 'Generating…' : 'PDF — Chart with Legend'}
        </button>

        <button
          disabled={!!busy}
          onClick={() => run('preview', () => exportCanvasPreviewPDF(project))}
          className="w-full bg-studio hover:bg-studio-dark disabled:opacity-50 text-white text-xs py-2 rounded-lg font-medium transition-colors"
        >
          {busy === 'preview' ? 'Generating…' : 'PDF — Canvas Preview'}
        </button>

        <button
          disabled={!!busy}
          onClick={() => { exportPNG(project); }}
          className="w-full bg-warm-surface hover:bg-warm-line disabled:opacity-50 text-warm-stone hover:text-ink text-xs py-2 rounded-lg font-medium transition-colors"
        >
          PNG — Chart with Grid
        </button>
      </div>

      <p className="text-xs text-warm-faint leading-relaxed">
        Chart PDF includes a colored grid and legend for counting. Canvas Preview has no grid for transfer use. PNG exports an image file.
      </p>

      {project.palette.length > 0 && (
        <div className="border-t border-warm-line pt-3">
          <div className="text-xs font-medium text-warm-stone mb-2">Thread estimate</div>
          <div className="space-y-1">
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
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: c.hex, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
                    />
                    <span className="text-warm-stone">{c.brand.toUpperCase()} {c.threadNumber}</span>
                    <span className="text-warm-faint ml-auto">{n} · {skeins} skein{skeins !== 1 ? 's' : ''}</span>
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
