# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check + build to dist/
npm run lint       # Run oxlint
npm run preview    # Preview the production build
```

There is no test suite. Playwright is installed as a dev dependency but no tests exist yet.

## Architecture

Single-page React app — no router. The top-level view is controlled by whether `project` is null in the Zustand store: null shows `HomeScreen`, non-null shows the editor layout.

### State

**`src/store/projectStore.ts`** — primary store (Zustand). Holds the open `Project` (cells, palette, mesh count, title) plus editor state (active tool, stitch, zoom, pan, view mode). All mutations go through this store. Writes to localStorage are debounced 500 ms; `saveToLocalStorage`, `getProjectIds`, `loadProjectFromStorage`, `deleteProjectFromStorage`, `exportProjectAsJSON`, and `importProjectFromFile` are module-level helpers exported from this file (not store actions).

**`src/store/historyStore.ts`** — separate Zustand store for undo/redo. Stores up to 50 deep-cloned `Cell[][]` snapshots. Callers must call `snapshot(cells)` before a destructive operation, then apply it to the store manually after `undo()`/`redo()` return the restored cells.

### Rendering

**`src/canvas/GridRenderer.ts`** — pure rendering logic, no React. `renderGrid()` takes a context and `RenderOptions` and redraws the full visible viewport. Only cells within the current pan/zoom viewport are drawn (culled by startRow/endCol etc.). Grid lines every 10 cells are drawn darker ("major" lines). Ruler ticks are drawn in chart mode only. `getCellFromPoint()` converts mouse coordinates back to grid coordinates.

**`src/components/Editor/GridEditor.tsx`** — React component that owns the `<canvas>` element. Uses a `ResizeObserver` to track container dimensions and re-renders on every store change via a `useEffect`. Handles all pointer events (mouse, touch, pen) including pinch-to-zoom (tracked via a `Map<pointerId, …>`) and panning. Keyboard shortcuts for undo/redo (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Y`, `Ctrl/Cmd+Shift+Z`) live here. Tool hotkeys (`p`, `e`, `f`, `l`, `i`, `h`) live in `AppShell`.

### Data

**`src/types/index.ts`** — all shared types: `Cell`, `Project`, `PaletteColor`, `Tool`, `StitchType`, `MeshCount`, `ThreadBrand`.

**`src/data/stitches.ts`** — stitch definitions with display symbols. `DEFAULT_STITCH` is `'tent'`.

**`src/data/dmc-colors.json`** — 400+ DMC thread colors with hex values.

**`src/data/anchor-colors.json`** — ~130 Anchor thread colors (approximate hex values).

**`src/utils/pdfExport.ts`** — jsPDF-based exports: `exportChartPDF` (chart grid + legend page), `exportCanvasPreviewPDF` (filled color preview), `exportPNG` (PNG via off-screen canvas).

**`src/utils/colorUtils.ts`** — color helpers including `contrastColor` (returns black or white for readable text) and `nextAvailableSymbol` (assigns unique chart symbols to palette entries).

### Layout

`AppShell` renders a fixed header + `Toolbar` + a two-column flex layout: a 256 px left panel with four tabs (Project, Colors, Stitches, Export) and `GridEditor` filling the rest.

## Key constraints

- **No Canvas library** — the grid is drawn with raw HTML5 Canvas 2D API for performance. An 18-count 20"×20" canvas is 129,600 cells; avoid anything that iterates all cells outside a render or mutation operation.
- **Cell size baseline is 16 px** (`BASE_CELL_SIZE` in GridEditor). `zoom` multiplies this; zoom range is 0.25–16×.
- Projects persist to `localStorage` keyed by `needle-point-project-{id}`. A separate `needle-point-project-ids` key tracks the list of IDs.
- The `.needle` file format is plain JSON matching the `Project` type — no versioning schema yet.
