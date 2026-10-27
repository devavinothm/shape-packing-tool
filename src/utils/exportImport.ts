import type { Container, PlacedShape, ShapeTemplate } from '../core/types';

export interface LayoutExportData {
  version: '1.0';
  timestamp: string;
  container: Container;
  templates: ShapeTemplate[];
  placedShapes: PlacedShape[];
}

export function exportLayoutToJSON(
  container: Container,
  templates: ShapeTemplate[],
  placedShapes: PlacedShape[]
): void {
  const data: LayoutExportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    container,
    templates,
    placedShapes,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shape-packing-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseLayoutJSON(jsonString: string): {
  container: Container;
  templates: ShapeTemplate[];
  placedShapes: PlacedShape[];
} {
  const parsed = JSON.parse(jsonString) as LayoutExportData;
  if (!parsed.container || typeof parsed.container.width !== 'number') {
    throw new Error('Invalid layout JSON: missing container dimensions');
  }
  if (!Array.isArray(parsed.templates)) {
    throw new Error('Invalid layout JSON: missing templates list');
  }
  if (!Array.isArray(parsed.placedShapes)) {
    throw new Error('Invalid layout JSON: missing placedShapes array');
  }
  return {
    container: parsed.container,
    templates: parsed.templates,
    placedShapes: parsed.placedShapes,
  };
}

export function exportCanvasToSVG(svgElement: SVGSVGElement, filename = 'shape-packing.svg'): void {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCanvasToPNG(
  svgElement: SVGSVGElement,
  width: number,
  height: number,
  filename = 'shape-packing.png'
): void {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      });
    }
    URL.revokeObjectURL(url);
  };

  img.src = url;
}
