import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { SessionEffects } from "../components/shell/session-effects";
import { fontVariables } from "../lib/fonts";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  description: "何も考えずに始められる開発と反映",
  title: "ADHD Stack",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#f6f7f9",
  viewportFit: "cover",
  width: "device-width",
};

interface RootLayoutProperties {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html className={fontVariables} lang="ja" suppressHydrationWarning>
      <body className="bg-page text-ink min-h-dvh font-sans antialiased">
        <ConvexClientProvider>
          <Suspense fallback={null}>
            <SessionEffects />
          </Suspense>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
