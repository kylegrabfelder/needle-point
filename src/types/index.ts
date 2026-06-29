export type StitchType = 'tent' | 'cross' | 'gobelin' | 'bargello' | 'mosaic' | 'long' | 'none';

export type ThreadBrand = 'dmc' | 'anchor' | 'custom';

export type Cell = {
  colorId: string | null;
  stitch: StitchType;
};

export type PaletteColor = {
  id: string;
  brand: ThreadBrand;
  threadNumber: string;
  name: string;
  hex: string;
  symbol: string;
};

export type MeshCount = 10 | 13 | 14 | 18 | 24;

export type Project = {
  id: string;
  title: string;
  meshCount: MeshCount;
  width: number;
  height: number;
  cells: Cell[][];
  palette: PaletteColor[];
  createdAt: string;
  updatedAt: string;
};

export type Tool = 'pencil' | 'eraser' | 'fill' | 'line' | 'eyedropper' | 'hand';

export type ThreadColor = {
  id: string;
  number: string;
  name: string;
  hex: string;
};
