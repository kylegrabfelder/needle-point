import { jsPDF } from 'jspdf';
import type { Project, PaletteColor } from '../types';
import { STITCH_MAP } from '../data/stitches';
import { contrastColor, hexToRgb } from './colorUtils';

function hexToComponents(hex: string): [number, number, number] {
  return hexToRgb(hex);
}

export async function exportChartPDF(project: Project): Promise<void> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const colorMap = new Map<string, PaletteColor>(project.palette.map(c => [c.id, c]));

  const drawW = pageW - margin * 2;
  const drawH = pageH - margin * 2 - 10;
  const cellW = drawW / project.width;
  const cellH = drawH / project.height;
  const cellSize = Math.min(cellW, cellH, 8);

  const gridW = cellSize * project.width;
  const gridH = cellSize * project.height;
  const offsetX = margin + (drawW - gridW) / 2;
  const offsetY = margin + 10;

  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);
  pdf.text(
    `${project.title}  |  ${project.width}×${project.height} stitches  |  ${(project.width / project.meshCount).toFixed(1)}"×${(project.height / project.meshCount).toFixed(1)}" at ${project.meshCount}-count`,
    margin,
    margin + 5
  );

  for (let r = 0; r < project.height; r++) {
    for (let c = 0; c < project.width; c++) {
      const cell = project.cells[r][c];
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      if (cell.colorId) {
        const color = colorMap.get(cell.colorId);
        if (color) {
          const [red, g, b] = hexToComponents(color.hex);
          pdf.setFillColor(red, g, b);
          pdf.rect(x, y, cellSize, cellSize, 'F');

          const stitch = STITCH_MAP[cell.stitch];
          if (stitch && stitch.symbol !== '·' && cellSize >= 3) {
            const [tr, tg, tb] = hexToComponents(contrastColor(color.hex));
            pdf.setTextColor(tr, tg, tb);
            pdf.setFontSize(cellSize * 2.2);
            pdf.text(stitch.symbol, x + cellSize / 2, y + cellSize * 0.72, { align: 'center' });
          }
        }
      } else {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(x, y, cellSize, cellSize, 'F');
      }
    }
  }

  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.1);
  for (let c = 0; c <= project.width; c++) {
    const x = offsetX + c * cellSize;
    pdf.setDrawColor(c % 10 === 0 ? 120 : 200, c % 10 === 0 ? 120 : 200, c % 10 === 0 ? 120 : 200);
    pdf.setLineWidth(c % 10 === 0 ? 0.3 : 0.1);
    pdf.line(x, offsetY, x, offsetY + gridH);
  }
  for (let r = 0; r <= project.height; r++) {
    const y = offsetY + r * cellSize;
    pdf.setDrawColor(r % 10 === 0 ? 120 : 200, r % 10 === 0 ? 120 : 200, r % 10 === 0 ? 120 : 200);
    pdf.setLineWidth(r % 10 === 0 ? 0.3 : 0.1);
    pdf.line(offsetX, y, offsetX + gridW, y);
  }

  if (project.palette.length > 0) {
    pdf.addPage();
    pdf.setFontSize(12);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Color Legend', margin, margin + 5);

    const rowH = 8;
    const startY = margin + 14;
    const swatchSize = 6;
    const colW = (pageW - margin * 2) / 2;

    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Symbol', margin + swatchSize + 2, startY - 2);
    pdf.text('Brand / #', margin + swatchSize + 12, startY - 2);
    pdf.text('Name', margin + swatchSize + 38, startY - 2);
    pdf.text('Stitch', margin + swatchSize + 80, startY - 2);
    pdf.text('Cells', margin + swatchSize + 100, startY - 2);

    const cellCounts = new Map<string, number>();
    for (const row of project.cells) {
      for (const cell of row) {
        if (cell.colorId) {
          cellCounts.set(cell.colorId, (cellCounts.get(cell.colorId) ?? 0) + 1);
        }
      }
    }

    project.palette.forEach((color, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * colW;
      const y = startY + row * rowH;

      const [r, g, b] = hexToComponents(color.hex);
      pdf.setFillColor(r, g, b);
      pdf.rect(x, y, swatchSize, swatchSize, 'F');
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, swatchSize, swatchSize, 'S');

      const [tr, tg, tb] = hexToComponents(contrastColor(color.hex));
      pdf.setTextColor(tr, tg, tb);
      pdf.setFontSize(5);
      pdf.text(color.symbol, x + swatchSize / 2, y + swatchSize * 0.68, { align: 'center' });

      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(7);
      pdf.text(`${color.brand.toUpperCase()} ${color.threadNumber}`, x + swatchSize + 2, y + swatchSize * 0.72);
      pdf.text(color.name.slice(0, 28), x + swatchSize + 28, y + swatchSize * 0.72);

      const stitchTypes = new Set<string>();
      for (const row of project.cells) {
        for (const cell of row) {
          if (cell.colorId === color.id) stitchTypes.add(STITCH_MAP[cell.stitch]?.label ?? '');
        }
      }
      pdf.text([...stitchTypes].join(', '), x + swatchSize + 76, y + swatchSize * 0.72);
      pdf.text(String(cellCounts.get(color.id) ?? 0), x + swatchSize + 96, y + swatchSize * 0.72);
    });
  }

  const fileName = `${project.title.replace(/\s+/g, '-')}-chart.pdf`;
  pdf.save(fileName);
}

export function exportPNG(project: Project, scale = 8): void {
  const canvas = document.createElement('canvas');
  canvas.width = project.width * scale;
  canvas.height = project.height * scale;
  const ctx = canvas.getContext('2d')!;
  const colorMap = new Map<string, PaletteColor>(project.palette.map(c => [c.id, c]));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < project.height; r++) {
    for (let c = 0; c < project.width; c++) {
      const cell = project.cells[r][c];
      const color = cell.colorId ? colorMap.get(cell.colorId) : null;
      ctx.fillStyle = color ? color.hex : '#f9f9f9';
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }

  // Draw grid lines every cell
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= project.width; c++) {
    ctx.strokeStyle = c % 10 === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = c % 10 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(c * scale, 0);
    ctx.lineTo(c * scale, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= project.height; r++) {
    ctx.strokeStyle = r % 10 === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = r % 10 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(0, r * scale);
    ctx.lineTo(canvas.width, r * scale);
    ctx.stroke();
  }

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '-')}-chart.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export async function exportCanvasPreviewPDF(project: Project): Promise<void> {
  const canvas = document.createElement('canvas');
  const scale = 4;
  canvas.width = project.width * scale;
  canvas.height = project.height * scale;
  const ctx = canvas.getContext('2d')!;
  const colorMap = new Map<string, PaletteColor>(project.palette.map(c => [c.id, c]));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < project.height; r++) {
    for (let c = 0; c < project.width; c++) {
      const cell = project.cells[r][c];
      const color = cell.colorId ? colorMap.get(cell.colorId) : null;
      ctx.fillStyle = color ? color.hex : '#f9f9f9';
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const aspect = project.width / project.height;
  const pdf = new jsPDF({ orientation: aspect >= 1 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pw = aspect >= 1 ? 297 : 210;
  const ph = aspect >= 1 ? 210 : 297;
  const margin = 10;
  const maxW = pw - margin * 2;
  const maxH = ph - margin * 2 - 10;
  const imgW = Math.min(maxW, maxH * aspect);
  const imgH = imgW / aspect;

  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);
  pdf.text(`${project.title} — Canvas Preview`, margin, margin + 5);
  pdf.addImage(imgData, 'JPEG', margin + (maxW - imgW) / 2, margin + 10, imgW, imgH);
  pdf.save(`${project.title.replace(/\s+/g, '-')}-canvas-preview.pdf`);
}
