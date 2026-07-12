import Konva from "konva";

export function downloadPngFromStage(
  stage: Konva.Stage,
  filename: string,
  backgroundColor: string | null,
) {
  const layer = stage.getLayers()[0];
  let bg: Konva.Rect | null = null;

  if (backgroundColor && layer) {
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

  const uri = stage.toDataURL({ pixelRatio: 2 });

  if (bg) {
    bg.destroy();
    layer?.batchDraw();
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
