import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { SessionEffects } from "../components/shell/session-effects";
import { fontVariables } from "../lib/fonts";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  description: "何も考えずに始められる開発と公開",
  title: "ADHD Stack",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#121712",
  viewportFit: "cover",
  width: "device-width",
};

interface RootLayoutProperties {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html
      className={`${fontVariables} dark`}
      lang="ja"
      suppressHydrationWarning
    >
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
