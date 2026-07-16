# How to read this project (learning guide)

This guide is for someone who knows **basic HTML and JavaScript** and is learning **TypeScript** (and a bit of React / Next.js).

The `commented` branch adds teaching comments in the source files. Read those comments as you go — they explain TypeScript ideas in plain language.

---

## Mental model (30 seconds)

```
User clicks UI
    → Editor / Toolbar call functions
    → useEditorState updates data (shapes, connections)
    → Canvas / ShapeNode / ConnectionLine redraw the picture
```

Data lives in **TypeScript types** (`src/types`).  
Logic lives in **plain functions** (`src/lib`) and a **React hook** (`src/hooks`).  
Drawing lives in **components** (`src/components`).

---

## Suggested reading order

Follow this order. Don’t jump to Konva/canvas first — the data model is easier.

### 1. Types first — what is a shape?

| File | Why read it |
|------|-------------|
| [`src/types/index.ts`](src/types/index.ts) | Core TypeScript: `type`, `interface`, unions (`"circle" \| "text"`), optional `?`, `Record`, `as const`. Everything else builds on this. |

**Checkpoint:** You should understand what a `FlowShape` and a `Connection` look like.

---

### 2. Small pure helpers — TypeScript without React

These files are mostly normal functions. Good practice for typed JS.

| Order | File | What you’ll learn |
|------:|------|-------------------|
| 2a | [`src/lib/shapes.ts`](src/lib/shapes.ts) | Factory function, return types, defaults |
| 2b | [`src/lib/grid.ts`](src/lib/grid.ts) | Parameters, return object types, spreads, `Set` |
| 2c | [`src/lib/selection.ts`](src/lib/selection.ts) | Interfaces, `.filter` / `.map` with types |
| 2d | [`src/lib/align.ts`](src/lib/align.ts) | Union types in `switch`, `Map`, non-null `!` |
| 2e | [`src/lib/exportPng.ts`](src/lib/exportPng.ts) | `string \| null`, optional chaining `?.` |
| 2f | [`src/lib/flowchartFile.ts`](src/lib/flowchartFile.ts) | **Important:** `unknown`, type guards (`value is FlowShape`), validating JSON |
| 2g | [`src/lib/geometry.ts`](src/lib/geometry.ts) | Math helpers; skim first, return later when reading connectors |

**Checkpoint:** You can read a typed function signature like  
`function createShape(type: ShapeType, x: number, y: number): FlowShape`.

---

### 3. App shell — how Next.js starts the page

| Order | File | What you’ll learn |
|------:|------|-------------------|
| 3a | [`src/app/page.tsx`](src/app/page.tsx) | Default export = the `/` route; `@/` path alias |
| 3b | [`src/app/layout.tsx`](src/app/layout.tsx) | Shared HTML shell, `Metadata` type, `children` prop |
| 3c | [`next.config.ts`](next.config.ts) | Static export (`out/` folder for hosting) |

**Checkpoint:** You know where the app “starts” in the browser.

---

### 4. State — the brain of the editor

| File | Why read it |
|------|-------------|
| [`src/hooks/useEditorState.ts`](src/hooks/useEditorState.ts) | `useState`, `useRef`, `useCallback`, `Partial<T>`, updating arrays immutably (`[...prev, shape]`) |

Read slowly. This hook owns:

- shapes & connections
- selection
- copy/paste
- connect mode
- import document

**Checkpoint:** You can explain: “Clicking Add Rectangle calls `addShape`, which updates `shapes`, and React re-renders.”

---

### 5. UI wiring — put the pieces together

| Order | File | What you’ll learn |
|------:|------|-------------------|
| 5a | [`src/components/Editor.tsx`](src/components/Editor.tsx) | Main layout; `dynamic()` import; keyboard shortcuts; PNG/JSON export |
| 5b | [`src/components/Toolbar.tsx`](src/components/Toolbar.tsx) | Props + callback pattern (“lift state up”) |
| 5c | [`src/components/PropertiesSidebar.tsx`](src/components/PropertiesSidebar.tsx) | Conditional UI (`shape \| null`); controlled inputs |

**Checkpoint:** You see how buttons don’t store the flowchart themselves — they call parent callbacks.

---

### 6. Drawing — canvas last

Konva is “React for canvas,” not HTML `<div>`s. Read after the data model clicks.

| Order | File | What you’ll learn |
|------:|------|-------------------|
| 6a | [`src/components/Canvas.tsx`](src/components/Canvas.tsx) | Stage/Layer; pan/zoom; marquee select; instructions overlay |
| 6b | [`src/components/ShapeNode.tsx`](src/components/ShapeNode.tsx) | One shape; drag/resize; `Partial` updates |
| 6c | [`src/components/ConnectionLine.tsx`](src/components/ConnectionLine.tsx) | Lines between shapes; local `useState` for hover |

When something geometric is confusing, jump back to [`src/lib/geometry.ts`](src/lib/geometry.ts).

---

## Folder map

```
src/
  types/          ← data blueprints (start here)
  lib/            ← reusable logic (no UI)
  hooks/          ← React state for the editor
  components/     ← what you see on screen
  app/            ← Next.js pages / layout
```

---

## TypeScript cheat sheet used in this repo

| Syntax | Meaning (plain English) |
|--------|-------------------------|
| `name: string` | This value must be a string |
| `id?: string` | Optional — might be missing |
| `"a" \| "b"` | Must be exactly `"a"` or `"b"` |
| `FlowShape \| null` | A shape, or nothing |
| `interface Foo { ... }` | Blueprint for an object |
| `Partial<FlowShape>` | Any subset of FlowShape fields |
| `Record<ShapeType, string>` | Object map: every shape type → a string |
| `value is FlowShape` | Type guard: after `true`, TS treats value as FlowShape |
| `unknown` | “Don’t trust this yet” (safer than `any`) |
| `as const` | Lock values to exact literals |
| `import type { X }` | Import only for types (erased in JS output) |

---

## How to run while you read

```bash
npm install
npm run dev
```

Open http://localhost:3000, add a shape, connect two shapes, export JSON — then find the matching function in `useEditorState` / `flowchartFile`.

---

## Suggested weekend path

1. Day 1: steps **1–2** (types + lib)  
2. Day 2: steps **3–4** (app + hook)  
3. Day 3: steps **5–6** (UI + canvas)  
4. Challenge: add a new default color in `DEFAULT_SHAPE_PROPS` and see it appear on new shapes  

Happy learning.
