# 📐 Shape Packing Tool (2D Container Fill Calculator)

A high-performance interactive 2D Container Fill Calculator and Bin Packing suite built with **React 19, TypeScript (Strict Mode), Vite, Tailwind CSS v4, and Zustand**.

The tool allows users to define a resizable container box and customize small shapes (squares, rectangles, circles, isosceles triangles), visualizes packing using exact mathematical collision detection, and runs packing heuristics off-thread via a dedicated Web Worker.

---

## ✨ Features

- **Interactive SVG Canvas**: Crisp rendering, smooth mouse-wheel zooming, pan navigation, and 8-handle container resizing.
- **Zero-DOM Core Geometry Engine**: Pure TypeScript geometry module (`src/core/`) with SAT (Separating Axis Theorem) collision detection, circle-polygon clamping, and an $O(1)$ uniform spatial hash grid.
- **Live Collision Feedback**: Real-time green/red visual indicators when dragging shapes. Invalid drops automatically snap back to their last valid position.
- **One-Click Seeded Random Fill**: Deterministic placement powered by the 32-bit `Mulberry32` PRNG with progressive batch animations.
- **Smart Fill (Skyline Heuristic)**: Bottom-Left candidate placement with multi-start random restarts and fine-grid gap filling.
- **Single-Shape Max Packing**:
  - Squares & Rectangles: Standard, rotated 90°, and mixed guillotine shelf packing.
  - Circles: Hexagonal close packing (up to 90.7% density vs 78.5% square lattice).
  - Triangles: Interlocking alternating up/down rows.
- **Diagnostics & Live Stats**: Instant calculation of total count, count per template, container area, used area, utilization percentage, seed, and compute time.
- **History & Persistence**: 100-step Undo/Redo history, JSON import/export, and vector SVG / raster PNG export.
- **Keyboard Shortcuts**: `Delete` / `Backspace` to remove, arrow keys to nudge (by 1px or 10px with Shift), `Cmd/Ctrl + Z` to undo/redo.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React 19 + Vite 8
- **Language**: TypeScript (strict mode, zero `any`)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Off-Thread Compute**: Dedicated Web Worker (`packing.worker.ts`)
- **Testing**: Vitest with unit and 200-iteration randomized property-based tests

```
src/
├── core/                  # Pure TypeScript geometry and algorithms (no DOM/React)
│   ├── types.ts           # Domain models and definitions
│   ├── geometry.ts        # Vertex generation, bounds, and areas
│   ├── collision.ts       # SAT, circle-polygon clamp, containment
│   ├── spatialGrid.ts     # O(1) 2D spatial hash grid
│   ├── random.ts          # Mulberry32 PRNG and weighted picking
│   ├── randomFill.ts      # Progressive seeded random placement
│   ├── singleShapeMax.ts  # Hexagonal, interlocking, and shelf packing
│   ├── smartFill.ts       # Bottom-Left skyline heuristic
│   └── validate.ts        # Layout validation engine
├── workers/               # Web Worker and async client interface
├── state/                 # Zustand store with 100-entry undo/redo history
├── components/            # Modular React components
│   ├── Header.tsx         # Toolbar, import/export, presets, themes
│   ├── Canvas/            # SVG container, handles, and shape views
│   ├── Sidebar/           # Container and shape template editors
│   └── ResultsPanel/      # Calculation modes, stats, and settings
└── utils/                 # File import, JSON, SVG, and PNG exporters
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Unit and Property-Based Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Testing Suite

The project includes Vitest suites verifying:
1. **Collision Detection**: All pairs of shape types across overlap, separated, contained, and edge-touching boundary conditions.
2. **Containment**: Exact container boundary tests with `1e-6` floating-point tolerance.
3. **Single Shape Max**: Analytical validation for squares, hexagonal circle packing ($\ge 100$ in 100x100), and interlocking triangle rows.
4. **Determinism**: Same seed + same inputs yields identical layout coordinates.
5. **Property-Based Testing**: 200 randomized test iterations verifying zero overlaps and zero overflow across arbitrary container sizes and template collections.

---

## 📄 Documentation

- [PRD Specification](file:///Users/deva/Documents/Accel/ShapePackingTool/PRD_Shape_Packing_Tool.md)
- [Algorithms and Complexity Guide](file:///Users/deva/Documents/Accel/ShapePackingTool/ALGORITHMS.md)
