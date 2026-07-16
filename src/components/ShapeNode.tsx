/**
 * One flowchart shape on the Konva canvas.
 * Props interface documents every input this component expects —
 * like a typed version of React propTypes.
 */
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
import { diamondPoints, parallelogramPoints } from "@/lib/geometry";
import { snapPositionByCenter } from "@/lib/grid";
import type { FlowShape } from "@/types";

interface ShapeNodeProps {
  shape: FlowShape;
  isSelected: boolean;
  isConnectSource: boolean;
  showTransformer: boolean;
  hideText: boolean;
  draggable: boolean;
  snapToGridEnabled: boolean;
  gridSize: number;
  /** When true, this drag moves the whole selection via onMoveSelected. */
  moveWithSelection: boolean;
  onSelect: (additive?: boolean) => void;
  onChange: (updates: Partial<FlowShape>) => void;
  onMoveSelected: (dx: number, dy: number) => void;
  onEditText: () => void;
}

export function ShapeNode({
  shape,
  isSelected,
  isConnectSource,
  showTransformer,
  hideText,
  draggable,
  snapToGridEnabled,
  gridSize,
  moveWithSelection,
  onSelect,
  onChange,
  onMoveSelected,
  onEditText,
}: ShapeNodeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const dragOrigin = useRef({ x: shape.x, y: shape.y });
  const lastPos = useRef({ x: shape.x, y: shape.y });

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

    let x = node.x();
    let y = node.y();
    const width = Math.max(40, shape.width * scaleX);
    const height = Math.max(30, shape.height * scaleY);
    if (snapToGridEnabled) {
      const snapped = snapPositionByCenter(x, y, width, height, gridSize);
      x = snapped.x;
      y = snapped.y;
      node.position({ x, y });
    }

    onChange({
      x,
      y,
      width,
      height,
    });
  };

  const constrainPosition = (
    x: number,
    y: number,
    shiftKey: boolean,
  ): { x: number; y: number } => {
    if (!shiftKey) return { x, y };
    const dx = Math.abs(x - dragOrigin.current.x);
    const dy = Math.abs(y - dragOrigin.current.y);
    if (dx >= dy) {
      return { x, y: dragOrigin.current.y };
    }
    return { x: dragOrigin.current.x, y };
  };

  return (
    <>
      <Group
        ref={groupRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        opacity={shape.opacity ?? 1}
        draggable={draggable}
        listening
        onClick={(e) => {
          e.cancelBubble = true;
          const additive =
            e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
          onSelect(additive);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(false);
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          onEditText();
        }}
        onDblTap={(e) => {
          e.cancelBubble = true;
          onEditText();
        }}
        onDragStart={(e) => {
          dragOrigin.current = { x: e.target.x(), y: e.target.y() };
          lastPos.current = { x: e.target.x(), y: e.target.y() };
        }}
        onDragMove={(e) => {
          let next = constrainPosition(
            e.target.x(),
            e.target.y(),
            e.evt.shiftKey,
          );
          e.target.position(next);

          if (moveWithSelection) {
            const dx = next.x - lastPos.current.x;
            const dy = next.y - lastPos.current.y;
            lastPos.current = next;
            if (dx !== 0 || dy !== 0) {
              onMoveSelected(dx, dy);
            }
            // Keep this node at lastPos; React will sync all selected shapes.
            e.target.position(lastPos.current);
            return;
          }

          onChange(next);
        }}
        onDragEnd={(e) => {
          let next = constrainPosition(
            e.target.x(),
            e.target.y(),
            e.evt.shiftKey,
          );
          if (snapToGridEnabled) {
            const snapped = snapPositionByCenter(
              next.x,
              next.y,
              shape.width,
              shape.height,
              gridSize,
            );
            if (moveWithSelection) {
              const dx = snapped.x - next.x;
              const dy = snapped.y - next.y;
              if (dx !== 0 || dy !== 0) {
                onMoveSelected(dx, dy);
              }
            }
            next = snapped;
          }
          e.target.position(next);
          if (!moveWithSelection) {
            onChange(next);
          }
        }}
        onTransformEnd={handleTransformEnd}
      >
        {shape.type === "rectangle" && (
          <Rect
            width={shape.width}
            height={shape.height}
            fill={shape.fill === "transparent" ? undefined : shape.fill}
            fillEnabled={shape.fill !== "transparent"}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "roundedRect" && (
          <Rect
            width={shape.width}
            height={shape.height}
            cornerRadius={24}
            fill={shape.fill === "transparent" ? undefined : shape.fill}
            fillEnabled={shape.fill !== "transparent"}
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
            fill={shape.fill === "transparent" ? undefined : shape.fill}
            fillEnabled={shape.fill !== "transparent"}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "diamond" && (
          <Line
            points={diamondPoints(shape.width, shape.height)}
            closed
            fill={shape.fill === "transparent" ? undefined : shape.fill}
            fillEnabled={shape.fill !== "transparent"}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "parallelogram" && (
          <Line
            points={parallelogramPoints(shape.width, shape.height)}
            closed
            fill={shape.fill === "transparent" ? undefined : shape.fill}
            fillEnabled={shape.fill !== "transparent"}
            stroke={highlight}
            strokeWidth={strokeWidth}
          />
        )}

        {shape.type === "text" && (
          <Rect
            width={shape.width}
            height={shape.height}
            fill={
              shape.fill === "transparent" ? "rgba(0,0,0,0)" : shape.fill
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
