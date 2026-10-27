import { describe, expect, it } from 'vitest';
import { createMulberry32, randomRange } from '../src/core/random';
import { randomFill } from '../src/core/randomFill';
import { smartFill } from '../src/core/smartFill';
import type { Container, ShapeTemplate, ShapeType } from '../src/core/types';
import { validateLayout } from '../src/core/validate';

describe('Property-Based Layout Correctness (200 randomized runs)', () => {
  it('guarantees zero overlaps and zero overflow across 200 random iterations', { timeout: 30000 }, () => {
    const masterRng = createMulberry32(1337);
    const shapeTypes: ShapeType[] = ['square', 'rectangle', 'circle', 'triangle'];

    for (let i = 0; i < 200; i++) {
      // Generate randomized container dimensions
      const container: Container = {
        width: Math.floor(randomRange(masterRng, 150, 600)),
        height: Math.floor(randomRange(masterRng, 150, 600)),
      };

      // Generate 2 to 4 randomized templates
      const numTemplates = Math.floor(randomRange(masterRng, 2, 5));
      const templates: ShapeTemplate[] = [];
      const templateMap: Record<string, ShapeTemplate> = {};

      for (let t = 0; t < numTemplates; t++) {
        const type = shapeTypes[Math.floor(masterRng() * shapeTypes.length)];
        let params: Record<string, number> = {};

        if (type === 'square') {
          params = { size: Math.floor(randomRange(masterRng, 20, 60)) };
        } else if (type === 'rectangle') {
          params = {
            width: Math.floor(randomRange(masterRng, 20, 70)),
            height: Math.floor(randomRange(masterRng, 15, 50)),
          };
        } else if (type === 'circle') {
          params = { radius: Math.floor(randomRange(masterRng, 10, 30)) };
        } else if (type === 'triangle') {
          params = {
            base: Math.floor(randomRange(masterRng, 25, 70)),
            height: Math.floor(randomRange(masterRng, 20, 60)),
          };
        }

        const template: ShapeTemplate = {
          id: `tpl-${i}-${t}`,
          type,
          params,
          color: '#3b82f6',
          enabled: true,
          weight: Math.floor(randomRange(masterRng, 1, 5)),
        };

        templates.push(template);
        templateMap[template.id] = template;
      }

      const seed = Math.floor(masterRng() * 1000000);

      // Alternate between Random Fill and Smart Fill
      let placed;
      if (i % 2 === 0) {
        placed = randomFill(container, templates, [], {
          seed,
          maxAttempts: 1500,
          failureThreshold: 80,
          fillGaps: true,
          gapGridStep: 15,
        });
      } else {
        placed = smartFill(container, templates, [], {
          seed,
          timeLimitMs: 50,
          fillGaps: true,
        });
      }

      // Assert zero collisions and zero boundary overflows
      const validation = validateLayout(container, templateMap, placed);
      if (!validation.isValid) {
        console.error(`Failed at iteration ${i}:`, {
          container,
          templates,
          seed,
          overlaps: validation.overlaps,
          overflows: validation.overflows,
        });
      }

      expect(validation.isValid).toBe(true);
      expect(validation.overlaps).toHaveLength(0);
      expect(validation.overflows).toHaveLength(0);
    }
  });
});
