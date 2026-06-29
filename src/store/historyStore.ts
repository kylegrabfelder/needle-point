import { create } from 'zustand';
import type { Cell } from '../types';

const MAX_HISTORY = 50;

type HistoryState = {
  past: Cell[][][];
  future: Cell[][][];
  canUndo: boolean;
  canRedo: boolean;

  snapshot: (cells: Cell[][]) => void;
  undo: (currentCells: Cell[][]) => Cell[][] | null;
  redo: (currentCells: Cell[][]) => Cell[][] | null;
  clear: () => void;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  snapshot: (cells) => {
    set(state => {
      const past = [...state.past, deepClone(cells)].slice(-MAX_HISTORY);
      return { past, future: [], canUndo: past.length > 0, canRedo: false };
    });
  },

  undo: (currentCells) => {
    const { past } = get();
    if (past.length === 0) return null;
    const prev = past[past.length - 1];
    set(state => {
      const newPast = state.past.slice(0, -1);
      const future = [deepClone(currentCells), ...state.future].slice(0, MAX_HISTORY);
      return { past: newPast, future, canUndo: newPast.length > 0, canRedo: true };
    });
    return deepClone(prev);
  },

  redo: (currentCells) => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set(state => {
      const newFuture = state.future.slice(1);
      const past = [...state.past, deepClone(currentCells)].slice(-MAX_HISTORY);
      return { past, future: newFuture, canUndo: true, canRedo: newFuture.length > 0 };
    });
    return deepClone(next);
  },

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}));

function deepClone(cells: Cell[][]): Cell[][] {
  return cells.map(row => row.map(cell => ({ ...cell })));
}
