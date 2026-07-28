/**
 * ============================================================
 * page.tsx — the homepage route `/`
 * ============================================================
 *
 * In Next.js App Router:
 *   src/app/page.tsx  →  what you see at http://localhost:3000/
 *
 * `export default function Home()`
 *   "default export" = the MAIN thing this file provides.
 *   Import without { braces }:
 *     import Home from "./page"   // (Next does this for you)
 *
 * Contrast with named exports:
 *   export function Foo() {}
 *   import { Foo } from "./file"
 */
import { Editor } from "@/components/Editor";
// `@/` is a shortcut to the `src/` folder (configured in tsconfig.json).

export default function Home() {
  // JSX: looks like HTML <Editor />, but it is JavaScript that React renders.
  return <Editor />;
}
