"use client";

import { useState } from "react";
import { Circle, Group, Line, Path } from "react-konva";
import { getConnectionEndpoints } from "@/lib/geometry";
import type { Connection, FlowShape } from "@/types";

interface ConnectionLineProps {
  connection: Connection;
  shapes: FlowShape[];
  onDelete: (id: string) => void;
}

export function ConnectionLine({
  connection,
  shapes,
  onDelete,
}: ConnectionLineProps) {
  const [hovered, setHovered] = useState(false);
  const from = shapes.find((s) => s.id === connection.fromId);
  const to = shapes.find((s) => s.id === connection.toId);

  if (!from || !to) return null;

  const { x1, y1, x2, y2 } = getConnectionEndpoints(from, to);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <Group
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
        points={[x1, y1, x2, y2]}
        stroke={hovered ? "#475569" : "#64748b"}
        strokeWidth={hovered ? 3 : 2}
        hitStrokeWidth={20}
      />

      {hovered && (
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
    </Group>
  );
}
