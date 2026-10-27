# PRD: Shape Packing Tool (2D Container Fill Calculator)

**Version:** 1.0
**Status:** Ready for build
**Audience:** AI coding agents and developers

---

## 1. Overview

A browser-based interactive tool where a user defines a **large container box** and a set of **small shapes** (square, rectangle, circle, triangle). Both the container and the shapes are **resizable**. The tool **calculates how many small shapes fit** inside the container without overlapping or crossing the container's edges, and offers a **one-click Random Fill**.

This is a 2D bin-packing / nesting problem. The product should demonstrate sound geometry (collision detection, containment) and sensible packing heuristics, because it will also be used to discuss the problem in interviews.

## 2. Goals and Non-Goals

### Goals
- Let users set the container size and shape sizes precisely and visually (drag handles and numeric inputs).
- Compute and display how many shapes fit, using clearly named algorithms.
- Provide a one-click Random Fill that visibly packs the container.
- Show live stats: count per shape type, total count, area utilization %.
- Keep geometry logic separate from UI and fully unit tested.

### Non-Goals (v1)
- 3D packing.
- Guaranteed mathematically optimal packing (NP-hard). The tool reports "best found".
- Free rotation of shapes (optional in v1.1, see Section 12).
- User accounts, backend, or persistence beyond local export/import.

## 3. Users and Use Cases

| User | Use case |
|---|---|
| Client / evaluator | Quickly see how many items fit in a box, tweak sizes, compare strategies. |
| Interview candidate / learner | Understand and explain collision detection and packing heuristics. |
| Anyone planning layouts | Estimate how many items (tiles, cutouts, packages) fit in a space. |

## 4. Recommended Tech Stack

- **Language:** TypeScript (strict mode).
- **Framework:** React 18 + Vite.
- **Rendering:** SVG for v1 (simple resize handles, crisp output, easy hit-testing). Canvas or Konva is acceptable if performance requires it (more than about 2,000 shapes).
- **State:** Zustand (or React context + reducer).
- **Styling:** Tailwind CSS.
- **Testing:** Vitest for geometry and algorithms, Playwright (optional) for end-to-end.
- **Heavy compute:** run packing in a Web Worker so the UI never freezes.

Hard requirement: **all geometry and packing code lives in a pure TypeScript module with no React or DOM imports.**

## 5. Core Concepts and Data Model

```ts
type ShapeType = 'square' | 'rectangle' | 'circle' | 'triangle';

interface Container {
  width: number;   // in units (px by default)
  height: number;
}

// A "template" is a shape definition the user configures.
interface ShapeTemplate {
  id: string;
  type: ShapeType;
  // square: size; rectangle: width,height; circle: radius;
  // triangle: base,height (isosceles, apex pointing up)
  params: Record<string, number>;
  color: string;
  enabled: boolean;      // included in fill operations
  weight?: number;       // relative pick probability in Random Fill (default 1)
}

// A "placed" shape is one instance inside the container.
interface PlacedShape {
  id: string;
  templateId: string;
  x: number;             // bounding-box top-left, container coordinates
  y: number;
  rotation: number;      // degrees, 0 in v1
}
```

Coordinates: origin is the container's top-left, x to the right, y downward.

Units: default is px, with an optional unit label (mm, cm, in) shown in the UI. Unit only changes labels, not math.

## 6. Functional Requirements

### 6.1 Container
- **FR-C1:** User can set container width and height via numeric inputs (min 10, max 5000).
- **FR-C2:** User can drag container edge/corner handles to resize it. Inputs and handles stay in sync.
- **FR-C3:** If the container shrinks and placed shapes no longer fit, show a warning and offer "Remove shapes outside" or "Cancel resize".
- **FR-C4:** The canvas auto-scales (zoom-to-fit) so the container is always fully visible. Show the zoom level.

### 6.2 Shape Templates
- **FR-S1:** User can add a template of type square, rectangle, circle, or triangle.
- **FR-S2:** Each template has numeric inputs for its parameters (see data model). Min size 1, max not larger than the container's largest dimension.
- **FR-S3:** Each template can be resized visually via drag handles in a "preview" area, and via numeric inputs.
- **FR-S4:** Templates can be duplicated, deleted, enabled/disabled, and recolored.
- **FR-S5:** Editing a template's size updates all placed instances of it. Instances that now collide or overflow are flagged red and listed in a warning.
- **FR-S6:** The app ships with 4 default templates (one per type) so it is usable immediately.

### 6.3 Manual Placement
- **FR-M1:** User can drag a template from the sidebar into the container to place one instance.
- **FR-M2:** User can drag placed shapes to move them. While dragging, show a green outline if the position is valid and red if it overlaps or overflows.
- **FR-M3:** Invalid drops snap back to the previous valid position.
- **FR-M4:** Click to select a shape, Delete key removes it. Shift-click for multi-select.
- **FR-M5:** Optional snapping to a grid (toggle, default off).

### 6.4 Calculation ("How many fit")
- **FR-K1:** A **Calculate** panel offers a mode selector:
  1. **Single shape max:** choose one template and compute the best-found maximum count of that shape alone.
  2. **Mixed fill:** fill using all enabled templates (see 6.5).
  3. **Current count:** count what is currently placed (always live, no button).
- **FR-K2:** Result panel shows: total count, count per template, container area, used area, utilization %, algorithm used, and compute time.
- **FR-K3:** Single shape max must run all applicable strategies for that shape (Section 8.4) and keep the layout with the highest count. It shows which strategy won.
- **FR-K4:** Computation shows a progress indicator and has a Cancel button.

### 6.5 Random Fill (one click)
- **FR-R1:** A prominent **Random Fill** button clears the container (with confirmation if shapes were manually placed) and fills it using the Random Fill algorithm (Section 8.3).
- **FR-R2:** Shapes appear progressively (animate in batches) so the user sees it filling.
- **FR-R3:** Controls (collapsible "Advanced"): max attempts, failure threshold, seed, "keep existing shapes", "fill gaps only".
- **FR-R4:** A **seed** field makes results reproducible. A "Re-roll" button picks a new seed. Display the seed used.
- **FR-R5:** Random Fill only uses enabled templates and their current sizes. It must never produce overlapping or out-of-bounds shapes.
- **FR-R6:** A **Smart Fill** button (separate from Random Fill) runs the best-found heuristic for the enabled templates (Section 8.5).

### 6.6 Utility Actions
- **FR-U1:** Clear all, Undo/Redo (at least 50 steps), Reset to defaults.
- **FR-U2:** Export layout as JSON and PNG/SVG. Import JSON.
- **FR-U3:** Toggle overlays: show bounding boxes, show IDs, show wasted-space heatmap (optional).

## 7. UI / UX Specification

### Layout (desktop, three zones)
```
+--------------------------------------------------------------+
| Header: App name | Undo Redo | Export Import | Units         |
+----------------+-----------------------------+---------------+
| LEFT SIDEBAR   | CENTER CANVAS               | RIGHT PANEL   |
| Container      |  [ container box with       | Results       |
|  W / H inputs  |    placed shapes ]          |  Total count  |
| Shape templates|                             |  Per type     |
|  + Add shape   |  zoom fit / zoom +/-        |  Utilization  |
|  list w/ edit  |                             |  Algorithm    |
|                |                             |  Time, seed   |
| [Random Fill]  |                             |               |
| [Smart Fill]   |                             | Warnings      |
| [Clear]        |                             |               |
+----------------+-----------------------------+---------------+
```

### UX rules
- Responsive: on screens under 900px, sidebar and results become collapsible drawers.
- Live count and utilization update instantly on any change.
- Color-code shapes by template; show a legend.
- Invalid states (overlap, overflow) are always visible, never silent.
- Keyboard accessible: Tab through controls, Delete to remove, Ctrl/Cmd+Z for undo, arrow keys to nudge a selected shape by 1 unit (Shift = 10).
- Provide empty states, loading states (during compute), and error toasts.
- Light and dark theme.

## 8. Geometry and Algorithms (Core Spec)

### 8.1 Shape representation
Convert every shape to a common form for collision tests:
- **Polygon shapes** (square, rectangle, triangle): list of vertices (convex).
- **Circle:** center and radius.

Triangle: isosceles. Vertices relative to its bounding box: `(0,h)`, `(b,h)`, `(b/2,0)`.

### 8.2 Containment and Collision
- **Inside container:** every vertex within `[0,W] x [0,H]`. For circles, `r <= cx <= W-r` and `r <= cy <= H-r`.
- **Rect vs rect:** AABB test.
- **Circle vs circle:** `distance(c1,c2) < r1 + r2`.
- **Circle vs rect:** clamp circle center to the rect, compare distance to radius.
- **Polygon vs polygon (triangle included):** Separating Axis Theorem (SAT).
- **Circle vs polygon (triangle):** closest point on polygon edges to circle center, plus point-in-polygon check.
- Touching edges is **allowed** (not an overlap). Use an epsilon of `1e-6` for floating-point safety.
- **Performance:** use a **uniform spatial grid** (cell size about the largest shape) so each new shape is only tested against nearby shapes, not all shapes.

### 8.3 Random Fill algorithm
```
rng = seeded random (mulberry32)
placed = []  (or existing shapes if "keep existing")
consecutiveFailures = 0
while consecutiveFailures < FAIL_LIMIT (default 300) and attempts < MAX_ATTEMPTS (default 50000):
    template = weightedPick(enabled templates, rng)
    x = rng() * (W - template.width)
    y = rng() * (H - template.height)
    candidate = makeShape(template, x, y)
    if insideContainer(candidate) and noCollision(candidate, placed via spatial grid):
        placed.push(candidate); consecutiveFailures = 0
    else:
        consecutiveFailures++
return placed
```
Notes: Random Fill is intentionally simple and non-optimal. Optionally follow with a **gap-fill pass** that tries to place the smallest template on a fine grid of remaining positions.

### 8.4 Single-shape max strategies
Run each applicable strategy, compare counts, keep the best.

| Shape | Strategies |
|---|---|
| **Rectangle / Square** | (a) Simple grid: `floor(W/w) * floor(H/h)`. (b) Same with rotated 90 degrees if rotation allowed: `floor(W/h) * floor(H/w)`. (c) Mixed-orientation shelf packing (guillotine) as best-effort improvement. |
| **Circle** | (a) Square grid: `floor(W/d) * floor(H/d)`, `d = 2r`. (b) **Hexagonal packing**: rows offset by `r`, row spacing `r*sqrt(3)`; try both row-offset starting positions and both orientations (rows along width or height). Keep the higher count. |
| **Triangle (isosceles)** | (a) Alternating up/down tiling in rows: triangles pointing up and down interlock, giving about 2 triangles per `b x h` cell; compute rows `floor(H/h)` and per-row count `floor((W - b/2)/(b/2))`-style layout, and handle the half-offset edge cases. (b) Plain grid of upright triangles as baseline. Verify every result with the collision checker. |

All results must pass the validity checker before being shown.

### 8.5 Smart Fill (mixed shapes, best-found)
Heuristic, time-boxed (default 3 seconds, configurable):
1. Sort enabled templates by bounding-box area descending (place large first).
2. Use **Bottom-Left Fill** with a candidate-position set: corners of the container and right/bottom edges of already placed shapes ("skyline" or "maximal rectangles" approach for rect-like shapes).
3. For each candidate position, try the next template, accept if valid.
4. Repeat with several template orderings (random restarts) until time is up. Keep the best layout (highest total count, tie-break by utilization).
5. Finish with a **gap-fill pass** using the smallest template.

Document clearly in the UI: "Best found, not guaranteed optimal."

### 8.6 Utilization
`utilization % = (sum of shape areas) / (W * H) * 100`
Areas: square `s^2`, rectangle `w*h`, circle `pi*r^2`, triangle `b*h/2`.

## 9. Non-Functional Requirements

- **Performance:** Random Fill of up to 1,000 shapes completes under 1 second. Smart Fill respects its time box. UI stays at 60 fps while dragging with up to 500 shapes.
- **Correctness:** Zero overlaps and zero out-of-bounds shapes in any algorithm output. This is verified by a property-based test (Section 11).
- **Determinism:** Same seed + same inputs = identical layout.
- **Accessibility:** WCAG AA contrast, labeled inputs, focus rings.
- **Browser support:** latest Chrome, Edge, Firefox, Safari.
- **Code quality:** TypeScript strict, ESLint + Prettier, no `any`.

## 10. Suggested Project Structure

```
/src
  /core                 # pure TS, no React
    geometry.ts         # vertices, areas, bounds
    collision.ts        # SAT, circle tests, containment
    spatialGrid.ts
    random.ts           # seeded RNG
    randomFill.ts
    singleShapeMax.ts   # grid, hex, triangle tiling
    smartFill.ts
    validate.ts         # validateLayout(container, shapes)
  /workers
    packing.worker.ts
  /state
    store.ts
  /components
    Canvas/ ContainerBox/ ShapeView/ ResizeHandles/
    Sidebar/ TemplateEditor/ ResultsPanel/ Toolbar/
  /utils
    export.ts  units.ts
  App.tsx  main.tsx
/tests
  collision.test.ts  randomFill.test.ts  singleShapeMax.test.ts  validate.test.ts
```

## 11. Testing and Acceptance Criteria

### Unit tests (Vitest)
- Collision: every pair of shape types, covering overlap, touching, contained, and separated cases.
- Containment: shapes exactly on the edge are valid, shapes 0.01 over are invalid.
- Single-shape max: 100x100 box with 10x10 squares returns 100. 100x100 box with circles of radius 5 returns at least 100, and the hex result is at least the square-grid result.
- Seed determinism: two runs with the same seed give identical output.

### Property-based test
For 200 random containers/templates/seeds, `validateLayout()` on every Random Fill and Smart Fill output must report **zero overlaps and zero overflow**.

### Acceptance criteria (the "done" checklist)
- [ ] User can resize the container by dragging and by typing, and both stay in sync.
- [ ] User can add, edit, resize, duplicate, delete square, rectangle, circle, and triangle templates.
- [ ] Manual drag-and-drop placement validates overlap/overflow in real time.
- [ ] Random Fill fills the box with one click, shows progress animation, and the count matches the visible shapes.
- [ ] Smart Fill returns a count greater than or equal to Random Fill for the same inputs in most cases.
- [ ] Single-shape max shows the winning strategy and count.
- [ ] Results panel shows total, per-type count, utilization %, seed, and compute time.
- [ ] Changing any size recalculates or flags invalid shapes immediately.
- [ ] Undo/redo, export JSON/PNG, import JSON all work.
- [ ] No overlaps or out-of-bounds shapes in any generated layout.
- [ ] UI works on desktop and tablet widths.

## 12. Milestones

| # | Milestone | Contents |
|---|---|---|
| M1 | Core geometry | Shape models, collision, containment, validate, unit tests |
| M2 | Static UI | Layout, container and template editors, SVG rendering |
| M3 | Interaction | Drag, resize handles, selection, live validation, undo/redo |
| M4 | Random Fill | Seeded RNG, spatial grid, progressive animation, results panel |
| M5 | Smart modes | Single-shape max (grid, hex, triangle), Smart Fill, Web Worker |
| M6 | Polish | Export/import, themes, accessibility, responsive, docs |

### Future (v1.1+)
- Shape rotation (90 degrees first, then free rotation).
- More shapes (ellipse, hexagon, custom polygon).
- Multiple containers, irregular container shapes.
- Cost/weight constraints and priorities (maximize value, not count).

## 13. Edge Cases to Handle

- Shape larger than the container: show a message "does not fit", count 0.
- Container resized below the size of all shapes.
- Zero or negative inputs: reject with inline validation.
- Very small shapes causing huge counts: cap at 10,000 shapes with a warning.
- Disabled templates or no enabled templates: disable fill buttons with a tooltip.
- Floating-point error at exact-fit boundaries (use epsilon).
- Duplicate seeds and reproducibility after import/export.

## 14. Interview Talking Points (appendix for the user)

- This is the **2D bin packing** problem, which is NP-hard, so practical solutions use heuristics.
- Mention **SAT** for convex polygon collision and the circle-rectangle clamp trick.
- Explain why a **spatial grid** reduces collision checks from O(n) to about O(1) per placement.
- Contrast **random fill** (fast, non-optimal) with **grid/hex/bottom-left** heuristics.
- Circles: hex packing reaches about 90.7% density versus 78.5% for a square grid.
- Always state that results are "best found", with measurable utilization as the quality metric.

## 15. Deliverables for the AI Agent

1. Working web app per the requirements above.
2. `README.md` with setup, scripts, and an architecture overview.
3. Unit and property tests passing in CI (`npm test`).
4. A short `ALGORITHMS.md` explaining each algorithm and its complexity.
5. Sample layouts (JSON) for quick demo.

**Build order for agents:** M1 first and fully tested, then UI milestones. Do not start UI work until `validateLayout()` passes its tests.
