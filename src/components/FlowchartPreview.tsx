"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Text, Group, Circle } from "react-konva";
import type { FlowchartDocument } from "@/lib/flowchartFile";
import type { FlowShape } from "@/types";

interface FlowchartPreviewProps {
  document: FlowchartDocument;
  label: string;
}

function shapeBounds(shapes: FlowShape[]) {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }
  const pad = 40;
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

function PreviewShape({ shape }: { shape: FlowShape }) {
  const common = {
    x: shape.x,
    y: shape.y,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    opacity: shape.opacity ?? 1,
    listening: false,
  };

  let body = null;
  switch (shape.type) {
    case "circle":
      body = (
        <Circle
          {...common}
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          radius={Math.min(shape.width, shape.height) / 2}
        />
      );
      break;
    case "diamond": {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      body = (
        <Line
          points={[
            cx,
            shape.y,
            shape.x + shape.width,
            cy,
            cx,
            shape.y + shape.height,
            shape.x,
            cy,
          ]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity ?? 1}
          listening={false}
        />
      );
      break;
    }
    case "parallelogram": {
      const skew = Math.min(24, shape.width * 0.25);
      body = (
        <Line
          points={[
            shape.x + skew,
            shape.y,
            shape.x + shape.width,
            shape.y,
            shape.x + shape.width - skew,
            shape.y + shape.height,
            shape.x,
            shape.y + shape.height,
          ]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity ?? 1}
          listening={false}
        />
      );
      break;
    }
    case "roundedRect":
      body = <Rect {...common} width={shape.width} height={shape.height} cornerRadius={12} />;
      break;
    default:
      body = <Rect {...common} width={shape.width} height={shape.height} />;
  }

  return (
    <Group listening={false}>
      {body}
      {shape.text ? (
        <Text
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          text={shape.text}
          fontSize={shape.fontSize}
          fill="#0f172a"
          align="center"
          verticalAlign="middle"
          listening={false}
          opacity={shape.opacity ?? 1}
        />
      ) : null}
    </Group>
  );
}

export function FlowchartPreview({ document, label }: FlowchartPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 240 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setSize({
        width: Math.max(160, el.clientWidth),
        height: Math.max(160, el.clientHeight),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const view = useMemo(() => {
    const bounds = shapeBounds(document.shapes);
    const worldW = Math.max(1, bounds.maxX - bounds.minX);
    const worldH = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min(size.width / worldW, size.height / worldH, 1.25);
    const x = (size.width - worldW * scale) / 2 - bounds.minX * scale;
    const y = (size.height - worldH * scale) / 2 - bounds.minY * scale;
    return { x, y, scale };
  }, [document.shapes, size.height, size.width]);

  const shapeMap = useMemo(() => {
    const map = new Map(document.shapes.map((s) => [s.id, s]));
    return map;
  }, [document.shapes]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
        {label}
      </div>
      <div ref={containerRef} className="min-h-0 flex-1">
        {document.shapes.length === 0 && document.connections.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Empty diagram
          </div>
        ) : (
          <Stage width={size.width} height={size.height} listening={false}>
            <Layer x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}>
              {document.connections.map((connection) => {
                const from = shapeMap.get(connection.fromId);
                const to = shapeMap.get(connection.toId);
                if (!from || !to) return null;
                const x1 = from.x + from.width / 2;
                const y1 = from.y + from.height / 2;
                const x2 = to.x + to.width / 2;
                const y2 = to.y + to.height / 2;
                return (
                  <Line
                    key={connection.id}
                    points={[x1, y1, x2, y2]}
                    stroke={connection.stroke}
                    strokeWidth={connection.strokeWidth}
                    opacity={connection.opacity ?? 1}
                    listening={false}
                  />
                );
              })}
              {document.shapes.map((shape) => (
                <PreviewShape key={shape.id} shape={shape} />
              ))}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
