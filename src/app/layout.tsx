/**
 * Root layout wraps EVERY page in the app (like a shared HTML shell).
 * In plain HTML you'd write <html> and <body> yourself once.
 * In Next.js App Router, this file does that job.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Load Google fonts and expose them as CSS variables (e.g. --font-geist-sans).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * `Metadata` is a TypeScript type from Next.js.
 * Typing this object helps catch typos in SEO fields at edit time.
 */
export const metadata: Metadata = {
  title: {
    default: "FlowDraw — Free Online Flowchart Maker",
    template: "%s | FlowDraw",
  },
  description:
    "100% free online flowchart maker. Create and edit flowcharts in your browser with an infinite canvas. No signup, no paywall, no ads behind a login — export JSON or PNG locally anytime.",
  keywords: [
    "free flowchart maker",
    "online flowchart editor",
    "flowchart creator",
    "100% free",
    "no signup",
    "flow diagram",
    "process map",
    "FlowDraw",
  ],
  authors: [{ name: "FlowDraw" }],
  creator: "FlowDraw",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "FlowDraw — Free Online Flowchart Maker",
    description:
      "100% free flowchart editor in your browser. No account required. Export a local copy to keep your work safe.",
    type: "website",
    siteName: "FlowDraw",
  },
  twitter: {
    card: "summary",
    title: "FlowDraw — Free Online Flowchart Maker",
    description:
      "100% free online flowchart maker. No signup. Export locally to keep your charts safe.",
  },
  category: "productivity",
};

/**
 * Function parameter typing example:
 * `{ children }: { children: React.ReactNode }`
 * means the component receives a prop named `children`
 * (whatever is nested inside <RootLayout>...</RootLayout>).
 *
 * `Readonly<...>` means you shouldn't reassign those props.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-hidden bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
