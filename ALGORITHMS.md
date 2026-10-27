# Geometric Algorithms & Complexity Guide

This document details the mathematical models, collision detection primitives, spatial acceleration structures, and heuristic packing algorithms implemented in the **Shape Packing Tool**.

---

## 1. Mathematical Representation & Collision Detection

### Separating Axis Theorem (SAT)
- **Domain**: Convex polygons (squares, rectangles, isosceles triangles).
- **Theorem**: Two convex polygons do not overlap if and only if there exists a projection axis (normal to one of the polygon edges) along which their projected shadow intervals $[\min_A, \max_A]$ and $[\min_B, \max_B]$ do not overlap.
- **Formulation**:
  For an edge segment $\mathbf{e} = \mathbf{P}_2 - \mathbf{P}_1$, the outward normal is $\mathbf{n} = (-e_y, e_x)$. Normalized normal: $\hat{\mathbf{n}} = \frac{\mathbf{n}}{\|\mathbf{n}\|}$.
  The scalar projection of vertex $\mathbf{V}$ onto $\hat{\mathbf{n}}$ is $\text{proj} = \mathbf{V} \cdot \hat{\mathbf{n}}$.
  If $\max(A) \le \min(B) + \epsilon$ or $\max(B) \le \min(A) + \epsilon$, separation is found.
- **Touching Boundary Rule**: Touching edges ($\max(A) = \min(B)$ within $\epsilon = 10^{-6}$) are permitted and considered non-overlapping.
- **Complexity**: $O(E_A + E_B)$ where $E$ is the number of edges (e.g. $3 + 4 = 7$ checks for triangle-rect).

### Circle vs Polygon Collision
- **Circle Center Clamping**:
  1. Test if circle center $\mathbf{C}$ lies inside the convex polygon (cross-product sign test). If inside, overlap is guaranteed.
  2. For every boundary segment $\mathbf{P}_1 \mathbf{P}_2$, calculate the closest point $\mathbf{Q}$:
     $$\mathbf{V} = \mathbf{P}_2 - \mathbf{P}_1, \quad t = \text{clamp}\left(\frac{(\mathbf{C} - \mathbf{P}_1) \cdot \mathbf{V}}{\|\mathbf{V}\|^2}, 0, 1\right), \quad \mathbf{Q} = \mathbf{P}_1 + t \mathbf{V}$$
     If $\|\mathbf{C} - \mathbf{Q}\|^2 < (r - \epsilon)^2$, overlap occurs.
- **Complexity**: $O(E)$ segment distance checks.

### Circle vs Axis-Aligned Rect
- Circle center $\mathbf{C} = (cx, cy)$ is clamped to the rectangle bounds:
  $$x_{\text{clamp}} = \max(x_{\text{min}}, \min(cx, x_{\text{max}})), \quad y_{\text{clamp}} = \max(y_{\text{min}}, \min(cy, y_{\text{max}}))$$
  Distance test: $\|\mathbf{C} - (x_{\text{clamp}}, y_{\text{clamp}})\|^2 < (r - \epsilon)^2$.
- **Complexity**: $O(1)$.

---

## 2. Spatial Indexing: Uniform Spatial Hash Grid

Testing $N$ placed shapes against a candidate shape naively requires $O(N)$ collision tests, resulting in $O(N^2)$ algorithm runtime.

- **Data Structure**: Uniform 2D Spatial Hash Grid with cell dimension:
  $$\text{cellSize} = \max(32, \min(256, \max(\text{template dimensions})))$$
- **Insertion**: A shape with bounding box $[x, y, w, h]$ spans cells:
  $$c \in \left[\lfloor x / S \rfloor, \lfloor (x + w) / S \rfloor\right], \quad r \in \left[\lfloor y / S \rfloor, \lfloor (y + h) / S \rfloor\right]$$
- **Query**: Candidate bounding box queries the union of shapes in its overlapping cells, pre-filtered with AABB before SAT/Circle evaluation.
- **Complexity**: $O(1)$ expected per query, reducing total fill time from $O(N^2)$ to $O(N)$.

---

## 3. Seeded Pseudo-Random Number Generator (Mulberry32)

To ensure **100% determinism** and reproducibility across runs, exports, and imports:
```ts
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```
Properties:
- Period: $2^{32}$.
- Uniform distribution across $[0, 1)$.
- Excellent avalanche characteristics and fast 32-bit integer arithmetic.

---

## 4. Packing Heuristics

### A. Seeded Random Fill
1. Samples random points uniformly in $[0, W - w] \times [0, H - h]$.
2. Chooses shapes using weighted random selection based on user-configured weights.
3. Fast containment pre-check followed by $O(1)$ spatial grid collision test.
4. Stops after consecutive failure threshold (default 300) or max attempts (default 50,000).
5. Optional fine-grid gap-fill pass sampling remaining voids.

### B. Single-Shape Max Strategies
- **Rectangles / Squares**:
  - Grid: $\lfloor W/w \rfloor \times \lfloor H/h \rfloor$.
  - 90° Rotated Grid: $\lfloor W/h \rfloor \times \lfloor H/w \rfloor$.
  - Mixed Guillotine / Shelf: Packs main grid, then packs remaining bottom or right residual strips with 90° rotated shapes.
- **Circles**:
  - Square Lattice: Density $\frac{\pi}{4} \approx 78.5\%$.
  - Hexagonal Close Packing:
    Row spacing $\Delta y = r \sqrt{3} \approx 1.732 \cdot r$. Alternating horizontal row offsets $\Delta x = r$.
    Both horizontal row-major and vertical column-major lattice orientations are tested across both phase offsets ($\phi \in \{0, 1\}$).
    Theoretical density: $\frac{\pi}{2\sqrt{3}} \approx 90.7\%$.
- **Triangles (Isosceles)**:
  - Upright Grid: Baseline $\lfloor W/b \rfloor \times \lfloor H/h \rfloor$.
  - Interlocking Alternating Rows:
    Upright triangles (apex up) interlock with inverted triangles (rotated 180°, apex down).
    Consecutive triangles in the same row advance horizontally by only $b/2$, nearly doubling capacity.

### C. Smart Fill (Bottom-Left Skyline Heuristic)
1. Sorts enabled templates by bounding box area in descending order.
2. Maintains candidate insertion points generated from container corners and the right/bottom vertices of placed shapes.
3. Sorts candidate points in Bottom-Left order (ascending $y$, then ascending $x$).
4. Evaluates greedy placement and executes multiple randomized restarts within a timebox (default 1500–3000ms).
5. Completes with a micro-grid gap filling pass using the smallest enabled template.
