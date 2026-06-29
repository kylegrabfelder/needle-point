import type { Cell, PaletteColor } from '../types';
import { STITCH_MAP } from '../data/stitches';
import { contrastColor } from '../utils/colorUtils';

const GRID_COLOR_MINOR = '#cccccc';
const GRID_COLOR_MAJOR = '#999999';
const EMPTY_CELL_COLOR = '#f9f9f9';
const CANVAS_BG = '#ffffff';

export type RenderOptions = {
  cells: Cell[][];
  palette: PaletteColor[];
  width: number;
  height: number;
  cellSize: number;
  panX: number;
  panY: number;
  viewMode: 'chart' | 'canvas';
  hoveredCell: { row: number; col: number } | null;
  canvasWidth: number;
  canvasHeight: number;
};

export function renderGrid(ctx: CanvasRenderingContext2D, opts: RenderOptions) {
  const { cells, palette, width, height, cellSize, panX, panY, viewMode, hoveredCell, canvasWidth, canvasHeight } = opts;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const colorMap = new Map<string, PaletteColor>(palette.map(c => [c.id, c]));

  const startCol = Math.max(0, Math.floor(-panX / cellSize));
  const endCol = Math.min(width - 1, Math.ceil((canvasWidth - panX) / cellSize));
  const startRow = Math.max(0, Math.floor(-panY / cellSize));
  const endRow = Math.min(height - 1, Math.ceil((canvasHeight - panY) / cellSize));

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const x = panX + c * cellSize;
      const y = panY + r * cellSize;
      const cell = cells[r]?.[c];
      const color = cell?.colorId ? colorMap.get(cell.colorId) : null;

      ctx.fillStyle = color ? color.hex : EMPTY_CELL_COLOR;
      ctx.fillRect(x, y, cellSize, cellSize);

      if (viewMode === 'chart' && color && cell && cellSize >= 8) {
        const stitch = STITCH_MAP[cell.stitch];
        if (stitch && stitch.symbol !== '·') {
          ctx.fillStyle = contrastColor(color.hex);
          ctx.font = `${Math.min(cellSize * 0.65, 14)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stitch.symbol, x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }

  if (viewMode === 'chart') {
    drawGridLines(ctx, { width, height, cellSize, panX, panY, canvasWidth, canvasHeight });
  }

  if (hoveredCell && cellSize >= 4) {
    const { row, col } = hoveredCell;
    const x = panX + col * cellSize;
    const y = panY + row * cellSize;
    ctx.strokeStyle = 'rgba(0,120,255,0.8)';
    ctx.lineWidth = Math.max(1, cellSize * 0.08);
    ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
  }

  if (viewMode === 'chart') {
    drawRuler(ctx, { width, height, cellSize, panX, panY, canvasWidth, canvasHeight });
  }
}

function drawGridLines(
  ctx: CanvasRenderingContext2D,
  opts: { width: number; height: number; cellSize: number; panX: number; panY: number; canvasWidth: number; canvasHeight: number }
) {
  const { width, height, cellSize, panX, panY, canvasWidth, canvasHeight } = opts;
  ctx.save();

  for (let c = 0; c <= width; c++) {
    const x = panX + c * cellSize;
    if (x < 0 || x > canvasWidth) continue;
    ctx.strokeStyle = c % 10 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR_MINOR;
    ctx.lineWidth = c % 10 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, panY));
    ctx.lineTo(x, Math.min(canvasHeight, panY + height * cellSize));
    ctx.stroke();
  }

  for (let r = 0; r <= height; r++) {
    const y = panY + r * cellSize;
    if (y < 0 || y > canvasHeight) continue;
    ctx.strokeStyle = r % 10 === 0 ? GRID_COLOR_MAJOR : GRID_COLOR_MINOR;
    ctx.lineWidth = r % 10 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, panX), y);
    ctx.lineTo(Math.min(canvasWidth, panX + width * cellSize), y);
    ctx.stroke();
  }

  ctx.restore();
}

const RULER_SIZE = 20;

function drawRuler(
  ctx: CanvasRenderingContext2D,
  opts: { width: number; height: number; cellSize: number; panX: number; panY: number; canvasWidth: number; canvasHeight: number }
) {
  const { width, height, cellSize, panX, panY, canvasWidth, canvasHeight } = opts;
  if (cellSize < 6) return;

  ctx.save();
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvasWidth, RULER_SIZE);
  ctx.fillRect(0, 0, RULER_SIZE, canvasHeight);

  ctx.fillStyle = '#444';
  ctx.font = '9px monospace';
  ctx.textBaseline = 'middle';

  for (let c = 0; c <= width; c += 10) {
    const x = panX + c * cellSize;
    if (x < RULER_SIZE || x > canvasWidth) continue;
    ctx.textAlign = 'center';
    ctx.fillText(String(c), x, RULER_SIZE / 2);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, RULER_SIZE - 4);
    ctx.lineTo(x, RULER_SIZE);
    ctx.stroke();
  }

  for (let r = 0; r <= height; r += 10) {
    const y = panY + r * cellSize;
    if (y < RULER_SIZE || y > canvasHeight) continue;
    ctx.save();
    ctx.translate(RULER_SIZE / 2, y);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(String(r), 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);
  ctx.restore();
}

export function getCellFromPoint(
  mouseX: number,
  mouseY: number,
  cellSize: number,
  panX: number,
  panY: number,
  width: number,
  height: number
): { row: number; col: number } | null {
  const col = Math.floor((mouseX - panX) / cellSize);
  const row = Math.floor((mouseY - panY) / cellSize);
  if (col < 0 || col >= width || row < 0 || row >= height) return null;
  return { row, col };
}
