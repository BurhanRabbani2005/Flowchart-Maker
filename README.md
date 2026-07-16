# FlowDraw

Browser-based flowchart editor built with Next.js, React, TypeScript, Tailwind CSS, and React Konva.

## Features

- Infinite canvas with pan (drag empty space) and zoom (mouse wheel)
- Shapes: rectangle, rounded rectangle, circle, diamond, text box
- Drag, resize, and double-click to edit text in place (sidebar editing still works)
- Multi-select mode to select several shapes at once
- Align left / right / top / bottom, and equalize horizontal or vertical spacing
- Style shapes via the right sidebar (fill, border, width, font size)
- Connect mode for straight-line connections that track shape movement
- Export PNG, plus export/import flowchart JSON

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Learning the codebase

On the `commented` branch, see **[LEARNING_GUIDE.md](LEARNING_GUIDE.md)** for a recommended reading order (HTML/JS → TypeScript).

## Project structure

```
src/
  app/                  # Next.js app router
  components/
    Editor.tsx          # Main layout
    Toolbar.tsx         # Top toolbar
    Canvas.tsx          # Konva stage (pan/zoom)
    ShapeNode.tsx       # Shape rendering + resize
    ConnectionLine.tsx  # Straight connectors
    PropertiesSidebar.tsx
  hooks/useEditorState.ts
  lib/geometry.ts       # Connection endpoints
  lib/shapes.ts         # Shape factory
  types/index.ts
```
