import { create } from 'zustand';
import type { Project, Cell, PaletteColor, Tool, StitchType, MeshCount } from '../types';
import { DEFAULT_STITCH } from '../data/stitches';
import { nextAvailableSymbol } from '../utils/colorUtils';

function makeEmptyCells(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ colorId: null, stitch: DEFAULT_STITCH }))
  );
}

function makeNewProject(
  title: string,
  meshCount: MeshCount,
  widthInches: number,
  heightInches: number
): Project {
  const width = Math.round(widthInches * meshCount);
  const height = Math.round(heightInches * meshCount);
  return {
    id: crypto.randomUUID(),
    title,
    meshCount,
    width,
    height,
    cells: makeEmptyCells(width, height),
    palette: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

type ViewMode = 'chart' | 'canvas';

type ProjectState = {
  project: Project | null;
  activeTool: Tool;
  activeColorId: string | null;
  activeStitch: StitchType;
  viewMode: ViewMode;
  zoom: number;
  panX: number;
  panY: number;

  createProject: (title: string, meshCount: MeshCount, widthInches: number, heightInches: number) => void;
  loadProject: (project: Project) => void;
  closeProject: () => void;

  setCell: (row: number, col: number) => void;
  setCells: (cells: Array<{ row: number; col: number }>) => void;
  floodFill: (row: number, col: number) => void;

  addColorToPalette: (color: Omit<PaletteColor, 'id' | 'symbol'>) => void;
  removeColorFromPalette: (colorId: string) => void;
  setActiveColorId: (id: string | null) => void;
  pickColorFromCell: (row: number, col: number) => void;

  setActiveTool: (tool: Tool) => void;
  setActiveStitch: (stitch: StitchType) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  updateTitle: (title: string) => void;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  activeTool: 'pencil',
  activeColorId: null,
  activeStitch: DEFAULT_STITCH,
  viewMode: 'chart',
  zoom: 1,
  panX: 0,
  panY: 0,

  createProject: (title, meshCount, widthInches, heightInches) => {
    const project = makeNewProject(title, meshCount, widthInches, heightInches);
    set({ project, activeColorId: null, zoom: 1, panX: 0, panY: 0 });
    saveToLocalStorage(project);
  },

  loadProject: (project) => {
    set({ project, activeColorId: null, zoom: 1, panX: 0, panY: 0 });
  },

  closeProject: () => set({ project: null }),

  setCell: (row, col) => {
    const { project, activeTool, activeColorId, activeStitch } = get();
    if (!project) return;
    const cells = project.cells.map(r => [...r]);
    const current = cells[row]?.[col];
    if (!current) return;

    if (activeTool === 'eraser') {
      cells[row][col] = { colorId: null, stitch: DEFAULT_STITCH };
    } else if (activeColorId) {
      cells[row][col] = { colorId: activeColorId, stitch: activeStitch };
    }

    const updated = { ...project, cells, updatedAt: new Date().toISOString() };
    set({ project: updated });
    debouncedSave(updated);
  },

  setCells: (cellCoords) => {
    const { project, activeTool, activeColorId, activeStitch } = get();
    if (!project) return;
    const cells = project.cells.map(r => [...r]);

    for (const { row, col } of cellCoords) {
      if (!cells[row]?.[col]) continue;
      if (activeTool === 'eraser') {
        cells[row][col] = { colorId: null, stitch: DEFAULT_STITCH };
      } else if (activeColorId) {
        cells[row][col] = { colorId: activeColorId, stitch: activeStitch };
      }
    }

    const updated = { ...project, cells, updatedAt: new Date().toISOString() };
    set({ project: updated });
    debouncedSave(updated);
  },

  floodFill: (startRow, startCol) => {
    const { project, activeColorId, activeStitch, activeTool } = get();
    if (!project) return;

    const cells = project.cells.map(r => r.map(c => ({ ...c })));
    const targetColorId = cells[startRow]?.[startCol]?.colorId ?? null;
    const fillColorId = activeTool === 'eraser' ? null : activeColorId;

    if (targetColorId === fillColorId) return;

    const queue: Array<[number, number]> = [[startRow, startCol]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      if (r < 0 || r >= project.height || c < 0 || c >= project.width) continue;
      if (cells[r][c].colorId !== targetColorId) continue;

      visited.add(key);
      cells[r][c] = {
        colorId: fillColorId,
        stitch: fillColorId ? activeStitch : DEFAULT_STITCH,
      };

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    const updated = { ...project, cells, updatedAt: new Date().toISOString() };
    set({ project: updated });
    debouncedSave(updated);
  },

  addColorToPalette: (colorData) => {
    const { project } = get();
    if (!project) return;
    const usedSymbols = project.palette.map(c => c.symbol);
    const newColor: PaletteColor = {
      ...colorData,
      id: crypto.randomUUID(),
      symbol: nextAvailableSymbol(usedSymbols),
    };
    const updated = {
      ...project,
      palette: [...project.palette, newColor],
      updatedAt: new Date().toISOString(),
    };
    set({ project: updated, activeColorId: newColor.id });
    debouncedSave(updated);
  },

  removeColorFromPalette: (colorId) => {
    const { project, activeColorId } = get();
    if (!project) return;
    const cells = project.cells.map(r =>
      r.map(c => c.colorId === colorId ? { ...c, colorId: null } : c)
    );
    const updated = {
      ...project,
      palette: project.palette.filter(c => c.id !== colorId),
      cells,
      updatedAt: new Date().toISOString(),
    };
    set({
      project: updated,
      activeColorId: activeColorId === colorId ? null : activeColorId,
    });
    debouncedSave(updated);
  },

  setActiveColorId: (id) => set({ activeColorId: id }),

  pickColorFromCell: (row, col) => {
    const { project } = get();
    if (!project) return;
    const cell = project.cells[row]?.[col];
    if (cell?.colorId) {
      set({ activeColorId: cell.colorId });
    }
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveStitch: (stitch) => set({ activeStitch: stitch }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(16, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  updateTitle: (title) => {
    const { project } = get();
    if (!project) return;
    const updated = { ...project, title, updatedAt: new Date().toISOString() };
    set({ project: updated });
    debouncedSave(updated);
  },
}));

const STORAGE_KEY_PREFIX = 'needle-point-project-';

function saveToLocalStorage(project: Project) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + project.id, JSON.stringify(project));
    const ids = getProjectIds();
    if (!ids.includes(project.id)) {
      localStorage.setItem('needle-point-project-ids', JSON.stringify([...ids, project.id]));
    }
  } catch {
    // localStorage may be full
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(project: Project) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveToLocalStorage(project), 500);
}

export function getProjectIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('needle-point-project-ids') ?? '[]');
  } catch {
    return [];
  }
}

export function loadProjectFromStorage(id: string): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteProjectFromStorage(id: string) {
  localStorage.removeItem(STORAGE_KEY_PREFIX + id);
  const ids = getProjectIds().filter(i => i !== id);
  localStorage.setItem('needle-point-project-ids', JSON.stringify(ids));
}

export function exportProjectAsJSON(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '-')}.needle`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file: File): Promise<Project> {
  const text = await file.text();
  const project = JSON.parse(text) as Project;
  saveToLocalStorage(project);
  return project;
}
