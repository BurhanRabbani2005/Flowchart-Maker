/**
 * Turn the Konva stage (canvas) into a downloadable PNG file.
 */
import Konva from "konva";

/**
 * Union type in a parameter: `string | null`
 * means "a string OR null" (no background when transparent export is chosen).
 */
export function downloadPngFromStage(
  stage: Konva.Stage,
  filename: string,
  backgroundColor: string | null,
) {
  const layer = stage.getLayers()[0];
  // `| null` variables often start as null, then get assigned later.
  let bg: Konva.Rect | null = null;

  if (backgroundColor && layer) {
    // Convert screen coordinates back to "world" coordinates using zoom/pan.
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
      listening: false,
      name: "__export_bg",
    });
    layer.add(bg);
    bg.moveToBottom();
    layer.batchDraw();
  }

  // Data URL = a long string starting with "data:image/png;base64,..."
  const uri = stage.toDataURL({ pixelRatio: 2 });

  // Clean up the temporary background so it doesn't stay on the live canvas.
  if (bg) {
    bg.destroy();
    layer?.batchDraw(); // `?.` = optional chaining: call only if layer exists
  }

  // Classic browser download trick: create a temporary <a download> link and click it.
  const link = document.createElement("a");
  link.download = filename;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
