import type { StitchType } from '../types';

export type StitchDef = {
  type: StitchType;
  label: string;
  description: string;
  symbol: string;
};

export const STITCHES: StitchDef[] = [
  {
    type: 'tent',
    label: 'Tent',
    description: 'Continental / Basketweave — the standard needlepoint stitch',
    symbol: '/',
  },
  {
    type: 'cross',
    label: 'Cross',
    description: 'Full cross stitch — X-shaped over one canvas intersection',
    symbol: 'X',
  },
  {
    type: 'gobelin',
    label: 'Gobelin',
    description: 'Vertical or horizontal straight stitch over 2–4 threads',
    symbol: '|',
  },
  {
    type: 'bargello',
    label: 'Bargello',
    description: 'Vertical straight stitch creating geometric flame patterns',
    symbol: '‖',
  },
  {
    type: 'mosaic',
    label: 'Mosaic',
    description: 'Alternating short and long diagonal stitches in a tile pattern',
    symbol: '◇',
  },
  {
    type: 'long',
    label: 'Long',
    description: 'Long straight stitch spanning multiple canvas holes',
    symbol: '—',
  },
  {
    type: 'none',
    label: 'Background',
    description: 'Unstitched — background canvas, no stitch',
    symbol: '·',
  },
];

export const STITCH_MAP: Record<StitchType, StitchDef> = Object.fromEntries(
  STITCHES.map(s => [s.type, s])
) as Record<StitchType, StitchDef>;

export const DEFAULT_STITCH: StitchType = 'tent';
