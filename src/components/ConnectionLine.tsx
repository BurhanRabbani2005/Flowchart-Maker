/**
 * Draws one connector between two shapes, plus drag handles when selected.
 * Local UI state (`hovered`) stays in this component with useState.
 */
"use client";

import { useState } from "react";
import { Circle, Group, Line, Path } from "react-konva";
import {
  getCardinalPoint,
  getConnectionLinePoints,
  getOrthogonalRoute,
  nearestCardinalDir,
  type CardinalDir,
} from "@/lib/geometry";
import {
  DEFAULT_CONNECTION_PROPS,
  type Connection,
  type FlowShape,
} from "@/types";

interface ConnectionLineProps {
  connection: Connection;
  shapes: FlowShape[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onChange: (id: string, updates: Partial<Connection>) => void;
}

function PortHandle({
  x,
  y,
  onDrag,
}: {
  x: number;
  y: number;
  onDrag: (point: { x: number; y: number }) => void;
}) {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragMove={(e) => {
        onDrag({ x: e.target.x(), y: e.target.y() });
        // Keep handle visually on the port while dragging; parent updates position.
        e.target.position({ x, y });
      }}
      onDragEnd={(e) => {
        onDrag({ x: e.target.x(), y: e.target.y() });
        e.target.position({ x, y });
      }}
      onClick={(e) => {
        e.cancelBubble = true;
      }}
    >
      <Circle radius={12} fill="#ffffff" stroke="#0f766e" strokeWidth={1.5} />
      {/* Up / down / left / right arrows */}
      <Path
        data="M0 -7 L-3 -3 L3 -3 Z M0 7 L-3 3 L3 3 Z M-7 0 L-3 -3 L-3 3 Z M7 0 L3 -3 L3 3 Z"
        fill="#0f766e"
        listening={false}
      />
    </Group>
  );
}

function CornerHandle({
  x,
  y,
  axis,
  onMove,
}: {
  x: number;
  y: number;
  axis: "x" | "y";
  onMove: (value: number) => void;
}) {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragMove={(e) => {
        if (axis === "x") {
          onMove(e.target.x());
          e.target.y(y);
        } else {
          onMove(e.target.y());
          e.target.x(x);
        }
      }}
      onDragEnd={(e) => {
        if (axis === "x") {
          onMove(e.target.x());
        } else {
          onMove(e.target.y());
        }
        e.target.position({ x, y });
      }}
      onClick={(e) => {
        e.cancelBubble = true;
      }}
    >
      <Circle radius={7} fill="#ffffff" stroke="#334155" strokeWidth={1.5} />
    </Group>
  );
}

export function ConnectionLine({
  connection,
  shapes,
  isSelected,
  onSelect,
  onDelete,
  onChange,
}: ConnectionLineProps) {
  const [hovered, setHovered] = useState(false);
  const from = shapes.find((s) => s.id === connection.fromId);
  const to = shapes.find((s) => s.id === connection.toId);

  if (!from || !to) return null;

  const orthogonal =
    connection.orthogonal ?? DEFAULT_CONNECTION_PROPS.orthogonal;
  const points = getConnectionLinePoints(from, to, connection);
  const route = orthogonal
    ? getOrthogonalRoute(from, to, connection)
    : null;

  const midFlat = Math.max(0, Math.floor(points.length / 2) - 2);
  const midX = (points[midFlat] + points[Math.min(midFlat + 2, points.length - 2)]) / 2;
  const midY =
    (points[midFlat + 1] +
      points[Math.min(midFlat + 3, points.length - 1)]) /
    2;

  const stroke = connection.stroke || DEFAULT_CONNECTION_PROPS.stroke;
  const strokeWidth =
    connection.strokeWidth ?? DEFAULT_CONNECTION_PROPS.strokeWidth;
  const displayWidth = isSelected || hovered ? strokeWidth + 1 : strokeWidth;
  const displayStroke = isSelected ? "#0f766e" : hovered ? "#475569" : stroke;

  const start = route
    ? getCardinalPoint(from, route.fromPort)
    : { x: points[0], y: points[1] };
  const end = route
    ? getCardinalPoint(to, route.toPort)
    : {
        x: points[points.length - 2],
        y: points[points.length - 1],
      };

  const setPortFromPoint = (
    which: "from" | "to",
    point: { x: number; y: number },
  ) => {
    const shape = which === "from" ? from : to;
    const dir = nearestCardinalDir(shape, point);
    if (which === "from") {
      onChange(connection.id, {
        fromPort: dir,
        // Clear bend when ports change so route rebuilds cleanly.
        bend: undefined,
      });
    } else {
      onChange(connection.id, { toPort: dir, bend: undefined });
    }
  };

  const ensurePorts = (): { fromPort: CardinalDir; toPort: CardinalDir } => {
    if (!route) {
      return { fromPort: "e", toPort: "w" };
    }
    return {
      fromPort: connection.fromPort ?? route.fromPort,
      toPort: connection.toPort ?? route.toPort,
    };
  };

  return (
    <Group
      opacity={connection.opacity ?? DEFAULT_CONNECTION_PROPS.opacity}
      onMouseEnter={(e) => {
        setHovered(true);
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "pointer";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
      }}
    >
      <Line
        points={points}
        stroke={displayStroke}
        strokeWidth={displayWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={Math.max(16, strokeWidth + 12)}
        listening
        perfectDrawEnabled={false}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(connection.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(connection.id);
        }}
      />

      {(hovered || isSelected) && !isSelected && (
        <Group
          x={midX}
          y={midY}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete(connection.id);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onDelete(connection.id);
          }}
        >
          <Circle radius={14} fill="#fff" stroke="#ef4444" strokeWidth={1.5} />
          <Path
            data="M-5 -3.5 h10 M-3.5 -3.5 l.7-1.5 h5.6 l.7 1.5 M-3.5 -3.5 v9 a1.5 1.5 0 0 0 1.5 1.5 h4 a1.5 1.5 0 0 0 1.5-1.5 v-9 M-1.5 -1 v6 M1.5 -1 v6"
            stroke="#ef4444"
            strokeWidth={1.4}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        </Group>
      )}

      {isSelected && (
        <Group
          x={midX}
          y={midY - 22}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete(connection.id);
          }}
        >
          <Circle radius={11} fill="#fff" stroke="#ef4444" strokeWidth={1.5} />
          <Path
            data="M-4 -2.5 h8 M-2.5 -2.5 l.5-1 h4 l.5 1 M-2.5 -2.5 v7 a1 1 0 0 0 1 1 h3 a1 1 0 0 0 1-1 v-7"
            stroke="#ef4444"
            strokeWidth={1.2}
            lineCap="round"
            listening={false}
          />
        </Group>
      )}

      {isSelected && orthogonal && route && (
        <>
          <PortHandle
            x={start.x}
            y={start.y}
            onDrag={(point) => setPortFromPoint("from", point)}
          />
          <PortHandle
            x={end.x}
            y={end.y}
            onDrag={(point) => setPortFromPoint("to", point)}
          />

          {route.bendAxis &&
            route.cornerPointIndices.map((pointIndex) => {
              const cx = points[pointIndex * 2];
              const cy = points[pointIndex * 2 + 1];
              return (
                <CornerHandle
                  key={`corner-${pointIndex}`}
                  x={cx}
                  y={cy}
                  axis={route.bendAxis!}
                  onMove={(value) => {
                    const ports = ensurePorts();
                    onChange(connection.id, {
                      fromPort: ports.fromPort,
                      toPort: ports.toPort,
                      bend: value,
                    });
                  }}
                />
              );
            })}

          {!route.bendAxis &&
            route.cornerPointIndices.length === 1 &&
            (() => {
              const pointIndex = route.cornerPointIndices[0];
              const cx = points[pointIndex * 2];
              const cy = points[pointIndex * 2 + 1];
              return (
                <Group
                  key="l-corner"
                  x={cx}
                  y={cy}
                  draggable
                  onDragMove={(e) => {
                    const dx = e.target.x() - cx;
                    const dy = e.target.y() - cy;
                    if (Math.abs(dx) >= Math.abs(dy)) {
                      onChange(connection.id, {
                        fromPort: start.x <= end.x ? "e" : "w",
                        toPort: start.x <= end.x ? "w" : "e",
                        bend: e.target.x(),
                      });
                    } else {
                      onChange(connection.id, {
                        fromPort: start.y <= end.y ? "s" : "n",
                        toPort: start.y <= end.y ? "n" : "s",
                        bend: e.target.y(),
                      });
                    }
                    e.target.position({ x: cx, y: cy });
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true;
                  }}
                >
                  <Circle
                    radius={7}
                    fill="#ffffff"
                    stroke="#334155"
                    strokeWidth={1.5}
                  />
                </Group>
              );
            })()}
        </>
      )}
    </Group>
  );
}
