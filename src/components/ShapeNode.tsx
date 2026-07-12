"use client";

import { useEffect, useRef } from "react";
import {
  Circle,
  Ellipse,
  Group,
  Line,
  Rect,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { diamondPoints } from "@/lib/geometry";
import type { FlowShape } from "@/types";

interface ShapeNodeProps {
  shape: FlowShape;
  isSelected: boolean;
  isConnectSource: boolean;
  showTransformer: boolean;
  hideText: boolean;
  draggable: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<FlowShape>) => void;
  onEditText: () => void;
}

export function ShapeNode({
  shape,
  isSelected,
  isConnectSource,
  showTransformer,
  hideText,
  draggable,
  onSelect,
  onChange,
  onEditText,
}: ShapeNodeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const group = groupRef.current;
    if (!transformer) return;

    if (showTransformer && group && draggable) {
      transformer.nodes([group]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [showTransformer, draggable, shape.id]);

  const highlight =
    isConnectSource || isSelected
      ? isConnectSource
        ? "#2563eb"
        : "#0f766e"
      : shape.stroke;

  const strokeWidth =
    isSelected || isConnectSource ? shape.strokeWidth + 1 : shape.strokeWidth;

  const commonTextProps = {
    text: hideText ? "" : shape.text,
    fontSize: shape.fontSize,
    fontFamily: "system-ui, sans-serif",
    fill: "#0f172a",
    width: shape.width,
    height: shape.height,
    align: "center" as const,
    verticalAlign: "middle" as const,
    listening: false,
    padding: 8,
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(40, shape.width * scaleX),
      height: Math.max(30, shape.height * scaleY),
    });
  };

  return (
    <>
      <Group
        ref={groupRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        draggable={draggable}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          onEditText();
        }}
        onDblTap={(e) => {
          e.cancelBubble = true;
          onEditText();
        }}
        onDragMove={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={handleTransformEnd}
      >
        {shape.type === "rectangle" && (
          <Rect
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "roundedRect" && (
          <Rect
            width={shape.width}
            height={shape.height}
            cornerRadius={12}
            fill={shape.fill}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "circle" && (
          <Ellipse
            x={shape.width / 2}
            y={shape.height / 2}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            fill={shape.fill}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "diamond" && (
          <Line
            points={diamondPoints(shape.width, shape.height)}
            closed
            fill={shape.fill}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "text" && (
          <Rect
            width={shape.width}
            height={shape.height}
            fill={
              shape.fill === "transparent"
                ? "rgba(255,255,255,0.01)"
                : shape.fill
            }
            stroke={highlight}
            strokeWidth={strokeWidth}
            dash={[6, 4]}
          />
        )}

        <Text {...commonTextProps} />

        {isConnectSource && (
          <Circle
            x={shape.width / 2}
            y={-10}
            radius={5}
            fill="#2563eb"
            listening={false}
          />
        )}
      </Group>

      {showTransformer && draggable && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 30) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
