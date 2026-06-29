import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useHistoryStore } from '../../store/historyStore';
import { renderGrid, getCellFromPoint } from '../../canvas/GridRenderer';

const RULER_SIZE = 20;
const BASE_CELL_SIZE = 16;

export function GridEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Painting state
  const isPainting = useRef(false);
  const lastPaintedCell = useRef<{ row: number; col: number } | null>(null);
  const lineStart = useRef<{ row: number; col: number } | null>(null);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Pinch-to-zoom state (two-finger touch)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchInit = useRef<{
    dist: number;
    zoom: number;
    panX: number;
    panY: number;
    focalCanvasX: number;
    focalCanvasY: number;
  } | null>(null);

  // Refs so pointer handlers always see fresh store values without stale closures
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);

  const {
    project, activeTool, viewMode, zoom, panX, panY,
    setCell, setCells, floodFill, pickColorFromCell, setZoom, setPan,
  } = useProjectStore();
  const { snapshot, undo, redo } = useHistoryStore();

  const cellSize = BASE_CELL_SIZE * zoom;

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; panYRef.current = panY; }, [panX, panY]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = size.w + 'px';
    canvas.style.height = size.h + 'px';
    ctx.scale(dpr, dpr);

    renderGrid(ctx, {
      cells: project.cells,
      palette: project.palette,
      width: project.width,
      height: project.height,
      cellSize,
      panX: panX + RULER_SIZE,
      panY: panY + RULER_SIZE,
      viewMode,
      hoveredCell,
      canvasWidth: size.w,
      canvasHeight: size.h,
    });
  }, [project, cellSize, panX, panY, viewMode, hoveredCell, size]);

  const getCellAt = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return getCellFromPoint(
        clientX - rect.left,
        clientY - rect.top,
        cellSize,
        panX + RULER_SIZE,
        panY + RULER_SIZE,
        project!.width,
        project!.height
      );
    },
    [cellSize, panX, panY, project]
  );

  const startPaint = useCallback(
    (clientX: number, clientY: number) => {
      if (!project) return;
      const cell = getCellAt(clientX, clientY);
      if (!cell) return;

      if (activeTool === 'fill') {
        snapshot(project.cells);
        floodFill(cell.row, cell.col);
        return;
      }

      if (activeTool === 'line') {
        lineStart.current = cell;
        isPainting.current = true;
        return;
      }

      // pencil or eraser — paint first cell immediately
      snapshot(project.cells);
      setCell(cell.row, cell.col);
      lastPaintedCell.current = cell;
      isPainting.current = true;
    },
    [project, activeTool, getCellAt, snapshot, floodFill, setCell]
  );

  // ── Pointer handlers ──────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!project) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const isPen = e.pointerType === 'pen';
      const isTouch = e.pointerType === 'touch';
      const isMouse = e.pointerType === 'mouse';

      // Two-finger touch → start pinch, cancel any ongoing paint/pan
      if (pointers.current.size === 2) {
        isPanning.current = false;
        isPainting.current = false;
        lineStart.current = null;
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = midX - rect.left - RULER_SIZE;
        const my = midY - rect.top - RULER_SIZE;
        const cz = zoomRef.current;
        const cpx = panXRef.current;
        const cpy = panYRef.current;
        pinchInit.current = {
          dist,
          zoom: cz,
          panX: cpx,
          panY: cpy,
          focalCanvasX: (mx - cpx) / (BASE_CELL_SIZE * cz),
          focalCanvasY: (my - cpy) / (BASE_CELL_SIZE * cz),
        };
        return;
      }

      // Single touch → pan (finger navigates; pencil draws)
      if (isTouch) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: panXRef.current, panY: panYRef.current };
        return;
      }

      // Hand tool → pan for mouse or pen
      if (activeTool === 'hand') {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: panXRef.current, panY: panYRef.current };
        return;
      }

      // Middle mouse or Alt+left → pan
      if (isMouse && (e.button === 1 || (e.button === 0 && e.altKey))) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: panXRef.current, panY: panYRef.current };
        return;
      }

      // Right mouse → eyedropper
      if (isMouse && e.button === 2) {
        const cell = getCellAt(e.clientX, e.clientY);
        if (cell) pickColorFromCell(cell.row, cell.col);
        return;
      }

      // Eyedropper tool (any device)
      if (activeTool === 'eyedropper') {
        const cell = getCellAt(e.clientX, e.clientY);
        if (cell) pickColorFromCell(cell.row, cell.col);
        return;
      }

      // Drawing — pen primary button or mouse left-click
      if (isPen || (isMouse && e.button === 0)) {
        startPaint(e.clientX, e.clientY);
      }
    },
    [project, activeTool, getCellAt, startPaint, pickColorFromCell]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!project) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Pinch-to-zoom (two touch pointers)
      if (pointers.current.size === 2 && pinchInit.current) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = midX - rect.left - RULER_SIZE;
        const my = midY - rect.top - RULER_SIZE;

        const scale = dist / pinchInit.current.dist;
        const newZoom = Math.max(0.25, Math.min(16, pinchInit.current.zoom * scale));
        const cs = BASE_CELL_SIZE * newZoom;
        const newPanX = mx - pinchInit.current.focalCanvasX * cs;
        const newPanY = my - pinchInit.current.focalCanvasY * cs;
        setZoom(newZoom);
        setPan(newPanX, newPanY);
        return;
      }

      // Pan
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan(panStart.current.panX + dx, panStart.current.panY + dy);
        return;
      }

      // Hover (not touch, to avoid ghost highlights)
      if (e.pointerType !== 'touch') {
        setHoveredCell(getCellAt(e.clientX, e.clientY));
      }

      // Paint drag (pencil or mouse)
      if (isPainting.current && activeTool !== 'line') {
        const cell = getCellAt(e.clientX, e.clientY);
        if (!cell) return;
        const last = lastPaintedCell.current;
        if (last && last.row === cell.row && last.col === cell.col) return;
        lastPaintedCell.current = cell;
        setCell(cell.row, cell.col);
      }
    },
    [project, activeTool, getCellAt, setCell, setPan, setZoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);

      // Pinch ended — if one finger remains, start panning from it
      if (pinchInit.current && pointers.current.size < 2) {
        pinchInit.current = null;
        if (pointers.current.size === 1) {
          const [ptr] = pointers.current.values();
          isPanning.current = true;
          panStart.current = { x: ptr.x, y: ptr.y, panX: panXRef.current, panY: panYRef.current };
        }
        return;
      }

      if (isPanning.current && pointers.current.size === 0) {
        isPanning.current = false;
        return;
      }

      // Finish line tool
      if (activeTool === 'line' && lineStart.current && project) {
        const cell = getCellAt(e.clientX, e.clientY);
        if (cell) {
          snapshot(project.cells);
          setCells(getLineCells(lineStart.current, cell));
        }
        lineStart.current = null;
      }

      isPainting.current = false;
      lastPaintedCell.current = null;
    },
    [activeTool, project, getCellAt, setCells, snapshot]
  );

  // Scroll-wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.25, Math.min(16, zoomRef.current * factor));
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - RULER_SIZE;
      const mouseY = e.clientY - rect.top - RULER_SIZE;
      const newPanX = mouseX - (mouseX - panXRef.current) * (newZoom / zoomRef.current);
      const newPanY = mouseY - (mouseY - panYRef.current) * (newZoom / zoomRef.current);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    },
    [setZoom, setPan]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (!project) return;
        const restored = undo(project.cells);
        if (restored) useProjectStore.setState(s => ({
          project: s.project ? { ...s.project, cells: restored } : null,
        }));
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (!project) return;
        const restored = redo(project.cells);
        if (restored) useProjectStore.setState(s => ({
          project: s.project ? { ...s.project, cells: restored } : null,
        }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project, undo, redo]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No project open
      </div>
    );
  }

  const inchWidth = (project.width / project.meshCount).toFixed(1);
  const inchHeight = (project.height / project.meshCount).toFixed(1);

  const cursor =
    activeTool === 'eraser' ? 'cell' :
    activeTool === 'fill' ? 'copy' :
    activeTool === 'eyedropper' ? 'crosshair' :
    activeTool === 'hand' ? 'grab' :
    'crosshair';

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-200">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 select-none touch-none"
        style={{ cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoveredCell(null)}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 rounded px-2 py-0.5 text-xs text-gray-600 pointer-events-none select-none flex gap-3">
        {hoveredCell && <span>Row {hoveredCell.row + 1}, Col {hoveredCell.col + 1}</span>}
        <span>{project.width}×{project.height} stitches</span>
        <span>{inchWidth}"×{inchHeight}" at {project.meshCount}-count</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

function getLineCells(start: { row: number; col: number }, end: { row: number; col: number }) {
  const cells: Array<{ row: number; col: number }> = [];
  const dr = Math.abs(end.row - start.row);
  const dc = Math.abs(end.col - start.col);
  const sr = start.row < end.row ? 1 : -1;
  const sc = start.col < end.col ? 1 : -1;
  let row = start.row;
  let col = start.col;
  let err = dr - dc;
  while (true) {
    cells.push({ row, col });
    if (row === end.row && col === end.col) break;
    const e2 = 2 * err;
    if (e2 > -dc) { err -= dc; row += sr; }
    if (e2 < dr) { err += dr; col += sc; }
  }
  return cells;
}
