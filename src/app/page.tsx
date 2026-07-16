/**
 * Next.js App Router: this file is the homepage route (`/`).
 * Exporting a default React component is how Next knows what to render.
 *
 * `@/components/Editor` is a path alias — see tsconfig.json.
 * `@/` usually means "start from the `src/` folder".
 */
import { Editor } from "@/components/Editor";

export default function Home() {
  // JSX looks like HTML, but it's JavaScript/TypeScript that React turns into DOM.
  return <Editor />;
}
