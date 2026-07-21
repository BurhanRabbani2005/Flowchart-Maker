import { Suspense } from "react";
import type { Metadata } from "next";
import EditorPageClient from "./EditorPageClient";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center text-sm text-slate-500">
          Opening flowchart…
        </div>
      }
    >
      <EditorPageClient />
    </Suspense>
  );
}
