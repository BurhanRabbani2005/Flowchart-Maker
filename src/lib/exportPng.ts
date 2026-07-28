/**
 * ============================================================
 * exportPng.ts — download the canvas as a PNG image
 * ============================================================
 */
import Konva from "konva";

/**
 * `export function downloadPngFromStage(...)`
 *
 * WHAT IT DOES (step by step):
 *   1. Optionally draw a temporary background rectangle (white, etc.)
 *   2. Ask Konva for a PNG data URL (a long "data:image/png;base64,..." string)
 *   3. Remove the temporary background
 *   4. Create a fake <a download="file.png"> link and click it
 *      → the browser saves the file
 *
 * PARAMETERS:
 *   stage            → the Konva Stage (the whole canvas)
 *   filename         → e.g. "flowchart.png"
 *   backgroundColor  → string like "#ffffff", OR null for transparent PNG
 *
 * `string | null` is a UNION TYPE: value is a string OR null (nothing).
 */
export function downloadPngFromStage(
  stage: Konva.Stage,
  filename: string,
  backgroundColor: string | null,
) {
  const layer = stage.getLayers()[0];
  // Start as null; may become a Rect if we need a background.
  let bg: Konva.Rect | null = null;

  if (backgroundColor && layer) {
    // Undo pan/zoom so the background covers the visible world area.
    const scale = stage.scaleX() || 1;
    const x = -stage.x() / scale;
    const y = -stage.y() / scale;
    const width = stage.width() / scale;
    const height = stage.height() / scale;

    bg = new Konva.Rect({
      x,
      y,
      width,
      height,
      fill: backgroundColor,
      listening: false, // don't steal mouse events
      name: "__export_bg",
    });
    layer.add(bg);
    bg.moveToBottom(); // sit behind shapes
    layer.batchDraw();
  }

  // pixelRatio: 2 = sharper image on retina screens
  const uri = stage.toDataURL({ pixelRatio: 2 });

  // Always clean up so the live editor does not keep the export background.
  if (bg) {
    bg.destroy();
    layer?.batchDraw(); // `?.` = only call if layer is not null/undefined
  }

  // Same download trick you can use in plain browser JavaScript.
  const link = document.createElement("a");
  link.download = filename;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
