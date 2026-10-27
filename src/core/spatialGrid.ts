import { aabbOverlap, checkCollision, EPSILON } from './collision';
import { getBoundingBox, getGeometry } from './geometry';
import type { BoundingBox, ConcreteGeometry, PlacedShape, ShapeTemplate } from './types';

export interface GridItem {
  placed: PlacedShape;
  template: ShapeTemplate;
  box: BoundingBox;
  geometry: ConcreteGeometry;
}

export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, GridItem[]> = new Map();
  private items: GridItem[] = [];

  constructor(cellSize = 64) {
    this.cellSize = Math.max(16, cellSize);
  }

  private getKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  private getCellRange(box: BoundingBox) {
    const minCol = Math.floor(box.x / this.cellSize);
    const maxCol = Math.floor((box.x + box.width) / this.cellSize);
    const minRow = Math.floor(box.y / this.cellSize);
    const maxRow = Math.floor((box.y + box.height) / this.cellSize);
    return { minCol, maxCol, minRow, maxRow };
  }

  public insert(placed: PlacedShape, template: ShapeTemplate): void {
    const box = getBoundingBox(template, placed);
    const geometry = getGeometry(template, placed);
    const item: GridItem = { placed, template, box, geometry };
    this.items.push(item);

    const { minCol, maxCol, minRow, maxRow } = this.getCellRange(box);
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = this.getKey(c, r);
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        cell.push(item);
      }
    }
  }

  public hasCollision(
    candidatePlaced: PlacedShape,
    candidateTemplate: ShapeTemplate,
    eps = EPSILON
  ): boolean {
    const candidateBox = getBoundingBox(candidateTemplate, candidatePlaced);
    const candidateGeo = getGeometry(candidateTemplate, candidatePlaced);

    const { minCol, maxCol, minRow, maxRow } = this.getCellRange(candidateBox);
    const checked = new Set<string>();

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = this.getKey(c, r);
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const neighbor of cell) {
          if (checked.has(neighbor.placed.id)) continue;
          checked.add(neighbor.placed.id);

          // Skip self if comparing existing placed shape
          if (neighbor.placed.id === candidatePlaced.id) continue;

          // AABB pre-check
          if (!aabbOverlap(candidateBox, neighbor.box, eps)) {
            continue;
          }

          // Exact geometric collision
          if (checkCollision(candidateGeo, neighbor.geometry, eps)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public getAll(): GridItem[] {
    return this.items;
  }

  public clear(): void {
    this.cells.clear();
    this.items = [];
  }
}
